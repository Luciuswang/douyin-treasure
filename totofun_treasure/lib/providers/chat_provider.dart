import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/chat_user.dart';
import '../models/chat_message.dart';
import '../models/friendship.dart';
import '../services/firebase_service.dart';
import '../services/deepseek_service.dart';

/// 聊天Provider
class ChatProvider with ChangeNotifier {
  final FirebaseService _firebaseService = FirebaseService();
  final DeepSeekService _deepSeekService = DeepSeekService();
  final Uuid _uuid = const Uuid();
  static const String _botId = 'totofun_bot';
  static const String _botMessagesKey = 'bot_messages';

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

  // 当前聊天消息（好友聊天）
  List<ChatMessage> _currentMessages = [];
  List<ChatMessage> get currentMessages => _currentMessages;

  // 机器人聊天消息
  List<ChatMessage> _botMessages = [];
  List<ChatMessage> get botMessages => _botMessages;

  // 机器人用户信息
  ChatUser? _botUser;
  ChatUser? get botUser => _botUser;

  // 机器人是否正在回复
  bool _botIsReplying = false;
  bool get botIsReplying => _botIsReplying;

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

    // 初始化机器人用户
    _botUser = ChatUser(
      id: _botId,
      nickname: '小突',
      avatar: null,
      isOnline: true,
    );

    // 加载机器人聊天记录
    await _loadBotMessages();

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

  // ==================== 机器人聊天功能 ====================

  /// 加载机器人聊天记录
  Future<void> _loadBotMessages() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final messagesJson = prefs.getString(_botMessagesKey);
      if (messagesJson != null) {
        final List<dynamic> messagesList = jsonDecode(messagesJson);
        _botMessages = messagesList
            .map((m) => ChatMessage.fromJson(m as Map<String, dynamic>))
            .toList();
        notifyListeners();
      } else {
        // 如果没有消息，添加欢迎消息
        _addWelcomeMessage();
      }
    } catch (e) {
      print('❌ 加载机器人聊天记录失败: $e');
      _addWelcomeMessage();
    }
  }

  /// 保存机器人聊天记录
  Future<void> _saveBotMessages() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final messagesJson = jsonEncode(
        _botMessages.map((m) => m.toJson()).toList(),
      );
      await prefs.setString(_botMessagesKey, messagesJson);
    } catch (e) {
      print('❌ 保存机器人聊天记录失败: $e');
    }
  }

  /// 添加欢迎消息
  void _addWelcomeMessage() {
    if (_botMessages.isEmpty && _currentUser != null) {
      final welcomeMessage = ChatMessage(
        id: 'welcome_msg',
        chatId: 'bot_chat',
        senderId: _botId,
        receiverId: _currentUser!.id,
        type: MessageType.text,
        content: '你好！我是小突，你的AI寻宝伙伴！😊 有什么问题都可以问我哦~',
        timestamp: DateTime.now().millisecondsSinceEpoch,
        isRead: true,
      );
      _botMessages.add(welcomeMessage);
      _saveBotMessages();
      notifyListeners();
    }
  }

  /// 发送消息给机器人
  Future<bool> sendBotMessage(String content) async {
    if (_currentUser == null || content.trim().isEmpty) return false;

    // 添加用户消息
    final userMessage = ChatMessage(
      id: _uuid.v4(),
      chatId: 'bot_chat',
      senderId: _currentUser!.id,
      receiverId: _botId,
      type: MessageType.text,
      content: content.trim(),
      timestamp: DateTime.now().millisecondsSinceEpoch,
      isRead: true,
    );

    _botMessages.add(userMessage);
    _saveBotMessages();
    notifyListeners();

    // 获取 AI 回复
    _botIsReplying = true;
    notifyListeners();

    try {
      // 构建对话历史（最近5条消息，排除当前刚发送的消息）
      final recentMessages = _botMessages.length > 6
          ? _botMessages.sublist(_botMessages.length - 6, _botMessages.length - 1)
          : _botMessages.length > 1
              ? _botMessages.sublist(0, _botMessages.length - 1)
              : <ChatMessage>[];

      final conversationHistory = recentMessages
          .map((m) => <String, String>{
                'role': m.senderId == _currentUser!.id ? 'user' : 'assistant',
                'content': m.content,
              })
          .toList();

      // 调用 DeepSeek API
      final aiReply = await _deepSeekService.getAIReply(
        content.trim(),
        conversationHistory: conversationHistory.isNotEmpty
            ? conversationHistory
            : null,
        userNickname: _currentUser!.nickname,
        userLevel: _currentUser!.level,
      );

      // 添加机器人回复
      final botReply = ChatMessage(
        id: _uuid.v4(),
        chatId: 'bot_chat',
        senderId: _botId,
        receiverId: _currentUser!.id,
        type: MessageType.text,
        content: aiReply ?? _deepSeekService.getDefaultReply(),
        timestamp: DateTime.now().millisecondsSinceEpoch,
        isRead: true,
      );

      _botMessages.add(botReply);
      _saveBotMessages();
    } catch (e) {
      print('❌ 获取机器人回复失败: $e');
      // 添加默认回复
      final defaultReply = ChatMessage(
        id: _uuid.v4(),
        chatId: 'bot_chat',
        senderId: _botId,
        receiverId: _currentUser!.id,
        type: MessageType.text,
        content: _deepSeekService.getDefaultReply(),
        timestamp: DateTime.now().millisecondsSinceEpoch,
        isRead: true,
      );
      _botMessages.add(defaultReply);
      _saveBotMessages();
    } finally {
      _botIsReplying = false;
      notifyListeners();
    }

    return true;
  }

  /// 清空机器人聊天记录
  Future<void> clearBotMessages() async {
    _botMessages.clear();
    await _saveBotMessages();
    _addWelcomeMessage();
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



