import 'package:flutter/material.dart';

/// 任务类型
enum TaskType {
  checkIn,      // 打卡任务
  purchase,     // 消费任务
  photo,        // 拍照任务
  review,       // 评价任务
  share,        // 分享任务
  chain,        // 连锁任务
}

/// 任务状态
enum TaskStatus {
  available,    // 可接取
  inProgress,   // 进行中
  completed,    // 已完成
  expired,      // 已过期
  failed,       // 已失败
}

/// 任务难度
enum TaskDifficulty {
  easy,         // 简单
  medium,       // 中等
  hard,         // 困难
}

/// 任务验证方式
enum TaskVerification {
  location,     // GPS定位验证
  qrCode,       // 二维码验证
  photo,        // 拍照验证
  receipt,      // 小票验证
  manual,       // 人工验证
}

/// 任务模型
class Task {
  final String id;
  final String merchantId;           // 商家ID
  final String merchantName;         // 商家名称
  final String title;                // 任务标题
  final String description;          // 任务描述
  final TaskType type;               // 任务类型
  final TaskDifficulty difficulty;   // 任务难度
  final TaskVerification verification; // 验证方式
  
  final double latitude;             // 任务地点纬度
  final double longitude;            // 任务地点经度
  final double triggerRadius;        // 触发半径（米）
  
  final int experience;              // 经验奖励
  final int coins;                   // 金币奖励
  final String? coupon;              // 优惠券奖励
  final String? specialReward;       // 特殊奖励描述
  
  final DateTime startTime;          // 开始时间
  final DateTime endTime;            // 结束时间
  final int? timeLimit;              // 完成时限（分钟）
  final int maxCompletions;          // 最大完成次数
  final int currentCompletions;      // 当前完成次数
  
  final List<String>? requirements;  // 任务要求列表
  final List<String>? steps;         // 任务步骤
  final String? imageUrl;            // 任务图片
  
  TaskStatus status;                 // 任务状态
  DateTime? acceptedTime;            // 接取时间
  DateTime? completedTime;           // 完成时间
  
  Task({
    required this.id,
    required this.merchantId,
    required this.merchantName,
    required this.title,
    required this.description,
    required this.type,
    required this.difficulty,
    required this.verification,
    required this.latitude,
    required this.longitude,
    this.triggerRadius = 100.0,
    required this.experience,
    required this.coins,
    this.coupon,
    this.specialReward,
    required this.startTime,
    required this.endTime,
    this.timeLimit,
    this.maxCompletions = 100,
    this.currentCompletions = 0,
    this.requirements,
    this.steps,
    this.imageUrl,
    this.status = TaskStatus.available,
    this.acceptedTime,
    this.completedTime,
  });

  /// 是否可接取
  bool get isAvailable {
    final now = DateTime.now();
    return status == TaskStatus.available &&
           now.isAfter(startTime) &&
           now.isBefore(endTime) &&
           currentCompletions < maxCompletions;
  }

  /// 是否已过期
  bool get isExpired {
    return DateTime.now().isAfter(endTime);
  }

  /// 剩余名额
  int get remainingSlots {
    return maxCompletions - currentCompletions;
  }

  /// 剩余时间（小时）
  int get remainingHours {
    if (isExpired) return 0;
    return endTime.difference(DateTime.now()).inHours;
  }

  /// 任务难度文本
  String get difficultyText {
    switch (difficulty) {
      case TaskDifficulty.easy:
        return '简单';
      case TaskDifficulty.medium:
        return '中等';
      case TaskDifficulty.hard:
        return '困难';
    }
  }

  /// 任务难度颜色
  Color get difficultyColor {
    switch (difficulty) {
      case TaskDifficulty.easy:
        return Colors.green;
      case TaskDifficulty.medium:
        return Colors.orange;
      case TaskDifficulty.hard:
        return Colors.red;
    }
  }

  /// 任务类型图标
  IconData get typeIcon {
    switch (type) {
      case TaskType.checkIn:
        return Icons.location_on;
      case TaskType.purchase:
        return Icons.shopping_cart;
      case TaskType.photo:
        return Icons.camera_alt;
      case TaskType.review:
        return Icons.rate_review;
      case TaskType.share:
        return Icons.share;
      case TaskType.chain:
        return Icons.link;
    }
  }

