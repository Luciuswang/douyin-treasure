import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../../models/task.dart';
import '../../providers/merchant_provider.dart';

/// 创建任务页面
class CreateTaskScreen extends StatefulWidget {
  const CreateTaskScreen({super.key});

  @override
  State<CreateTaskScreen> createState() => _CreateTaskScreenState();
}

class _CreateTaskScreenState extends State<CreateTaskScreen> {
  final _formKey = GlobalKey<FormState>();
  final _uuid = const Uuid();
  
  // 表单字段
  String _title = '';
  String _description = '';
  TaskType _type = TaskType.checkIn;
  TaskDifficulty _difficulty = TaskDifficulty.easy;
  TaskVerification _verification = TaskVerification.location;
  int _experience = 50;
  int _coins = 10;
  String? _coupon;
  int _totalSlots = 100;
  int _daysValid = 7;
  
  bool _isSubmitting = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('发布任务'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // 任务标题
            TextFormField(
              decoration: const InputDecoration(
                labelText: '任务标题',
                hintText: '例如：咖啡打卡任务',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '请输入任务标题';
                }
                return null;
              },
              onSaved: (value) => _title = value!,
            ),
            const SizedBox(height: 16),
            
            // 任务描述
            TextFormField(
              decoration: const InputDecoration(
                labelText: '任务描述',
                hintText: '描述任务的具体要求',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '请输入任务描述';
                }
                return null;
              },
              onSaved: (value) => _description = value!,
            ),
            const SizedBox(height: 16),
            
            // 任务类型
            DropdownButtonFormField<TaskType>(
              value: _type,
              decoration: const InputDecoration(
                labelText: '任务类型',
                border: OutlineInputBorder(),
              ),
              items: TaskType.values.map((type) {
                return DropdownMenuItem(
                  value: type,
                  child: Row(
                    children: [
                      Icon(type.icon, size: 20),
                      const SizedBox(width: 8),
                      Text(type.displayName),
                    ],
                  ),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _type = value!;
                });
              },
            ),
            const SizedBox(height: 16),
            
            // 验证方式
            DropdownButtonFormField<TaskVerification>(
              value: _verification,
              decoration: const InputDecoration(
                labelText: '验证方式',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(
                  value: TaskVerification.location,
                  child: Text('GPS定位验证'),
                ),
                DropdownMenuItem(
                  value: TaskVerification.qrCode,
                  child: Text('二维码验证'),
                ),
                DropdownMenuItem(
                  value: TaskVerification.photo,
                  child: Text('拍照验证'),
                ),
              ],
              onChanged: (value) {
                setState(() {
                  _verification = value!;
                });
              },
            ),
            const SizedBox(height: 16),
            
            // 任务难度
            DropdownButtonFormField<TaskDifficulty>(
              value: _difficulty,
              decoration: const InputDecoration(
                labelText: '任务难度',
                border: OutlineInputBorder(),
              ),
              items: TaskDifficulty.values.map((difficulty) {
                return DropdownMenuItem(
                  value: difficulty,
                  child: Text(difficulty.displayName),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _difficulty = value!;
                });
              },
            ),
            const SizedBox(height: 16),
            
            // 奖励设置
            const Text(
              '奖励设置',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    decoration: const InputDecoration(
                      labelText: '经验值',
                      border: OutlineInputBorder(),
                      suffixText: 'EXP',
                    ),
                    keyboardType: TextInputType.number,
                    initialValue: '50',
                    validator: (value) {
                      if (value == null || int.tryParse(value) == null) {
                        return '请输入有效数字';
                      }
                      return null;
                    },
                    onSaved: (value) => _experience = int.parse(value!),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    decoration: const InputDecoration(
                      labelText: '金币',
                      border: OutlineInputBorder(),
                      suffixText: '💰',
                    ),
                    keyboardType: TextInputType.number,
                    initialValue: '10',
                    validator: (value) {
                      if (value == null || int.tryParse(value) == null) {
                        return '请输入有效数字';
                      }
                      return null;
                    },
                    onSaved: (value) => _coins = int.parse(value!),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            
            TextFormField(
              decoration: const InputDecoration(
                labelText: '优惠券（可选）',
                hintText: '例如：满30减10券',
                border: OutlineInputBorder(),
              ),
              onSaved: (value) => _coupon = value?.isEmpty == true ? null : value,
            ),
            const SizedBox(height: 16),
            
            // 任务设置
            const Text(
              '任务设置',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    decoration: const InputDecoration(
                      labelText: '任务名额',
                      border: OutlineInputBorder(),
                      suffixText: '人',
                    ),
                    keyboardType: TextInputType.number,
                    initialValue: '100',
                    validator: (value) {
                      if (value == null || int.tryParse(value) == null) {
                        return '请输入有效数字';
                      }
                      return null;
                    },
                    onSaved: (value) => _totalSlots = int.parse(value!),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    decoration: const InputDecoration(
                      labelText: '有效期',
                      border: OutlineInputBorder(),
                      suffixText: '天',
                    ),
                    keyboardType: TextInputType.number,
                    initialValue: '7',
                    validator: (value) {
                      if (value == null || int.tryParse(value) == null) {
                        return '请输入有效数字';
                      }
                      return null;
                    },
                    onSaved: (value) => _daysValid = int.parse(value!),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // 提交按钮
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitTask,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: Colors.blue,
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text(
                      '发布任务',
                      style: TextStyle(fontSize: 16, color: Colors.white),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitTask() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    
    _formKey.currentState!.save();
    
    setState(() {
      _isSubmitting = true;
    });
    
    final merchantProvider = context.read<MerchantProvider>();
    final merchant = merchantProvider.currentMerchant;
    
    if (merchant == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('商家信息错误')),
        );
      }
      setState(() {
        _isSubmitting = false;
      });
      return;
    }
    
    final task = Task(
      id: _uuid.v4(),
      merchantId: merchant.id,
      merchantName: merchant.name,
      title: _title,
      description: _description,
      type: _type,
      difficulty: _difficulty,
      verification: _verification,
      latitude: merchant.latitude,
      longitude: merchant.longitude,
      experience: _experience,
      coins: _coins,
      coupon: _coupon,
      maxCompletions: _totalSlots,
      currentCompletions: 0,
      startTime: DateTime.now(),
      endTime: DateTime.now().add(Duration(days: _daysValid)),
      status: TaskStatus.available,
    );
    
    final success = await merchantProvider.createTask(task);
    
    setState(() {
      _isSubmitting = false;
    });
    
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('任务发布成功！'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('任务发布失败，请重试'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

