import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import '../models/chat_user.dart';
import '../models/chat_message.dart';
import '../models/friendship.dart';

/// Firebase 服务
/// 
/// 负责所有 Firebase 相关的操作
class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  factory FirebaseService() => _instance;
  FirebaseService._internal();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseDatabase _database = FirebaseDatabase.instance;

  // 当前用户
  User? get currentUser => _auth.currentUser;
  String? get currentUserId => currentUser?.uid;

  // ==================== 用户认证 ====================

  /// 匿名登录（快速开始）
  Future<User?> signInAnonymously() async {
    try {
      final credential = await _auth.signInAnonymously();
      return credential.user;
    } catch (e) {
      print('匿名登录失败: $e');
      return null;
    }
  }

  /// 使用用户ID登录（模拟登录，用于测试）
  Future<User?> signInWithCustomToken(String userId) async {
    try {
      // 这里需要后端生成 custom token
      // 暂时使用匿名登录
      return await signInAnonymously();
    } catch (e) {
      print('登录失败: $e');
      return null;
    }
  }

  /// 登出
  Future<void> signOut() async {
    await _auth.signOut();
  }

  // ==================== 用户数据 ====================

  /// 创建或更新用户信息
  Future<void> createOrUpdateUser(ChatUser user) async {
    if (currentUserId == null) return;
    
    try {
      await _database.ref('users/${user.id}').set(user.toJson());
    } catch (e) {
      print('更新用户信息失败: $e');
    }
  }

  /// 获取用户信息
  Future<ChatUser?> getUser(String userId) async {
    try {
      final snapshot = await _database.ref('users/$userId').get();
      if (snapshot.exists) {
        return ChatUser.fromJson(
          Map<String, dynamic>.from(snapshot.value as Map)
        );
      }
      return null;
    } catch (e) {
      print('获取用户信息失败: $e');
      return null;
    }
  }

  /// 更新在线状态
  Future<void> updateOnlineStatus(bool isOnline) async {
    if (currentUserId == null) return;
    
    try {
      await _database.ref('users/$currentUserId').update({
        'isOnline': isOnline,
        'lastSeen': DateTime.now().millisecondsSinceEpoch,
      });
    } catch (e) {
      print('更新在线状态失败: $e');
    }
  }

  /// 搜索用户（通过昵称或ID）
  Future<List<ChatUser>> searchUsers(String query) async {
    try {
      final snapshot = await _database.ref('users').get();
      if (!snapshot.exists) return [];

      final users = <ChatUser>[];
      final data = Map<String, dynamic>.from(snapshot.value as Map);
      
      data.forEach((key, value) {
        final user = ChatUser.fromJson(Map<String, dynamic>.from(value as Map));
        // 排除当前用户
        if (user.id != currentUserId) {
          // 匹配昵称或ID
          if (user.nickname.contains(query) || user.id.contains(query)) {
            users.add(user);
          }
        }
      });

      return users;
    } catch (e) {
      print('搜索用户失败: $e');
      return [];
    }
  }

  // ==================== 好友系统 ====================

  /// 发送好友请求
  Future<bool> sendFriendRequest(String friendId) async {
    if (currentUserId == null) return false;
    
    try {
      final friendshipId = '${currentUserId}_$friendId';
      final friendship = Friendship(
        id: friendshipId,
        userId: currentUserId!,
        friendId: friendId,
        status: FriendshipStatus.pending,
        createdAt: DateTime.now().millisecondsSinceEpoch,
      );

      await _database.ref('friendships/$friendshipId').set(friendship.toJson());
      
      // 同时在好友那边创建一条记录
      final reverseFriendshipId = '${friendId}_$currentUserId';
      final reverseFriendship = friendship.copyWith(
        id: reverseFriendshipId,
        userId: friendId,
        friendId: currentUserId,
      );
      await _database.ref('friendships/$reverseFriendshipId').set(reverseFriendship.toJson());

      return true;
    } catch (e) {
      print('发送好友请求失败: $e');
      return false;
    }
  }

  /// 接受好友请求
  Future<bool> acceptFriendRequest(String friendId) async {
    if (currentUserId == null) return false;
    
    try {
      final friendshipId = '${currentUserId}_$friendId';
      final reverseFriendshipId = '${friendId}_$currentUserId';
      final now = DateTime.now().millisecondsSinceEpoch;

      // 更新双方的好友关系状态
      await _database.ref('friendships/$friendshipId').update({
        'status': FriendshipStatus.accepted.name,
        'acceptedAt': now,
      });
      await _database.ref('friendships/$reverseFriendshipId').update({
        'status': FriendshipStatus.accepted.name,
        'acceptedAt': now,
      });

      return true;
    } catch (e) {
      print('接受好友请求失败: $e');
      return false;
    }
  }

  /// 拒绝好友请求
  Future<bool> rejectFriendRequest(String friendId) async {
    if (currentUserId == null) return false;
    
    try {
      final friendshipId = '${currentUserId}_$friendId';
      await _database.ref('friendships/$friendshipId').update({
        'status': FriendshipStatus.rejected.name,
      });
      return true;
    } catch (e) {
      print('拒绝好友请求失败: $e');
      return false;
    }
  }

  /// 删除好友
  Future<bool> removeFriend(String friendId) async {
    if (currentUserId == null) return false;
    
    try {
      final friendshipId = '${currentUserId}_$friendId';
      final reverseFriendshipId = '${friendId}_$currentUserId';
      
      await _database.ref('friendships/$friendshipId').remove();
      await _database.ref('friendships/$reverseFriendshipId').remove();
      
      return true;
    } catch (e) {
      print('删除好友失败: $e');
      return false;
    }
  }

  /// 获取好友列表
  Future<List<Friendship>> getFriendships() async {
    if (currentUserId == null) return [];
    
    try {
      final snapshot = await _database
          .ref('friendships')
          .orderByChild('userId')
          .equalTo(currentUserId)
          .get();

      if (!snapshot.exists) return [];

      final friendships = <Friendship>[];
      final data = Map<String, dynamic>.from(snapshot.value as Map);
      
      data.forEach((key, value) {
        final friendship = Friendship.fromJson(
          Map<String, dynamic>.from(value as Map)
        );
        friendships.add(friendship);
      });

      return friendships;
    } catch (e) {
      print('获取好友列表失败: $e');
      return [];
    }
  }

  /// 监听好友列表变化
  Stream<List<Friendship>> watchFriendships() {
    if (currentUserId == null) {
      return Stream.value([]);
    }

    return _database
        .ref('friendships')
        .orderByChild('userId')
        .equalTo(currentUserId)
        .onValue
        .map((event) {
      if (!event.snapshot.exists) return <Friendship>[];

      final friendships = <Friendship>[];
      final data = Map<String, dynamic>.from(event.snapshot.value as Map);
      
      data.forEach((key, value) {
        final friendship = Friendship.fromJson(
          Map<String, dynamic>.from(value as Map)
        );
        friendships.add(friendship);
      });

      return friendships;
    });
  }

  // ==================== 聊天消息 ====================

  /// 发送消息
  Future<bool> sendMessage(ChatMessage message) async {
    if (currentUserId == null) return false;
    
    try {
      // 保存消息
      await _database.ref('messages/${message.chatId}/${message.id}').set(message.toJson());
      
      // 更新会话的最后消息
      await _updateConversation(message);
      
      return true;
    } catch (e) {
      print('发送消息失败: $e');
      return false;
    }
  }

  /// 更新会话信息
  Future<void> _updateConversation(ChatMessage message) async {
    try {
      // 发送者的会话
      await _database.ref('conversations/${message.senderId}/${message.receiverId}').update({
        'lastMessage': message.toJson(),
        'lastMessageTime': message.timestamp,
      });

      // 接收者的会话（增加未读计数）
      final receiverConvRef = _database.ref('conversations/${message.receiverId}/${message.senderId}');
      final snapshot = await receiverConvRef.get();
      
      int unreadCount = 0;
      if (snapshot.exists) {
        final data = Map<String, dynamic>.from(snapshot.value as Map);
        unreadCount = (data['unreadCount'] as int? ?? 0) + 1;
      }

      await receiverConvRef.update({
        'lastMessage': message.toJson(),
        'lastMessageTime': message.timestamp,
        'unreadCount': unreadCount,
      });
    } catch (e) {
      print('更新会话失败: $e');
    }
  }

  /// 获取聊天消息列表
  Future<List<ChatMessage>> getMessages(String chatId, {int limit = 50}) async {
    try {
      final snapshot = await _database
          .ref('messages/$chatId')
          .orderByChild('timestamp')
          .limitToLast(limit)
          .get();

      if (!snapshot.exists) return [];

      final messages = <ChatMessage>[];
      final data = Map<String, dynamic>.from(snapshot.value as Map);
      
      data.forEach((key, value) {
        final message = ChatMessage.fromJson(
          Map<String, dynamic>.from(value as Map)
        );
        messages.add(message);
      });

      // 按时间排序
      messages.sort((a, b) => a.timestamp.compareTo(b.timestamp));

      return messages;
    } catch (e) {
      print('获取消息列表失败: $e');
      return [];
    }
  }

  /// 监听聊天消息
  Stream<List<ChatMessage>> watchMessages(String chatId) {
    return _database
        .ref('messages/$chatId')
        .orderByChild('timestamp')
        .limitToLast(50)
        .onValue
        .map((event) {
      if (!event.snapshot.exists) return <ChatMessage>[];

      final messages = <ChatMessage>[];
      final data = Map<String, dynamic>.from(event.snapshot.value as Map);
      
      data.forEach((key, value) {
        final message = ChatMessage.fromJson(
          Map<String, dynamic>.from(value as Map)
        );
        messages.add(message);
      });

      // 按时间排序
      messages.sort((a, b) => a.timestamp.compareTo(b.timestamp));

      return messages;
    });
  }

  /// 标记消息为已读
  Future<void> markMessagesAsRead(String chatId, String friendId) async {
    if (currentUserId == null) return;
    
    try {
      // 重置未读计数
      await _database.ref('conversations/$currentUserId/$friendId').update({
        'unreadCount': 0,
      });
    } catch (e) {
      print('标记已读失败: $e');
    }
  }

  /// 获取会话列表
  Future<List<ChatConversation>> getConversations() async {
    if (currentUserId == null) return [];
    
    try {
      final snapshot = await _database.ref('conversations/$currentUserId').get();
      if (!snapshot.exists) return [];

      final conversations = <ChatConversation>[];
      final data = Map<String, dynamic>.from(snapshot.value as Map);
      
      for (var entry in data.entries) {
        final friendId = entry.key;
        final convData = Map<String, dynamic>.from(entry.value as Map);
        
        // 获取好友信息
        final friend = await getUser(friendId);
        if (friend != null) {
          final conversation = ChatConversation(
            id: '${currentUserId}_$friendId',
            userId: currentUserId!,
            friendId: friendId,
            friendNickname: friend.nickname,
            friendAvatar: friend.avatar,
            lastMessage: convData['lastMessage'] != null
                ? ChatMessage.fromJson(Map<String, dynamic>.from(convData['lastMessage'] as Map))
                : null,
            unreadCount: convData['unreadCount'] as int? ?? 0,
            lastMessageTime: convData['lastMessageTime'] as int?,
          );
          conversations.add(conversation);
        }
      }

      // 按最后消息时间排序
      conversations.sort((a, b) {
        final aTime = a.lastMessageTime ?? 0;
        final bTime = b.lastMessageTime ?? 0;
        return bTime.compareTo(aTime);
      });

      return conversations;
    } catch (e) {
      print('获取会话列表失败: $e');
      return [];
    }
  }

  /// 监听会话列表
  Stream<List<ChatConversation>> watchConversations() async* {
    if (currentUserId == null) {
      yield [];
      return;
    }

    await for (var event in _database.ref('conversations/$currentUserId').onValue) {
      if (!event.snapshot.exists) {
        yield [];
        continue;
      }

      final conversations = <ChatConversation>[];
      final data = Map<String, dynamic>.from(event.snapshot.value as Map);
      
      for (var entry in data.entries) {
        final friendId = entry.key;
        final convData = Map<String, dynamic>.from(entry.value as Map);
        
        // 获取好友信息
        final friend = await getUser(friendId);
        if (friend != null) {
          final conversation = ChatConversation(
            id: '${currentUserId}_$friendId',
            userId: currentUserId!,
            friendId: friendId,
            friendNickname: friend.nickname,
            friendAvatar: friend.avatar,
            lastMessage: convData['lastMessage'] != null
                ? ChatMessage.fromJson(Map<String, dynamic>.from(convData['lastMessage'] as Map))
                : null,
            unreadCount: convData['unreadCount'] as int? ?? 0,
            lastMessageTime: convData['lastMessageTime'] as int?,
          );
          conversations.add(conversation);
        }
      }

      // 按最后消息时间排序
      conversations.sort((a, b) {
        final aTime = a.lastMessageTime ?? 0;
        final bTime = b.lastMessageTime ?? 0;
        return bTime.compareTo(aTime);
      });

      yield conversations;
    }
  }

  // ==================== 工具方法 ====================

  /// 生成聊天ID（确保双方使用相同的ID）
  String generateChatId(String userId1, String userId2) {
    final ids = [userId1, userId2]..sort();
    return '${ids[0]}_${ids[1]}';
  }
}



