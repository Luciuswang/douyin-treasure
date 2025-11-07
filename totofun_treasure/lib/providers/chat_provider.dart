import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/chat_user.dart';
import '../models/chat_message.dart';
import '../models/friendship.dart';
import '../services/firebase_service.dart';

/// 聊天Provider
class ChatProvider with ChangeNotifier {
  final FirebaseService _firebaseService = FirebaseService();
  final Uuid _uuid = const Uuid();

  // 当前用户
  ChatUser? _currentUser;
  ChatUser? get currentUser => _currentUser;

  // 好友列表
  List<Friendship> _friendships = [];
  List<Friendship> get friendships => _friendships;
  
  // 好友用户信息缓存
  final Map<String, ChatUser> _friendUsers = {};
  
  // 会话列表
  List<ChatConversation> _conversations = [];
  List<ChatConversation> get conversations => _conversations;

  // 当前聊天的好友
  ChatUser? _currentChatFriend;
  ChatUser? get currentChatFriend => _currentChatFriend;

  // 当前聊天消息
  List<ChatMessage> _currentMessages = [];
  List<ChatMessage> get currentMessages => _currentMessages;

  // 总未读消息数
  int get totalUnreadCount {
    return _conversations.fold(0, (sum, conv) => sum + conv.unreadCount);
  }

  // ==================== 初始化 ====================

  /// 初始化聊天系统
  Future<void> initialize(String userId, String nickname, {String? avatar}) async {
    // 创建或更新用户信息
    _currentUser = ChatUser(
      id: userId,
      nickname: nickname,
      avatar: avatar,
      isOnline: true,
    );

    await _firebaseService.createOrUpdateUser(_currentUser!);
    await _firebaseService.updateOnlineStatus(true);

    // 加载好友列表和会话
    await loadFriendships();
    await loadConversations();

    // 监听实时更新
    _listenToFriendships();
    _listenToConversations();

    notifyListeners();
  }

  /// 监听好友列表变化
  void _listenToFriendships() {
    _firebaseService.watchFriendships().listen((friendships) {
      _friendships = friendships;
      notifyListeners();
    });
  }

  /// 监听会话列表变化
  void _listenToConversations() {
    _firebaseService.watchConversations().listen((conversations) {
      _conversations = conversations;
      notifyListeners();
    });
  }

  // ==================== 好友管理 ====================

  /// 搜索用户
  Future<List<ChatUser>> searchUsers(String query) async {
    if (query.trim().isEmpty) return [];
    return await _firebaseService.searchUsers(query);
  }

  /// 发送好友请求
  Future<bool> sendFriendRequest(String friendId) async {
    final success = await _firebaseService.sendFriendRequest(friendId);
    if (success) {
      await loadFriendships();
    }
    return success;
  }

  /// 接受好友请求
  Future<bool> acceptFriendRequest(String friendId) async {
    final success = await _firebaseService.acceptFriendRequest(friendId);
    if (success) {
      await loadFriendships();
    }
    return success;
  }

  /// 拒绝好友请求
  Future<bool> rejectFriendRequest(String friendId) async {
    return await _firebaseService.rejectFriendRequest(friendId);
  }

  /// 删除好友
  Future<bool> removeFriend(String friendId) async {
    final success = await _firebaseService.removeFriend(friendId);
    if (success) {
      _friendships.removeWhere((f) => f.friendId == friendId);
      _friendUsers.remove(friendId);
      notifyListeners();
    }
    return success;
  }

  /// 加载好友列表
  Future<void> loadFriendships() async {
    _friendships = await _firebaseService.getFriendships();
    
    // 加载好友用户信息
    for (var friendship in _friendships) {
      if (friendship.isAccepted) {
        final user = await _firebaseService.getUser(friendship.friendId);
        if (user != null) {
          _friendUsers[friendship.friendId] = user;
        }
      }
    }
    
    notifyListeners();
  }

  /// 获取好友用户信息
  ChatUser? getFriendUser(String friendId) {
    return _friendUsers[friendId];
  }

  /// 获取已接受的好友列表
  List<Friendship> get acceptedFriends {
    return _friendships.where((f) => f.isAccepted).toList();
  }

  /// 获取待处理的好友请求
  List<Friendship> get pendingRequests {
    return _friendships.where((f) => f.isPending).toList();
  }

  // ==================== 聊天功能 ====================

  /// 加载会话列表
  Future<void> loadConversations() async {
    _conversations = await _firebaseService.getConversations();
    notifyListeners();
  }

