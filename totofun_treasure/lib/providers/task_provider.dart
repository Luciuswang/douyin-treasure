import 'dart:math';
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/task.dart';
import '../services/storage_service.dart';
import '../services/location_service.dart';

class TaskProvider with ChangeNotifier {
  final List<Task> _tasks = [];
  final _storageService = StorageService();
  final _locationService = LocationService();
  final _uuid = const Uuid();

  List<Task> get tasks => _tasks;
  
  /// 可接取的任务
  List<Task> get availableTasks =>
      _tasks.where((t) => t.isAvailable).toList();
  
  /// 进行中的任务
  List<Task> get inProgressTasks =>
      _tasks.where((t) => t.status == TaskStatus.inProgress).toList();
  
  /// 已完成的任务
  List<Task> get completedTasks =>
      _tasks.where((t) => t.status == TaskStatus.completed).toList();
  
  /// 附近的任务（按距离排序）
  List<Task> getNearbyTasks(double userLat, double userLon, {double maxDistance = 5000}) {
    return _tasks.where((task) {
      if (!task.isAvailable) return false;
      final distance = _locationService.calculateDistance(
        userLat,
        userLon,
        task.latitude,
        task.longitude,
      );
      return distance <= maxDistance;
    }).toList()
      ..sort((a, b) {
        final distA = _locationService.calculateDistance(
          userLat,
          userLon,
          a.latitude,
          a.longitude,
        );
        final distB = _locationService.calculateDistance(
          userLat,
          userLon,
          b.latitude,
          b.longitude,
        );
        return distA.compareTo(distB);
      });
  }

  TaskProvider() {
    _loadTasks();
  }

  /// 加载任务数据
  Future<void> _loadTasks() async {
    // TODO: 从服务器加载任务
    // 暂时使用本地存储
    notifyListeners();
  }

  /// 保存任务数据
  Future<void> _saveTasks() async {
    // TODO: 保存到服务器
    notifyListeners();
  }

  /// 生成示例任务（用于测试）
  Future<void> generateSampleTasks(double userLat, double userLon) async {
    _tasks.clear();

    final random = Random();
    final now = DateTime.now();

    // 生成5个示例任务
    for (int i = 0; i < 5; i++) {
      final angle = random.nextDouble() * 2 * pi;
      final distance = random.nextDouble() * 0.005 + 0.001; // 100-600米

      final lat = userLat + sin(angle) * distance;
      final lon = userLon + cos(angle) * distance;

      final taskTypes = [
        TaskType.checkIn,
        TaskType.purchase,
        TaskType.photo,
        TaskType.review,
      ];

      final type = taskTypes[random.nextInt(taskTypes.length)];

      final task = Task(
        id: _uuid.v4(),
        merchantId: 'merchant_$i',
        merchantName: _getMerchantName(i),
        title: _getTaskTitle(type, i),
        description: _getTaskDescription(type),
        type: type,
        difficulty: TaskDifficulty.values[random.nextInt(3)],
        verification: _getVerification(type),
        latitude: lat,
        longitude: lon,
        triggerRadius: 100.0,
        experience: _getExperience(type),
        coins: _getCoins(type),
        coupon: _getCoupon(type),
        startTime: now,
        endTime: now.add(const Duration(days: 7)),
        maxCompletions: 50 + random.nextInt(50),
        currentCompletions: random.nextInt(20),
        requirements: _getRequirements(type),
        steps: _getSteps(type),
      );

      _tasks.add(task);
    }

    await _saveTasks();
    print('🎯 生成了${_tasks.length}个示例任务');
  }

  /// 接取任务
  Future<bool> acceptTask(String taskId) async {
    final index = _tasks.indexWhere((t) => t.id == taskId);
    if (index == -1) return false;

    final task = _tasks[index];
    if (!task.isAvailable) return false;

    _tasks[index] = task.copyWith(
      status: TaskStatus.inProgress,
      acceptedTime: DateTime.now(),
    );

    await _saveTasks();
    notifyListeners();
    
    print('✅ 接取任务: ${task.title}');
    return true;
  }

  /// 完成任务
  Future<bool> completeTask(String taskId) async {
    final index = _tasks.indexWhere((t) => t.id == taskId);
    if (index == -1) return false;

    final task = _tasks[index];
    if (task.status != TaskStatus.inProgress) return false;

    _tasks[index] = task.copyWith(
      status: TaskStatus.completed,
      completedTime: DateTime.now(),
      currentCompletions: task.currentCompletions + 1,
    );

    await _saveTasks();
    notifyListeners();
    
    print('🎉 完成任务: ${task.title}');
    return true;
  }