  /// 任务类型文本
  String get typeText {
    switch (type) {
      case TaskType.checkIn:
        return '打卡任务';
      case TaskType.purchase:
        return '消费任务';
      case TaskType.photo:
        return '拍照任务';
      case TaskType.review:
        return '评价任务';
      case TaskType.share:
        return '分享任务';
      case TaskType.chain:
        return '连锁任务';
    }
  }

  /// 转换为JSON
  Map<String, dynamic> toJson() => {
        'id': id,
        'merchantId': merchantId,
        'merchantName': merchantName,
        'title': title,
        'description': description,
        'type': type.toString(),
        'difficulty': difficulty.toString(),
        'verification': verification.toString(),
        'latitude': latitude,
        'longitude': longitude,
        'triggerRadius': triggerRadius,
        'experience': experience,
        'coins': coins,
        'coupon': coupon,
        'specialReward': specialReward,
        'startTime': startTime.toIso8601String(),
        'endTime': endTime.toIso8601String(),
        'timeLimit': timeLimit,
        'maxCompletions': maxCompletions,
        'currentCompletions': currentCompletions,
        'requirements': requirements,
        'steps': steps,
        'imageUrl': imageUrl,
        'status': status.toString(),
        'acceptedTime': acceptedTime?.toIso8601String(),
        'completedTime': completedTime?.toIso8601String(),
      };

  /// 从JSON创建
  factory Task.fromJson(Map<String, dynamic> json) => Task(
        id: json['id'],
        merchantId: json['merchantId'],
        merchantName: json['merchantName'],
        title: json['title'],
        description: json['description'],
        type: TaskType.values.firstWhere(
          (e) => e.toString() == json['type'],
          orElse: () => TaskType.checkIn,
        ),
        difficulty: TaskDifficulty.values.firstWhere(
          (e) => e.toString() == json['difficulty'],
          orElse: () => TaskDifficulty.easy,
        ),
        verification: TaskVerification.values.firstWhere(
          (e) => e.toString() == json['verification'],
          orElse: () => TaskVerification.location,
        ),
        latitude: json['latitude'],
        longitude: json['longitude'],
        triggerRadius: json['triggerRadius'] ?? 100.0,
        experience: json['experience'],
        coins: json['coins'],
        coupon: json['coupon'],
        specialReward: json['specialReward'],
        startTime: DateTime.parse(json['startTime']),
        endTime: DateTime.parse(json['endTime']),
        timeLimit: json['timeLimit'],
        maxCompletions: json['maxCompletions'] ?? 100,
        currentCompletions: json['currentCompletions'] ?? 0,
        requirements: json['requirements'] != null
            ? List<String>.from(json['requirements'])
            : null,
        steps: json['steps'] != null ? List<String>.from(json['steps']) : null,
        imageUrl: json['imageUrl'],
        status: TaskStatus.values.firstWhere(
          (e) => e.toString() == json['status'],
          orElse: () => TaskStatus.available,
        ),
        acceptedTime: json['acceptedTime'] != null
            ? DateTime.parse(json['acceptedTime'])
            : null,
        completedTime: json['completedTime'] != null
            ? DateTime.parse(json['completedTime'])
            : null,
      );

  /// 复制并修改
  Task copyWith({
    TaskStatus? status,
    DateTime? acceptedTime,
    DateTime? completedTime,
    int? currentCompletions,
  }) {
    return Task(
      id: id,
      merchantId: merchantId,
      merchantName: merchantName,
      title: title,
      description: description,
      type: type,
      difficulty: difficulty,
      verification: verification,
      latitude: latitude,
      longitude: longitude,
      triggerRadius: triggerRadius,
      experience: experience,
      coins: coins,
      coupon: coupon,
      specialReward: specialReward,
      startTime: startTime,
      endTime: endTime,
      timeLimit: timeLimit,
      maxCompletions: maxCompletions,
      currentCompletions: currentCompletions ?? this.currentCompletions,
      requirements: requirements,
      steps: steps,
      imageUrl: imageUrl,
      status: status ?? this.status,
      acceptedTime: acceptedTime ?? this.acceptedTime,
      completedTime: completedTime ?? this.completedTime,
    );
  }
}

