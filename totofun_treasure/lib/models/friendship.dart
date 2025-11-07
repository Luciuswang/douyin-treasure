/// 好友关系状态
enum FriendshipStatus {
  pending,   // 待确认
  accepted,  // 已接受
  rejected,  // 已拒绝
  blocked,   // 已屏蔽
}

/// 好友关系模型
class Friendship {
  final String id;
  final String userId;        // 发起者ID
  final String friendId;      // 接收者ID
  final FriendshipStatus status;
  final int createdAt;        // 创建时间
  final int? acceptedAt;      // 接受时间
  final String? remark;       // 备注名

  Friendship({
    required this.id,
    required this.userId,
    required this.friendId,
    required this.status,
    required this.createdAt,
    this.acceptedAt,
    this.remark,
  });

  // 从 JSON 创建
  factory Friendship.fromJson(Map<String, dynamic> json) {
    return Friendship(
      id: json['id'] as String,
      userId: json['userId'] as String,
      friendId: json['friendId'] as String,
      status: FriendshipStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => FriendshipStatus.pending,
      ),
      createdAt: json['createdAt'] as int,
      acceptedAt: json['acceptedAt'] as int?,
      remark: json['remark'] as String?,
    );
  }

  // 转换为 JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'friendId': friendId,
      'status': status.name,
      'createdAt': createdAt,
      'acceptedAt': acceptedAt,
      'remark': remark,
    };
  }

  // 复制并修改
  Friendship copyWith({
    String? id,
    String? userId,
    String? friendId,
    FriendshipStatus? status,
    int? createdAt,
    int? acceptedAt,
    String? remark,
  }) {
    return Friendship(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      friendId: friendId ?? this.friendId,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      acceptedAt: acceptedAt ?? this.acceptedAt,
      remark: remark ?? this.remark,
    );
  }

  // 是否已接受
  bool get isAccepted => status == FriendshipStatus.accepted;

  // 是否待确认
  bool get isPending => status == FriendshipStatus.pending;
}