  /// 检查是否在任务触发范围内
  bool isInTaskRange(String taskId, double userLat, double userLon) {
    final task = _tasks.firstWhere(
      (t) => t.id == taskId,
      orElse: () => throw Exception('Task not found'),
    );

    final distance = _locationService.calculateDistance(
      userLat,
      userLon,
      task.latitude,
      task.longitude,
    );

    return distance <= task.triggerRadius;
  }

  /// 获取任务距离
  double getTaskDistance(String taskId, double userLat, double userLon) {
    final task = _tasks.firstWhere(
      (t) => t.id == taskId,
      orElse: () => throw Exception('Task not found'),
    );

    return _locationService.calculateDistance(
      userLat,
      userLon,
      task.latitude,
      task.longitude,
    );
  }

  // ========== 辅助方法 ==========

  String _getMerchantName(int index) {
    final names = [
      '星巴克咖啡',
      '肯德基',
      '海底捞火锅',
      '喜茶',
      '健身房24小时',
    ];
    return names[index % names.length];
  }

  String _getTaskTitle(TaskType type, int index) {
    switch (type) {
      case TaskType.checkIn:
        return '到店打卡任务';
      case TaskType.purchase:
        return '消费满减任务';
      case TaskType.photo:
        return '拍照分享任务';
      case TaskType.review:
        return '评价好评任务';
      default:
        return '特殊任务';
    }
  }

  String _getTaskDescription(TaskType type) {
    switch (type) {
      case TaskType.checkIn:
        return '到店打卡即可获得奖励';
      case TaskType.purchase:
        return '消费满50元即可获得奖励';
      case TaskType.photo:
        return '拍照并分享到朋友圈';
      case TaskType.review:
        return '给商家写一条好评';
      default:
        return '完成任务获得奖励';
    }
  }

  TaskVerification _getVerification(TaskType type) {
    switch (type) {
      case TaskType.checkIn:
        return TaskVerification.location;
      case TaskType.purchase:
        return TaskVerification.qrCode;
      case TaskType.photo:
        return TaskVerification.photo;
      case TaskType.review:
        return TaskVerification.manual;
      default:
        return TaskVerification.location;
    }
  }

  int _getExperience(TaskType type) {
    switch (type) {
      case TaskType.checkIn:
        return 20;
      case TaskType.purchase:
        return 50;
      case TaskType.photo:
        return 30;
      case TaskType.review:
        return 40;
      default:
        return 20;
    }
  }

  int _getCoins(TaskType type) {
    switch (type) {
      case TaskType.checkIn:
        return 10;
      case TaskType.purchase:
        return 30;
      case TaskType.photo:
        return 15;
      case TaskType.review:
        return 20;
      default:
        return 10;
    }
  }

  String? _getCoupon(TaskType type) {
    switch (type) {
      case TaskType.checkIn:
        return '5元优惠券';
      case TaskType.purchase:
        return '满100减20券';
      case TaskType.photo:
        return '买一送一券';
      case TaskType.review:
        return '8折优惠券';
      default:
        return null;
    }
  }

  List<String> _getRequirements(TaskType type) {
    switch (type) {
      case TaskType.checkIn:
        return ['到达店铺100米内', '停留时间超过1分钟'];
      case TaskType.purchase:
        return ['消费满50元', '出示会员码', '上传消费小票'];
      case TaskType.photo:
        return ['拍摄店铺照片', '分享到朋友圈', '带上定位信息'];
      case TaskType.review:
        return ['写50字以上评价', '至少4星好评', '上传3张照片'];
      default:
        return ['完成任务要求'];
    }
  }

  List<String> _getSteps(TaskType type) {
    switch (type) {
      case TaskType.checkIn:
        return [
          '1. 到达店铺附近',
          '2. 点击"开始打卡"',
          '3. 等待GPS定位',
          '4. 完成打卡',
        ];
      case TaskType.purchase:
        return [
          '1. 到店消费',
          '2. 出示会员码给店员扫描',
          '3. 完成支付',
          '4. 上传消费小票',
        ];
      case TaskType.photo:
        return [
          '1. 拍摄店铺照片',
          '2. 点击"分享"按钮',
          '3. 选择分享到朋友圈',
          '4. 等待审核',
        ];
      case TaskType.review:
        return [
          '1. 点击"写评价"',
          '2. 填写评价内容',
          '3. 上传照片',
          '4. 提交评价',
        ];
      default:
        return ['按照要求完成任务'];
    }
  }
}

