import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import '../models/task.dart';
import '../providers/task_provider.dart';
import '../providers/user_provider.dart';
import '../services/location_service.dart';
import '../services/verification_service.dart';
import 'qr_scan_screen.dart';
import 'photo_verification_screen.dart';

class TaskScreen extends StatefulWidget {
  const TaskScreen({super.key});

  @override
  State<TaskScreen> createState() => _TaskScreenState();
}

class _TaskScreenState extends State<TaskScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _locationService = LocationService();
  final _verificationService = VerificationService();
  Position? _currentPosition;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadCurrentPosition();
  }

  Future<void> _loadCurrentPosition() async {
    final position = await _locationService.getCurrentPosition();
    if (position != null && mounted) {
      setState(() {
        _currentPosition = position;
      });
      
      // 生成示例任务
      final taskProvider = context.read<TaskProvider>();
      if (taskProvider.tasks.isEmpty) {
        await taskProvider.generateSampleTasks(
          position.latitude,
          position.longitude,
        );
      }
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('任务大厅'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: '可接取'),
            Tab(text: '进行中'),
            Tab(text: '已完成'),
          ],
        ),
      ),
      body: _currentPosition == null
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildAvailableTasks(),
                _buildInProgressTasks(),
                _buildCompletedTasks(),
              ],
            ),
    );
  }

  Widget _buildAvailableTasks() {
    return Consumer<TaskProvider>(
      builder: (context, taskProvider, child) {
        final tasks = taskProvider.getNearbyTasks(
          _currentPosition!.latitude,
          _currentPosition!.longitude,
        );

        if (tasks.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.task_alt, size: 64, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text(
                  '附近暂无任务',
                  style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: tasks.length,
          itemBuilder: (context, index) {
            return _buildTaskCard(tasks[index]);
          },
        );
      },
    );
  }

  Widget _buildInProgressTasks() {
    return Consumer<TaskProvider>(
      builder: (context, taskProvider, child) {
        final tasks = taskProvider.inProgressTasks;

        if (tasks.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.hourglass_empty, size: 64, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text(
                  '暂无进行中的任务',
                  style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: tasks.length,
          itemBuilder: (context, index) {
            return _buildTaskCard(tasks[index], showProgress: true);
          },
        );
      },
    );
  }

  Widget _buildCompletedTasks() {
    return Consumer<TaskProvider>(
      builder: (context, taskProvider, child) {
        final tasks = taskProvider.completedTasks;

        if (tasks.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.check_circle_outline, size: 64, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text(
                  '还没有完成任何任务',
                  style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: tasks.length,
          itemBuilder: (context, index) {
            return _buildTaskCard(tasks[index], showCompleted: true);
          },
        );
      },
    );
  }

  Widget _buildTaskCard(Task task, {bool showProgress = false, bool showCompleted = false}) {
    final distance = _locationService.calculateDistance(
      _currentPosition!.latitude,
      _currentPosition!.longitude,
      task.latitude,
      task.longitude,
    );

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      child: InkWell(
        onTap: () => _showTaskDetail(task),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 标题行
              Row(
                children: [
                  Icon(task.typeIcon, size: 24, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      task.title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: task.difficultyColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      task.difficultyText,
                      style: TextStyle(
                        fontSize: 12,
                        color: task.difficultyColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              
              // 商家名称
              Row(
                children: [
                  const Icon(Icons.store, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    task.merchantName,
                    style: const TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                  const SizedBox(width: 16),
                  const Icon(Icons.location_on, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    '${distance.toStringAsFixed(0)}米',
                    style: const TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              
              // 任务描述
              Text(
                task.description,
                style: const TextStyle(fontSize: 14, color: Colors.black87),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              
              // 奖励信息
              Row(
                children: [
                  _buildRewardChip('🎯 ${task.experience}经验', Colors.blue),
                  const SizedBox(width: 8),
                  _buildRewardChip('💰 ${task.coins}金币', Colors.orange),
                  if (task.coupon != null) ...[
                    const SizedBox(width: 8),
                    _buildRewardChip('🎁 ${task.coupon}', Colors.purple),
                  ],
                ],
              ),
              const SizedBox(height: 12),
              
              // 底部信息
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '剩余 ${task.remainingSlots} 个名额',
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  if (showCompleted)
                    const Row(
                      children: [
                        Icon(Icons.check_circle, size: 16, color: Colors.green),
                        SizedBox(width: 4),
                        Text(
                          '已完成',
                          style: TextStyle(fontSize: 12, color: Colors.green),
                        ),
                      ],
                    )
                  else if (showProgress)
                    TextButton(
                      onPressed: () => _completeTask(task),
                      child: const Text('完成任务'),
                    )
                  else
                    ElevatedButton(
                      onPressed: () => _acceptTask(task),
                      child: const Text('接取任务'),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRewardChip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          color: color,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  void _showTaskDetail(Task task) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) {
          return SingleChildScrollView(
            controller: scrollController,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 标题
                  Row(
                    children: [
                      Icon(task.typeIcon, size: 32, color: Theme.of(context).colorScheme.primary),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          task.title,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // 商家信息
                  _buildDetailRow(Icons.store, '商家', task.merchantName),
                  _buildDetailRow(Icons.category, '类型', task.typeText),
                  _buildDetailRow(Icons.signal_cellular_alt, '难度', task.difficultyText),
                  const SizedBox(height: 16),
                  
                  // 任务描述
                  const Text(
                    '任务描述',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(task.description, style: const TextStyle(fontSize: 14)),
                  const SizedBox(height: 16),
                  
                  // 任务要求
                  if (task.requirements != null) ...[
                    const Text(
                      '任务要求',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    ...task.requirements!.map((req) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('• ', style: TextStyle(fontSize: 14)),
                          Expanded(child: Text(req, style: const TextStyle(fontSize: 14))),
                        ],
                      ),
                    )),
                    const SizedBox(height: 16),
                  ],
                  
                  // 任务步骤
                  if (task.steps != null) ...[
                    const Text(
                      '完成步骤',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    ...task.steps!.map((step) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text(step, style: const TextStyle(fontSize: 14)),
                    )),
                    const SizedBox(height: 16),
                  ],
                  
                  // 奖励信息
                  const Text(
                    '任务奖励',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildRewardChip('🎯 ${task.experience}经验', Colors.blue),
                      _buildRewardChip('💰 ${task.coins}金币', Colors.orange),
                      if (task.coupon != null)
                        _buildRewardChip('🎁 ${task.coupon}', Colors.purple),
                    ],
                  ),
                  const SizedBox(height: 24),
                  
                  // 按钮
                  if (task.status == TaskStatus.available)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _acceptTask(task);
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('接取任务', style: TextStyle(fontSize: 16)),
                      ),
                    )
                  else if (task.status == TaskStatus.inProgress)
                    Column(
                      children: [
                        // 验证方式提示
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                task.verification == TaskVerification.qrCode
                                    ? Icons.qr_code_scanner
                                    : task.verification == TaskVerification.photo
                                        ? Icons.camera_alt
                                        : Icons.location_on,
                                color: Colors.blue,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  task.verification == TaskVerification.qrCode
                                      ? '需要扫描商家二维码验证'
                                      : task.verification == TaskVerification.photo
                                          ? '需要拍照上传验证'
                                          : 'GPS定位验证',
                                  style: const TextStyle(fontSize: 14),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        // 完成任务按钮
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () {
                              Navigator.pop(context);
                              _verifyAndCompleteTask(task);
                            },
                            icon: const Icon(Icons.check_circle),
                            label: const Text('完成任务', style: TextStyle(fontSize: 16)),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              backgroundColor: Colors.green,
                            ),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey),
          const SizedBox(width: 8),
          Text('$label: ', style: const TextStyle(fontSize: 14, color: Colors.grey)),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Future<void> _acceptTask(Task task) async {
    final taskProvider = context.read<TaskProvider>();
    final success = await taskProvider.acceptTask(task.id);
    
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('已接取任务：${task.title}'),
          backgroundColor: Colors.green,
        ),
      );
      _tabController.animateTo(1); // 切换到"进行中"标签
    }
  }

  /// 验证并完成任务
  Future<void> _verifyAndCompleteTask(Task task) async {
    if (_currentPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('正在获取位置...')),
      );
      return;
    }

    bool verified = false;

    // 根据不同的验证方式进行验证
    switch (task.verification) {
      case TaskVerification.location:
        // GPS定位验证
        final result = await _verificationService.verifyByGPS(
          userPosition: _currentPosition!,
          targetLat: task.latitude,
          targetLon: task.longitude,
          maxDistance: 50.0,
        );
        
        if (result.success) {
          verified = true;
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(result.message)),
            );
          }
        }
        break;

      case TaskVerification.qrCode:
        // 二维码扫描验证
        final qrData = await Navigator.push<String>(
          context,
          MaterialPageRoute(
            builder: (context) => QRScanScreen(
              taskId: task.id,
              taskTitle: task.title,
            ),
          ),
        );

        if (qrData != null && qrData.isNotEmpty) {
          final result = _verificationService.verifyByQRCode(
            scannedData: qrData,
            expectedData: task.id,
          );
          
          if (result.success) {
            verified = true;
          } else {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(result.message)),
              );
            }
          }
        }
        break;

      case TaskVerification.photo:
        // 拍照上传验证
        final photoResult = await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => PhotoVerificationScreen(
              taskId: task.id,
              taskTitle: task.title,
              instructions: '请拍摄${task.merchantName}的门头或店内照片',
            ),
          ),
        );

        if (photoResult != null && photoResult['success'] == true) {
          // 还需要验证GPS
          final gpsResult = await _verificationService.verifyByGPS(
            userPosition: _currentPosition!,
            targetLat: task.latitude,
            targetLon: task.longitude,
            maxDistance: 100.0, // 拍照任务GPS范围放宽到100米
          );
          
          if (gpsResult.success) {
            verified = true;
          } else {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(gpsResult.message)),
              );
            }
          }
        }
        break;

      default:
        // 其他验证方式（如receipt、manual）
        verified = true; // 暂时默认通过
    }

    // 如果验证通过，完成任务
    if (verified) {
      await _completeTask(task);
    }
  }

  Future<void> _completeTask(Task task) async {
    // 完成任务
    final taskProvider = context.read<TaskProvider>();
    final success = await taskProvider.completeTask(task.id);
    
    if (success && mounted) {
      // 发放奖励
      final userProvider = context.read<UserProvider>();
      await userProvider.addExperience(task.experience);
      await userProvider.addCoins(task.coins);
      
      // 显示奖励对话框
      _showRewardDialog(task);
    }
  }

  void _showRewardDialog(Task task) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.celebration, color: Colors.orange, size: 32),
            SizedBox(width: 12),
            Text('任务完成！'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('恭喜完成任务：${task.title}'),
            const SizedBox(height: 16),
            const Text('获得奖励：', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('🎯 经验 +${task.experience}'),
            Text('💰 金币 +${task.coins}'),
            if (task.coupon != null) Text('🎁 ${task.coupon}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('太好了！'),
          ),
        ],
      ),
    );
  }
}

