import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import '../services/location_service.dart';
import '../providers/user_provider.dart';
import '../providers/treasure_provider.dart';
import '../providers/task_provider.dart';
import '../models/treasure.dart';
import '../models/task.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final _locationService = LocationService();
  Position? _currentPosition;
  bool _isLoading = true;
  String _statusMessage = '正在初始化...';

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    setState(() {
      _statusMessage = '正在请求定位权限...';
    });

    // 请求权限
    final hasPermission = await _locationService.checkAndRequestPermission();
    if (!hasPermission) {
      setState(() {
        _isLoading = false;
        _statusMessage = '定位权限被拒绝';
      });
      _showPermissionDialog();
      return;
    }

    // 获取当前位置
    setState(() {
      _statusMessage = '正在获取GPS位置...';
    });

    final position = await _locationService.getCurrentPosition();
    if (position == null) {
      setState(() {
        _isLoading = false;
        _statusMessage = '定位失败，请重试';
      });
      return;
    }

    setState(() {
      _currentPosition = position;
      _isLoading = false;
      _statusMessage = '定位成功！';
    });

    // 生成宝藏
    if (mounted) {
      final treasureProvider = context.read<TreasureProvider>();
      await treasureProvider.generateNearbyTreasures(
        position.latitude,
        position.longitude,
      );
    }

    // 开始持续定位
    _locationService.startLocationUpdates();
    _listenToLocationUpdates();
  }

  void _listenToLocationUpdates() {
    _locationService.positionStream.listen((position) {
      setState(() {
        _currentPosition = position;
      });
      _checkNearbyTreasures(position);
    });
  }

  void _checkNearbyTreasures(Position position) {
    final treasureProvider = context.read<TreasureProvider>();
    final userProvider = context.read<UserProvider>();

    for (final treasure in treasureProvider.undiscoveredTreasures) {
      final distance = _locationService.calculateDistance(
        position.latitude,
        position.longitude,
        treasure.latitude,
        treasure.longitude,
      );

      // 在发现范围内
      if (distance <= treasure.discoveryRadius) {
        _onTreasureDiscovered(treasure, userProvider, treasureProvider);
      }
    }
  }

  Future<void> _onTreasureDiscovered(
    Treasure treasure,
    UserProvider userProvider,
    TreasureProvider treasureProvider,
  ) async {
    await treasureProvider.discoverTreasure(treasure.id);
    await userProvider.discoverTreasure(
      treasure.id,
      treasure.experience,
      treasure.coins,
    );

    if (mounted) {
      _showTreasureDiscoveredDialog(treasure);
    }
  }

  void _showTreasureDiscoveredDialog(Treasure treasure) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Text(treasure.type.emoji, style: const TextStyle(fontSize: 32)),
            const SizedBox(width: 12),
            Expanded(child: Text('发现${treasure.name}！')),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(treasure.description),
            const SizedBox(height: 16),
            Text('🎯 经验 +${treasure.experience}'),
            Text('💰 金币 +${treasure.coins}'),
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

  void _showPermissionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('需要定位权限'),
        content: const Text('请在设置中允许访问位置信息'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Geolocator.openAppSettings();
            },
            child: const Text('去设置'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Totofun 突突翻'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {
              // TODO: 打开个人中心
            },
          ),
        ],
      ),
      body: _isLoading
          ? _buildLoadingScreen()
          : _currentPosition == null
              ? _buildErrorScreen()
              : _buildMapScreen(),
      floatingActionButton: _currentPosition != null
          ? Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                FloatingActionButton(
                  heroTag: 'refresh',
                  onPressed: _refreshTreasures,
                  child: const Icon(Icons.refresh),
                ),
                const SizedBox(height: 16),
                FloatingActionButton(
                  heroTag: 'location',
                  onPressed: () {
                    // 重新获取位置
                    _initializeApp();
                  },
                  child: const Icon(Icons.my_location),
                ),
              ],
            )
          : null,
    );
  }

  Widget _buildLoadingScreen() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 24),
          Text(_statusMessage, style: const TextStyle(fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildErrorScreen() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 24),
          Text(_statusMessage, style: const TextStyle(fontSize: 16)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _initializeApp,
            child: const Text('重试'),
          ),
        ],
      ),
    );
  }

  Widget _buildMapScreen() {
    return Consumer3<UserProvider, TreasureProvider, TaskProvider>(
      builder: (context, userProvider, treasureProvider, taskProvider, child) {
        return Stack(
          children: [
            _buildSimpleMap(treasureProvider.treasures, taskProvider.tasks),
            _buildUserInfoPanel(userProvider),
          ],
        );
      },
    );
  }

  Widget _buildSimpleMap(List<Treasure> treasures, List<Task> tasks) {
    // 获取附近的任务
    final nearbyTasks = _currentPosition != null
        ? tasks.where((task) {
            if (!task.isAvailable) return false;
            final distance = _locationService.calculateDistance(
              _currentPosition!.latitude,
              _currentPosition!.longitude,
              task.latitude,
              task.longitude,
            );
            return distance <= 2000; // 2公里内
          }).toList()
        : <Task>[];

    return Container(
      color: Colors.grey[200],
      child: Stack(
        children: [
          // 简单的地图背景
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.map, size: 100, color: Colors.grey),
                const SizedBox(height: 16),
                Text(
                  '📍 当前位置',
                  style: TextStyle(fontSize: 18, color: Colors.grey[700]),
                ),
                const SizedBox(height: 8),
                if (_currentPosition != null)
                  Text(
                    '纬度: ${_currentPosition!.latitude.toStringAsFixed(6)}\n经度: ${_currentPosition!.longitude.toStringAsFixed(6)}',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                  ),
                const SizedBox(height: 16),
                // 统计信息
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildStatChip('🎁 宝藏', treasures.where((t) => !t.discovered).length),
                    const SizedBox(width: 16),
                    _buildStatChip('📋 任务', nearbyTasks.length),
                  ],
                ),
              ],
            ),
          ),
          // 宝藏和任务列表
          Positioned(
            bottom: 100,
            left: 16,
            right: 16,
            child: DefaultTabController(
              length: 2,
              child: Card(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const TabBar(
                      labelColor: Colors.blue,
                      unselectedLabelColor: Colors.grey,
                      indicatorSize: TabBarIndicatorSize.label,
                      tabs: [
                        Tab(text: '🎁 宝藏'),
                        Tab(text: '📋 任务'),
                      ],
                    ),
                    Container(
                      constraints: const BoxConstraints(maxHeight: 200),
                      child: TabBarView(
                        children: [
                          _buildTreasureList(treasures),
                          _buildTaskList(nearbyTasks),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatChip(String text, int count) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        '$text: $count',
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Colors.blue,
        ),
      ),
    );
  }

  Widget _buildTreasureList(List<Treasure> treasures) {
    final undiscovered = treasures.where((t) => !t.discovered).toList();
    
    if (undiscovered.isEmpty) {
      return const Center(child: Text('附近没有宝藏'));
    }

    return ListView.builder(
      shrinkWrap: true,
      itemCount: undiscovered.length,
      itemBuilder: (context, index) {
        final treasure = undiscovered[index];
        final distance = _locationService.calculateDistance(
          _currentPosition!.latitude,
          _currentPosition!.longitude,
          treasure.latitude,
          treasure.longitude,
        );
        
        return ListTile(
          leading: Text(treasure.type.emoji, style: const TextStyle(fontSize: 32)),
          title: Text(treasure.name),
          subtitle: Text('${distance.toStringAsFixed(0)}米'),
          trailing: distance <= treasure.discoveryRadius
              ? const Icon(Icons.check_circle, color: Colors.green)
              : const Icon(Icons.arrow_forward),
        );
      },
    );
  }

  Widget _buildTaskList(List<Task> tasks) {
    if (tasks.isEmpty) {
      return const Center(child: Text('附近没有任务'));
    }

    return ListView.builder(
      shrinkWrap: true,
      itemCount: tasks.length,
      itemBuilder: (context, index) {
        final task = tasks[index];
        final distance = _locationService.calculateDistance(
          _currentPosition!.latitude,
          _currentPosition!.longitude,
          task.latitude,
          task.longitude,
        );
        
        return ListTile(
          leading: Icon(task.typeIcon, size: 32, color: Colors.blue),
          title: Text(task.title),
          subtitle: Row(
            children: [
              Text('${task.merchantName} • '),
              Text('${distance.toStringAsFixed(0)}米'),
            ],
          ),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '🎯${task.experience}',
                style: const TextStyle(fontSize: 12, color: Colors.blue),
              ),
              const SizedBox(width: 4),
              Text(
                '💰${task.coins}',
                style: const TextStyle(fontSize: 12, color: Colors.orange),
              ),
            ],
          ),
          onTap: () => _showTaskDetailFromMap(task),
        );
      },
    );
  }

  void _showTaskDetailFromMap(Task task) {
    final distance = _locationService.calculateDistance(
      _currentPosition!.latitude,
      _currentPosition!.longitude,
      task.latitude,
      task.longitude,
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.9,
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
                      Icon(task.typeIcon, size: 32, color: Colors.blue),
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
                  
                  // 商家和距离
                  Row(
                    children: [
                      const Icon(Icons.store, size: 20, color: Colors.grey),
                      const SizedBox(width: 8),
                      Text(task.merchantName),
                      const SizedBox(width: 16),
                      const Icon(Icons.location_on, size: 20, color: Colors.grey),
                      const SizedBox(width: 8),
                      Text('${distance.toStringAsFixed(0)}米'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // 任务描述
                  Text(task.description),
                  const SizedBox(height: 16),
                  
                  // 奖励
                  const Text(
                    '任务奖励',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      _buildRewardChip('🎯 ${task.experience}经验', Colors.blue),
                      _buildRewardChip('💰 ${task.coins}金币', Colors.orange),
                      if (task.coupon != null)
                        _buildRewardChip('🎁 ${task.coupon}', Colors.purple),
                    ],
                  ),
                  const SizedBox(height: 24),
                  
                  // 按钮
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.pop(context);
                            // 切换到任务页面
                            DefaultTabController.of(context)?.animateTo(1);
                          },
                          icon: const Icon(Icons.list),
                          label: const Text('查看详情'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () async {
                            Navigator.pop(context);
                            final taskProvider = context.read<TaskProvider>();
                            await taskProvider.acceptTask(task.id);
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('已接取任务：${task.title}'),
                                  backgroundColor: Colors.green,
                                ),
                              );
                            }
                          },
                          icon: const Icon(Icons.check),
                          label: const Text('接取任务'),
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

  Widget _buildUserInfoPanel(UserProvider userProvider) {
    final user = userProvider.user;
    return Positioned(
      top: 16,
      left: 16,
      right: 16,
      child: Card(
        elevation: 4,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('等级 ${user.level}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              LinearProgressIndicator(value: user.levelProgress),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('🎯 ${user.experience}/${user.experienceForNextLevel}'),
                  Text('💰 ${user.coins}'),
                  Text('🎁 ${user.treasuresDiscovered}'),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _refreshTreasures() async {
    if (_currentPosition == null) return;
    
    final treasureProvider = context.read<TreasureProvider>();
    await treasureProvider.clearAllTreasures();
    await treasureProvider.generateNearbyTreasures(
      _currentPosition!.latitude,
      _currentPosition!.longitude,
    );
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('已刷新宝藏！')),
      );
    }
  }

  @override
  void dispose() {
    _locationService.stopLocationUpdates();
    super.dispose();
  }
}
