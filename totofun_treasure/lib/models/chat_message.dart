/// 消息类型
enum MessageType {
  text,      // 文字消息
  image,     // 图片消息
  location,  // 位置分享
  treasure,  // 宝藏分享
  task,      // 任务分享
  invite,    // 组队邀请
}

/// 聊天消息模型
class ChatMessage {
  final String id;
  final String chatId;        // 聊天会话ID
  final String senderId;      // 发送者ID
  final String receiverId;    // 接收者ID
  final MessageType type;     // 消息类型
  final String content;       // 消息内容
  final Map<String, dynamic>? extra; // 额外数据（位置、宝藏等）
  final int timestamp;        // 时间戳
  final bool isRead;          // 是否已读

  ChatMessage({
    required this.id,
    required this.chatId,
    required this.senderId,
    required this.receiverId,
    required this.type,
    required this.content,
    this.extra,
    required this.timestamp,
    this.isRead = false,
  });

  // 从 JSON 创建
  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      chatId: json['chatId'] as String,
      senderId: json['senderId'] as String,
      receiverId: json['receiverId'] as String,
      type: MessageType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => MessageType.text,
      ),
      content: json['content'] as String,
      extra: json['extra'] as Map<String, dynamic>?,
      timestamp: json['timestamp'] as int,
      isRead: json['isRead'] as bool? ?? false,
    );
  }

  // 转换为 JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'chatId': chatId,
      'senderId': senderId,
      'receiverId': receiverId,
      'type': type.name,
      'content': content,
      'extra': extra,
      'timestamp': timestamp,
      'isRead': isRead,
    };
  }

  // 复制并修改
  ChatMessage copyWith({
    String? id,
    String? chatId,
    String? senderId,
    String? receiverId,
    MessageType? type,
    String? content,
    Map<String, dynamic>? extra,
    int? timestamp,
    bool? isRead,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      chatId: chatId ?? this.chatId,
      senderId: senderId ?? this.senderId,
      receiverId: receiverId ?? this.receiverId,
      type: type ?? this.type,
      content: content ?? this.content,
      extra: extra ?? this.extra,
      timestamp: timestamp ?? this.timestamp,
      isRead: isRead ?? this.isRead,
    );
  }

  // 获取格式化时间
  String get formattedTime {
    final date = DateTime.fromMillisecondsSinceEpoch(timestamp);
    final now = DateTime.now();
    
    // 今天
    if (date.year == now.year && 
        date.month == now.month && 
        date.day == now.day) {
      return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    }
    
    // 昨天
    final yesterday = now.subtract(const Duration(days: 1));
    if (date.year == yesterday.year && 
        date.month == yesterday.month && 
        date.day == yesterday.day) {
      return '昨天 ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    }
    
    // 今年
    if (date.year == now.year) {
      return '${date.month}月${date.day}日 ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    }
    
    // 其他
    return '${date.year}年${date.month}月${date.day}日';
  }
}

/// 聊天会话模型
class ChatConversation {
  final String id;
  final String userId;        // 当前用户ID
  final String friendId;      // 好友ID
  final String friendNickname;
  final String? friendAvatar;
  final ChatMessage? lastMessage;
  final int unreadCount;
  final int? lastMessageTime;

  ChatConversation({
    required this.id,
    required this.userId,
    required this.friendId,
    required this.friendNickname,
    this.friendAvatar,
    this.lastMessage,
    this.unreadCount = 0,
    this.lastMessageTime,
  });

  // 从 JSON 创建
  factory ChatConversation.fromJson(Map<String, dynamic> json) {
    return ChatConversation(
      id: json['id'] as String,
      userId: json['userId'] as String,
      friendId: json['friendId'] as String,
      friendNickname: json['friendNickname'] as String,
      friendAvatar: json['friendAvatar'] as String?,
      lastMessage: json['lastMessage'] != null 
          ? ChatMessage.fromJson(json['lastMessage'] as Map<String, dynamic>)
          : null,
      unreadCount: json['unreadCount'] as int? ?? 0,
      lastMessageTime: json['lastMessageTime'] as int?,
    );
  }

  // 转换为 JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'friendId': friendId,
      'friendNickname': friendNickname,
      'friendAvatar': friendAvatar,
      'lastMessage': lastMessage?.toJson(),
      'unreadCount': unreadCount,
      'lastMessageTime': lastMessageTime,
    };
  }

  // 复制并修改
  ChatConversation copyWith({
    String? id,
    String? userId,
    String? friendId,
    String? friendNickname,
    String? friendAvatar,
    ChatMessage? lastMessage,
    int? unreadCount,
    int? lastMessageTime,
  }) {
    return ChatConversation(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      friendId: friendId ?? this.friendId,
      friendNickname: friendNickname ?? this.friendNickname,
      friendAvatar: friendAvatar ?? this.friendAvatar,
      lastMessage: lastMessage ?? this.lastMessage,
      unreadCount: unreadCount ?? this.unreadCount,
      lastMessageTime: lastMessageTime ?? this.lastMessageTime,
    );
  }
}



