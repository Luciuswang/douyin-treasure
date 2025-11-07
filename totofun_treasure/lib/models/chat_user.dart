/// 聊天用户模型
class ChatUser {
  final String id;
  final String nickname;
  final String? avatar;
  final bool isOnline;
  final int? lastSeen;
  final int level;
  final int experience;
  
  ChatUser({
    required this.id,
    required this.nickname,
    this.avatar,
    this.isOnline = false,
    this.lastSeen,
    this.level = 1,
    this.experience = 0,
  });

  // 从 JSON 创建
  factory ChatUser.fromJson(Map<String, dynamic> json) {
    return ChatUser(
      id: json['id'] as String,
      nickname: json['nickname'] as String,
      avatar: json['avatar'] as String?,
      isOnline: json['isOnline'] as bool? ?? false,
      lastSeen: json['lastSeen'] as int?,
      level: json['level'] as int? ?? 1,
      experience: json['experience'] as int? ?? 0,
    );
  }

  // 转换为 JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nickname': nickname,
      'avatar': avatar,
      'isOnline': isOnline,
      'lastSeen': lastSeen,
      'level': level,
      'experience': experience,
    };
  }

  // 复制并修改
  ChatUser copyWith({
    String? id,
    String? nickname,
    String? avatar,
    bool? isOnline,
    int? lastSeen,
    int? level,
    int? experience,
  }) {
    return ChatUser(
      id: id ?? this.id,
      nickname: nickname ?? this.nickname,
      avatar: avatar ?? this.avatar,
      isOnline: isOnline ?? this.isOnline,
      lastSeen: lastSeen ?? this.lastSeen,
      level: level ?? this.level,
      experience: experience ?? this.experience,
    );
  }

  // 获取在线状态文本
  String get statusText {
    if (isOnline) return '在线';
    if (lastSeen == null) return '离线';
    
    final now = DateTime.now().millisecondsSinceEpoch;
    final diff = now - lastSeen!;
    final minutes = diff ~/ (1000 * 60);
    
    if (minutes < 1) return '刚刚在线';
    if (minutes < 60) return '$minutes分钟前在线';
    
    final hours = minutes ~/ 60;
    if (hours < 24) return '$hours小时前在线';
    
    final days = hours ~/ 24;
    if (days < 7) return '$days天前在线';
    
    return '很久未上线';
  }
}



