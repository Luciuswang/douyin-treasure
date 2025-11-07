import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/chat_provider.dart';
import '../../models/chat_message.dart';

/// 聊天页面
class ChatScreen extends StatefulWidget {
  final String friendId;

  const ChatScreen({
    super.key,
    required this.friendId,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    // 加载聊天记录
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ChatProvider>().startChatWith(widget.friendId);
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    context.read<ChatProvider>().endCurrentChat();
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
      // 延迟滚动，等待消息添加到列表
      Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Consumer<ChatProvider>(
          builder: (context, chatProvider, child) {
            final friend = chatProvider.currentChatFriend;
            return Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: Colors.white,
                  backgroundImage: friend?.avatar != null
                      ? NetworkImage(friend!.avatar!)
                      : null,
                  child: friend?.avatar == null
                      ? Text(
                          friend?.nickname.substring(0, 1) ?? '?',
                          style: const TextStyle(fontSize: 16),
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
                        style: const TextStyle(fontSize: 16),
                      ),
                      if (friend != null)
                        Text(
                          friend.statusText,
                          style: TextStyle(
                            fontSize: 12,
                            color: friend.isOnline ? Colors.green : Colors.grey[300],
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () {
              _showChatOptions();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // 消息列表
          Expanded(
            child: _buildMessageList(),
          ),

          // 输入框
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildMessageList() {
    return Consumer<ChatProvider>(
      builder: (context, chatProvider, child) {
        final messages = chatProvider.currentMessages;

        if (messages.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.chat_bubble_outline,
                  size: 80,
                  color: Colors.grey[400],
                ),
                const SizedBox(height: 16),
                Text(
                  '开始聊天吧',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          );
        }

        // 滚动到底部
        WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());

        return ListView.builder(
          controller: _scrollController,
          padding: const EdgeInsets.all(16),
          itemCount: messages.length,
          itemBuilder: (context, index) {
            final message = messages[index];
            final isMe = message.senderId == chatProvider.currentUser?.id;
            return _buildMessageItem(message, isMe);
          },
        );
      },
    );
  }

  Widget _buildMessageItem(ChatMessage message, bool isMe) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isMe) ...[
            Consumer<ChatProvider>(
              builder: (context, chatProvider, child) {
                final friend = chatProvider.currentChatFriend;
                return CircleAvatar(
                  radius: 18,
                  backgroundColor: Colors.blue,
                  backgroundImage: friend?.avatar != null
                      ? NetworkImage(friend!.avatar!)
                      : null,
                  child: friend?.avatar == null
                      ? Text(
                          friend?.nickname.substring(0, 1) ?? '?',
                          style: const TextStyle(color: Colors.white, fontSize: 14),
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
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isMe ? Colors.blue : Colors.grey[300],
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: _buildMessageContent(message, isMe),
                ),
                const SizedBox(height: 4),
                Text(
                  message.formattedTime,
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.grey[600],
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
                  radius: 18,
                  backgroundColor: Colors.green,
                  backgroundImage: user?.avatar != null
                      ? NetworkImage(user!.avatar!)
                      : null,
                  child: user?.avatar == null
                      ? Text(
                          user?.nickname.substring(0, 1) ?? '我',
                          style: const TextStyle(color: Colors.white, fontSize: 14),
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
            fontSize: 15,
          ),
        );

      case MessageType.location:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.location_on,
                  color: isMe ? Colors.white : Colors.red,
                  size: 20,
                ),
                const SizedBox(width: 4),
                Text(
                  '位置分享',
                  style: TextStyle(
                    color: isMe ? Colors.white : Colors.black87,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              message.content,
              style: TextStyle(
                color: isMe ? Colors.white70 : Colors.black54,
                fontSize: 13,
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
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              message.content,
              style: TextStyle(
                color: isMe ? Colors.white : Colors.black87,
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
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              message.content,
              style: TextStyle(
                color: isMe ? Colors.white : Colors.black87,
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
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              message.content,
              style: TextStyle(
                color: isMe ? Colors.white : Colors.black87,
              ),
            ),
          ],
        );

      default:
        return Text(
          message.content,
          style: TextStyle(
            color: isMe ? Colors.white : Colors.black87,
          ),
        );
    }
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // 更多选项
            IconButton(
              icon: const Icon(Icons.add_circle_outline),
              onPressed: _showMoreOptions,
            ),

            // 输入框
            Expanded(
              child: TextField(
                controller: _messageController,
                decoration: InputDecoration(
                  hintText: '输入消息...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: Colors.grey[100],
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                ),
                maxLines: null,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendMessage(),
              ),
            ),

            const SizedBox(width: 8),

            // 发送按钮
            IconButton(
              icon: const Icon(Icons.send),
              color: Colors.blue,
              onPressed: _sendMessage,
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
    // 这里应该获取当前位置
    // 暂时使用模拟数据
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