  /// 开始与好友聊天
  Future<void> startChatWith(String friendId) async {
    // 获取好友信息
    _currentChatFriend = await _firebaseService.getUser(friendId);
    
    // 生成聊天ID
    final chatId = _firebaseService.generateChatId(
      _currentUser!.id,
      friendId,
    );

    // 加载聊天记录
    _currentMessages = await _firebaseService.getMessages(chatId);
    
    // 标记消息为已读
    await _firebaseService.markMessagesAsRead(chatId, friendId);

    // 监听新消息
    _listenToMessages(chatId);

    notifyListeners();
  }

  /// 监听聊天消息
  void _listenToMessages(String chatId) {
    _firebaseService.watchMessages(chatId).listen((messages) {
      _currentMessages = messages;
      notifyListeners();
    });
  }

  /// 发送文字消息
  Future<bool> sendTextMessage(String content) async {
    if (_currentUser == null || _currentChatFriend == null) return false;
    if (content.trim().isEmpty) return false;

    final chatId = _firebaseService.generateChatId(
      _currentUser!.id,
      _currentChatFriend!.id,
    );

    final message = ChatMessage(
      id: _uuid.v4(),
      chatId: chatId,
      senderId: _currentUser!.id,
      receiverId: _currentChatFriend!.id,
      type: MessageType.text,
      content: content.trim(),
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    return await _firebaseService.sendMessage(message);
  }

  /// 发送位置消息
  Future<bool> sendLocationMessage(double latitude, double longitude, String address) async {
    if (_currentUser == null || _currentChatFriend == null) return false;

    final chatId = _firebaseService.generateChatId(
      _currentUser!.id,
      _currentChatFriend!.id,
    );

    final message = ChatMessage(
      id: _uuid.v4(),
      chatId: chatId,
      senderId: _currentUser!.id,
      receiverId: _currentChatFriend!.id,
      type: MessageType.location,
      content: address,
      extra: {
        'latitude': latitude,
        'longitude': longitude,
      },
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    return await _firebaseService.sendMessage(message);
  }

  /// 发送宝藏分享消息
  Future<bool> sendTreasureMessage(Map<String, dynamic> treasureData) async {
    if (_currentUser == null || _currentChatFriend == null) return false;

    final chatId = _firebaseService.generateChatId(
      _currentUser!.id,
      _currentChatFriend!.id,
    );

    final message = ChatMessage(
      id: _uuid.v4(),
      chatId: chatId,
      senderId: _currentUser!.id,
      receiverId: _currentChatFriend!.id,
      type: MessageType.treasure,
      content: '分享了一个宝藏',
      extra: treasureData,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    return await _firebaseService.sendMessage(message);
  }

  /// 发送任务分享消息
  Future<bool> sendTaskMessage(Map<String, dynamic> taskData) async {
    if (_currentUser == null || _currentChatFriend == null) return false;

    final chatId = _firebaseService.generateChatId(
      _currentUser!.id,
      _currentChatFriend!.id,
    );

    final message = ChatMessage(
      id: _uuid.v4(),
      chatId: chatId,
      senderId: _currentUser!.id,
      receiverId: _currentChatFriend!.id,
      type: MessageType.task,
      content: '分享了一个任务',
      extra: taskData,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    return await _firebaseService.sendMessage(message);
  }

  /// 发送组队邀请
  Future<bool> sendInviteMessage(String activityName, String activityType) async {
    if (_currentUser == null || _currentChatFriend == null) return false;

    final chatId = _firebaseService.generateChatId(
      _currentUser!.id,
      _currentChatFriend!.id,
    );

    final message = ChatMessage(
      id: _uuid.v4(),
      chatId: chatId,
      senderId: _currentUser!.id,
      receiverId: _currentChatFriend!.id,
      type: MessageType.invite,
      content: '邀请你一起$activityName',
      extra: {
        'activityName': activityName,
        'activityType': activityType,
      },
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    return await _firebaseService.sendMessage(message);
  }

  /// 结束当前聊天
  void endCurrentChat() {
    _currentChatFriend = null;
    _currentMessages = [];
    notifyListeners();
  }

  // ==================== 清理 ====================

  /// 清理资源
  @override
  void dispose() {
    // 更新离线状态
    if (_currentUser != null) {
      _firebaseService.updateOnlineStatus(false);
    }
    super.dispose();
  }
}


