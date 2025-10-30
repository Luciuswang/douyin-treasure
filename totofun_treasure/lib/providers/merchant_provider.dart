import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/merchant.dart';
import '../models/task.dart';

/// 商家状态管理
class MerchantProvider with ChangeNotifier {
  final _uuid = const Uuid();
  
  // 当前登录的商家（模拟）
  Merchant? _currentMerchant;
  
  // 商家发布的任务列表
  final List<Task> _merchantTasks = [];
  
  Merchant? get currentMerchant => _currentMerchant;
  List<Task> get merchantTasks => _merchantTasks;
  
  // 按状态筛选任务
  List<Task> get activeTasks => _merchantTasks
      .where((task) => task.status == TaskStatus.available || task.status == TaskStatus.inProgress)
      .toList();
  
  List<Task> get completedTasks => _merchantTasks
      .where((task) => task.status == TaskStatus.completed)
      .toList();
  
  List<Task> get expiredTasks => _merchantTasks
      .where((task) => task.status == TaskStatus.expired)
      .toList();
  
  MerchantProvider() {
    _initializeMockMerchant();
  }
  
  /// 初始化模拟商家数据
  void _initializeMockMerchant() {
    _currentMerchant = Merchant(
      id: 'merchant_001',
      name: '星巴克咖啡（西湖店）',
      description: '全球知名咖啡连锁品牌',
      type: MerchantType.restaurant,
      status: MerchantStatus.active,
      ownerName: '张经理',
      phone: '13800138000',
      email: 'starbucks@example.com',
      latitude: 30.2741,
      longitude: 120.1551,
      address: '浙江省杭州市西湖区XX路XX号',
      logo: null,
      coverImage: null,
      createdAt: DateTime.now().subtract(const Duration(days: 365)),
      verifiedAt: DateTime.now().subtract(const Duration(days: 360)),
      totalTasks: 15,
      activeTasks: 3,
      completedTasks: 12,
      totalUsers: 1250,
      totalRevenue: 45600.0,
    );
    
    // 生成一些模拟任务
    _generateMockTasks();
  }
  
  /// 生成模拟任务
  void _generateMockTasks() {
    if (_currentMerchant == null) return;
    
    _merchantTasks.clear();
    
    // 活跃任务
    _merchantTasks.add(Task(
      id: _uuid.v4(),
      merchantId: _currentMerchant!.id,
      merchantName: _currentMerchant!.name,
      title: '咖啡打卡任务',
      description: '到店打卡即可获得奖励',
      type: TaskType.checkIn,
      difficulty: TaskDifficulty.easy,
      verification: TaskVerification.location,
      latitude: _currentMerchant!.latitude,
      longitude: _currentMerchant!.longitude,
      experience: 50,
      coins: 10,
      coupon: '满30减5券',
      maxCompletions: 100,
      currentCompletions: 25,
      startTime: DateTime.now().subtract(const Duration(days: 1)),
      endTime: DateTime.now().add(const Duration(days: 7)),
      status: TaskStatus.available,
    ));
    
    _merchantTasks.add(Task(
      id: _uuid.v4(),
      merchantId: _currentMerchant!.id,
      merchantName: _currentMerchant!.name,
      title: '拍照分享任务',
      description: '拍摄店内照片并分享到社交平台',
      type: TaskType.photo,
      difficulty: TaskDifficulty.medium,
      verification: TaskVerification.photo,
      latitude: _currentMerchant!.latitude,
      longitude: _currentMerchant!.longitude,
      experience: 100,
      coins: 20,
      coupon: '满50减10券',
      maxCompletions: 50,
      currentCompletions: 20,
      startTime: DateTime.now().subtract(const Duration(days: 2)),
      endTime: DateTime.now().add(const Duration(days: 14)),
      status: TaskStatus.available,
    ));
    
    // 已完成任务
    _merchantTasks.add(Task(
      id: _uuid.v4(),
      merchantId: _currentMerchant!.id,
      merchantName: _currentMerchant!.name,
      title: '消费满50元任务',
      description: '单笔消费满50元即可完成',
      type: TaskType.purchase,
      difficulty: TaskDifficulty.medium,
      verification: TaskVerification.qrCode,
      latitude: _currentMerchant!.latitude,
      longitude: _currentMerchant!.longitude,
      experience: 150,
      coins: 30,
      coupon: '满100减20券',
      maxCompletions: 200,
      currentCompletions: 200,
      startTime: DateTime.now().subtract(const Duration(days: 30)),
      endTime: DateTime.now().subtract(const Duration(days: 1)),
      status: TaskStatus.completed,
    ));
    
    notifyListeners();
  }
  
