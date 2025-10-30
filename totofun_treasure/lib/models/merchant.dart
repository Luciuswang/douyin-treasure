import 'package:flutter/material.dart';

/// 商家类型
enum MerchantType {
  restaurant,   // 餐饮
  retail,       // 零售
  entertainment,// 娱乐
  service,      // 服务
  other,        // 其他
}

/// 商家状态
enum MerchantStatus {
  active,       // 活跃
  inactive,     // 未激活
  suspended,    // 暂停
  banned,       // 封禁
}

/// 商家模型
class Merchant {
  final String id;
  final String name;              // 商家名称
  final String description;       // 商家描述
  final MerchantType type;        // 商家类型
  final MerchantStatus status;    // 商家状态
  
  final String ownerName;         // 负责人姓名
  final String phone;             // 联系电话
  final String email;             // 邮箱
  
  final double latitude;          // 商家位置纬度
  final double longitude;         // 商家位置经度
  final String address;           // 详细地址
  
  final String? logo;             // 商家Logo
  final String? coverImage;       // 封面图片
  final List<String>? images;     // 商家图片
  
  final DateTime createdAt;       // 创建时间
  final DateTime? verifiedAt;     // 认证时间
  
  // 统计数据
  final int totalTasks;           // 发布任务总数
  final int activeTasks;          // 进行中任务数
  final int completedTasks;       // 已完成任务数
  final int totalUsers;           // 触达用户数
  final double totalRevenue;      // 总营收（元）
  
  Merchant({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
    this.status = MerchantStatus.active,
    required this.ownerName,
    required this.phone,
    required this.email,
    required this.latitude,
    required this.longitude,
    required this.address,
    this.logo,
    this.coverImage,
    this.images,
    DateTime? createdAt,
    this.verifiedAt,
    this.totalTasks = 0,
    this.activeTasks = 0,
    this.completedTasks = 0,
    this.totalUsers = 0,
    this.totalRevenue = 0.0,
  }) : createdAt = createdAt ?? DateTime.now();

  // 转换为JSON
  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'type': type.toString(),
        'status': status.toString(),
        'ownerName': ownerName,
        'phone': phone,
        'email': email,
        'latitude': latitude,
        'longitude': longitude,
        'address': address,
        'logo': logo,
        'coverImage': coverImage,
        'images': images,
        'createdAt': createdAt.toIso8601String(),
        'verifiedAt': verifiedAt?.toIso8601String(),
        'totalTasks': totalTasks,
        'activeTasks': activeTasks,
        'completedTasks': completedTasks,
        'totalUsers': totalUsers,
        'totalRevenue': totalRevenue,
      };

  // 从JSON创建
  factory Merchant.fromJson(Map<String, dynamic> json) => Merchant(
        id: json['id'],
        name: json['name'],
        description: json['description'],
        type: MerchantType.values.firstWhere(
          (e) => e.toString() == json['type'],
          orElse: () => MerchantType.other,
        ),
        status: MerchantStatus.values.firstWhere(
          (e) => e.toString() == json['status'],
          orElse: () => MerchantStatus.active,
        ),
        ownerName: json['ownerName'],
        phone: json['phone'],
        email: json['email'],
        latitude: json['latitude'],
        longitude: json['longitude'],
        address: json['address'],
        logo: json['logo'],
        coverImage: json['coverImage'],
        images: json['images'] != null ? List<String>.from(json['images']) : null,
        createdAt: DateTime.parse(json['createdAt']),
        verifiedAt: json['verifiedAt'] != null ? DateTime.parse(json['verifiedAt']) : null,
        totalTasks: json['totalTasks'] ?? 0,
        activeTasks: json['activeTasks'] ?? 0,
        completedTasks: json['completedTasks'] ?? 0,
        totalUsers: json['totalUsers'] ?? 0,
        totalRevenue: (json['totalRevenue'] ?? 0.0).toDouble(),
      );

  // 复制并修改
  Merchant copyWith({
    String? name,
    String? description,
    MerchantType? type,
    MerchantStatus? status,
    String? ownerName,
    String? phone,
    String? email,
    double? latitude,
    double? longitude,
    String? address,
    String? logo,
    String? coverImage,
    List<String>? images,
    int? totalTasks,
    int? activeTasks,
    int? completedTasks,
    int? totalUsers,
    double? totalRevenue,
  }) {
    return Merchant(
      id: id,
      name: name ?? this.name,
      description: description ?? this.description,
      type: type ?? this.type,
      status: status ?? this.status,
      ownerName: ownerName ?? this.ownerName,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      address: address ?? this.address,
      logo: logo ?? this.logo,
      coverImage: coverImage ?? this.coverImage,
      images: images ?? this.images,
      createdAt: createdAt,
      verifiedAt: verifiedAt,
      totalTasks: totalTasks ?? this.totalTasks,
      activeTasks: activeTasks ?? this.activeTasks,
      completedTasks: completedTasks ?? this.completedTasks,
      totalUsers: totalUsers ?? this.totalUsers,
      totalRevenue: totalRevenue ?? this.totalRevenue,
    );
  }
}

/// 商家类型扩展
extension MerchantTypeExtension on MerchantType {
  String get displayName {
    switch (this) {
      case MerchantType.restaurant:
        return '餐饮';
      case MerchantType.retail:
        return '零售';
      case MerchantType.entertainment:
        return '娱乐';
      case MerchantType.service:
        return '服务';
      case MerchantType.other:
        return '其他';
    }
  }

  IconData get icon {
    switch (this) {
      case MerchantType.restaurant:
        return Icons.restaurant;
      case MerchantType.retail:
        return Icons.shopping_bag;
      case MerchantType.entertainment:
        return Icons.movie;
      case MerchantType.service:
        return Icons.build;
      case MerchantType.other:
        return Icons.store;
    }
  }

  Color get color {
    switch (this) {
      case MerchantType.restaurant:
        return Colors.orange;
      case MerchantType.retail:
        return Colors.purple;
      case MerchantType.entertainment:
        return Colors.pink;
      case MerchantType.service:
        return Colors.blue;
      case MerchantType.other:
        return Colors.grey;
    }
  }
}

/// 商家状态扩展
extension MerchantStatusExtension on MerchantStatus {
  String get displayName {
    switch (this) {
      case MerchantStatus.active:
        return '活跃';
      case MerchantStatus.inactive:
        return '未激活';
      case MerchantStatus.suspended:
        return '暂停';
      case MerchantStatus.banned:
        return '封禁';
    }
  }

  Color get color {
    switch (this) {
      case MerchantStatus.active:
        return Colors.green;
      case MerchantStatus.inactive:
        return Colors.grey;
      case MerchantStatus.suspended:
        return Colors.orange;
      case MerchantStatus.banned:
        return Colors.red;
    }
  }
}

