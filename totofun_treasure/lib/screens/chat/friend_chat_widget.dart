import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/chat_provider.dart';
import '../../models/chat_message.dart';

/// 好友聊天组件（右下角）
class FriendChatWidget extends StatefulWidget {
  final String friendId;

  const FriendChatWidget({
    super.key,
    required this.friendId,
  });

  @override
  State<FriendChatWidget> createState() => _FriendChatWidgetState();
}

class _FriendChatWidgetState extends State<FriendChatWidget> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ChatProvider>().startChatWith(widget.friendId);
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    final chatProvider = context.read<ChatProvider>();
    final success = await chatProvider.sendTextMessage(content);

    if (success) {
      _messageController.clear();
      Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(16),
          topRight: Radius.circular(16),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        children: [
          // 标题栏
          Consumer<ChatProvider>(
            builder: (context, chatProvider, child) {
              final friend = chatProvider.currentChatFriend;
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.green[50],
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(16),
                  ),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: Colors.green,
                      backgroundImage: friend?.avatar != null
                          ? NetworkImage(friend!.avatar!)
                          : null,
                      child: friend?.avatar == null
                          ? Text(
                              friend?.nickname.substring(0, 1) ?? '?',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            friend?.nickname ?? '加载中...',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (friend != null)
                            Text(
                              friend.statusText,
                              style: TextStyle(
                                fontSize: 11,
                                color: friend.isOnline ? Colors.green : Colors.grey,
                              ),
                            ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.more_vert, size: 20),
                      onPressed: _showChatOptions,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
              );
            },
          ),

          // 消息列表
          Expanded(
            child: Consumer<ChatProvider>(
              builder: (context, chatProvider, child) {
                final messages = chatProvider.currentMessages;

                if (messages.isEmpty) {
                  return const Center(
                    child: Text(
                      '开始聊天吧',
                      style: TextStyle(color: Colors.grey),
                    ),
                  );
                }

                WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());

                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(12),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final message = messages[index];
                    final isMe = message.senderId == chatProvider.currentUser?.id;
                    return _buildMessageItem(message, isMe);
                  },
                );
              },
            ),
          ),

          // 输入框
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildMessageItem(ChatMessage message, bool isMe) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isMe) ...[
            Consumer<ChatProvider>(
              builder: (context, chatProvider, child) {
                final friend = chatProvider.currentChatFriend;
                return CircleAvatar(
                  radius: 14,
                  backgroundColor: Colors.green,
                  backgroundImage: friend?.avatar != null
                      ? NetworkImage(friend!.avatar!)
                      : null,
                  child: friend?.avatar == null
                      ? Text(
                          friend?.nickname.substring(0, 1) ?? '?',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                          ),
                        )
                      : null,
                );
              },
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isMe ? Colors.green : Colors.grey[200],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: _buildMessageContent(message, isMe),
                ),
                const SizedBox(height: 4),
                Text(
                  message.formattedTime,
                  style: const TextStyle(
                    fontSize: 9,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),
          if (isMe) ...[
            const SizedBox(width: 8),
            Consumer<ChatProvider>(
              builder: (context, chatProvider, child) {
                final user = chatProvider.currentUser;
                return CircleAvatar(
                  radius: 14,
                  backgroundColor: Colors.blue,
                  backgroundImage: user?.avatar != null
                      ? NetworkImage(user!.avatar!)
                      : null,
                  child: user?.avatar == null
                      ? Text(
                          user?.nickname.substring(0, 1) ?? '我',
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                        )
                      : null,
                );
              },
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMessageContent(ChatMessage message, bool isMe) {
    switch (message.type) {
      case MessageType.text:
        return Text(
          message.content,
          style: TextStyle(
            color: isMe ? Colors.white : Colors.black87,
            fontSize: 13,
          ),
        );

      case MessageType.location:
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.location_on,
              color: isMe ? Colors.white : Colors.red,
              size: 16,
            ),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                message.content,
                style: TextStyle(
                  color: isMe ? Colors.white : Colors.black87,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        );

      case MessageType.treasure:
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.card_giftcard,
              color: isMe ? Colors.white : Colors.orange,
              size: 16,
            ),
            const SizedBox(width: 4),
            Text(
              message.content,
              style: TextStyle(
                color: isMe ? Colors.white : Colors.black87,
                fontSize: 13,
              ),
            ),
          ],
        );

      case MessageType.task:
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.task_alt,
              color: isMe ? Colors.white : Colors.blue,
              size: 16,
            ),
            const SizedBox(width: 4),
            Text(
              message.content,
              style: TextStyle(
                color: isMe ? Colors.white : Colors.black87,
                fontSize: 13,
              ),
            ),
          ],
        );

      case MessageType.invite:
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.group_add,
              color: isMe ? Colors.white : Colors.purple,
              size: 16,
            ),
            const SizedBox(width: 4),
            Text(
              message.content,
              style: TextStyle(
                color: isMe ? Colors.white : Colors.black87,
                fontSize: 13,
              ),
            ),
          ],
        );

      default:
        return Text(
          message.content,
          style: TextStyle(
            color: isMe ? Colors.white : Colors.black87,
            fontSize: 13,
          ),
        );
    }
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        border: Border(
          top: BorderSide(color: Colors.grey[200]!),
        ),
      ),
      child: SafeArea(
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.add_circle_outline, size: 20),
              onPressed: _showMoreOptions,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
            Expanded(
              child: TextField(
                controller: _messageController,
                decoration: InputDecoration(
                  hintText: '输入消息...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                ),
                maxLines: null,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendMessage(),
                style: const TextStyle(fontSize: 13),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.send, size: 20),
              color: Colors.green,
              onPressed: _sendMessage,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ],
        ),
      ),
    );
  }

  void _showMoreOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.location_on, color: Colors.red),
                title: const Text('发送位置'),
                onTap: () {
                  Navigator.pop(context);
                  _sendLocation();
                },
              ),
              ListTile(
                leading: const Icon(Icons.card_giftcard, color: Colors.orange),
                title: const Text('分享宝藏'),
                onTap: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('宝藏分享功能开发中...')),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.task_alt, color: Colors.blue),
                title: const Text('分享任务'),
                onTap: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('任务分享功能开发中...')),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.group_add, color: Colors.purple),
                title: const Text('组队邀请'),
                onTap: () {
                  Navigator.pop(context);
                  _sendInvite();
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _sendLocation() async {
    final chatProvider = context.read<ChatProvider>();
    await chatProvider.sendLocationMessage(
      30.2741,
      120.1551,
      '杭州市西湖区',
    );
  }

  void _sendInvite() async {
    final chatProvider = context.read<ChatProvider>();
    await chatProvider.sendInviteMessage('寻宝', 'treasure_hunt');
  }

  void _showChatOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.delete_outline),
                title: const Text('清空聊天记录'),
                onTap: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('清空聊天记录功能开发中...')),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