  /// 创建新任务
  Future<bool> createTask(Task task) async {
    try {
      _merchantTasks.insert(0, task);
      
      // 更新商家统计
      if (_currentMerchant != null) {
        _currentMerchant = _currentMerchant!.copyWith(
          totalTasks: _currentMerchant!.totalTasks + 1,
          activeTasks: _currentMerchant!.activeTasks + 1,
        );
      }
      
      notifyListeners();
      return true;
    } catch (e) {
      print('创建任务失败: $e');
      return false;
    }
  }
  
  /// 更新任务
  Future<bool> updateTask(String taskId, Task updatedTask) async {
    try {
      final index = _merchantTasks.indexWhere((t) => t.id == taskId);
      if (index != -1) {
        _merchantTasks[index] = updatedTask;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      print('更新任务失败: $e');
      return false;
    }
  }
  
  /// 删除任务
  Future<bool> deleteTask(String taskId) async {
    try {
      final task = _merchantTasks.firstWhere((t) => t.id == taskId);
      _merchantTasks.removeWhere((t) => t.id == taskId);
      
      // 更新商家统计
      if (_currentMerchant != null) {
        int activeDelta = 0;
        if (task.status == TaskStatus.available || task.status == TaskStatus.inProgress) {
          activeDelta = -1;
        }
        
        _currentMerchant = _currentMerchant!.copyWith(
          totalTasks: _currentMerchant!.totalTasks - 1,
          activeTasks: _currentMerchant!.activeTasks + activeDelta,
        );
      }
      
      notifyListeners();
      return true;
    } catch (e) {
      print('删除任务失败: $e');
      return false;
    }
  }
  
  /// 暂停/恢复任务
  Future<bool> toggleTaskStatus(String taskId) async {
    try {
      final index = _merchantTasks.indexWhere((t) => t.id == taskId);
      if (index != -1) {
        final task = _merchantTasks[index];
        // TODO: 实现暂停/恢复逻辑
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      print('切换任务状态失败: $e');
      return false;
    }
  }
  
  /// 获取任务统计数据
  Map<String, dynamic> getTaskStatistics(String taskId) {
    final task = _merchantTasks.firstWhere(
      (t) => t.id == taskId,
      orElse: () => throw Exception('Task not found'),
    );
    
    // 模拟统计数据
    final completedCount = task.totalSlots - task.availableSlots;
    final completionRate = task.totalSlots > 0 
        ? (completedCount / task.totalSlots * 100).toStringAsFixed(1)
        : '0.0';
    
    return {
      'totalSlots': task.totalSlots,
      'completedCount': completedCount,
      'availableSlots': task.availableSlots,
      'completionRate': completionRate,
      'totalViews': completedCount * 3, // 模拟浏览量
      'totalClicks': completedCount * 2, // 模拟点击量
      'conversionRate': '66.7', // 模拟转化率
      'estimatedRevenue': completedCount * 35.0, // 模拟营收
    };
  }
  
  /// 获取商家整体数据
  Map<String, dynamic> getMerchantStatistics() {
    if (_currentMerchant == null) return {};
    
    final today = DateTime.now();
    final thisMonth = DateTime(today.year, today.month, 1);
    
    // 模拟数据
    return {
      'totalTasks': _currentMerchant!.totalTasks,
      'activeTasks': _currentMerchant!.activeTasks,
      'completedTasks': _currentMerchant!.completedTasks,
      'totalUsers': _currentMerchant!.totalUsers,
      'totalRevenue': _currentMerchant!.totalRevenue,
      'monthlyRevenue': _currentMerchant!.totalRevenue * 0.15, // 本月营收（模拟）
      'monthlyUsers': (_currentMerchant!.totalUsers * 0.2).toInt(), // 本月新增用户
      'averageROI': 3.5, // 平均ROI
      'conversionRate': 18.5, // 平均转化率
    };
  }
  
  /// 生成任务二维码数据
  String generateTaskQRCode(String taskId) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    return 'totofun://task/$taskId?merchant=${_currentMerchant?.id}&timestamp=$timestamp';
  }
}

