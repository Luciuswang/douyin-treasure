import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'bot_chat_widget.dart';
import 'friend_chat_widget.dart';
import '../../providers/chat_provider.dart';
import 'friends_screen.dart';

/// 双聊天界面 - 左下角机器人聊天，右下角好友聊天
class DualChatScreen extends StatefulWidget {
  final String? friendId;

  const DualChatScreen({
    super.key,
    this.friendId,
  });

  @override
  State<DualChatScreen> createState() => _DualChatScreenState();
}

class _DualChatScreenState extends State<DualChatScreen> {
  String? _currentFriendId;

  @override
  void initState() {
    super.initState();
    _currentFriendId = widget.friendId;
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    
    // 计算每个聊天窗口的高度（各占一半，减去一些间距）
    final chatHeight = (screenHeight - MediaQuery.of(context).padding.top - 20) / 2;

    return Scaffold(
      appBar: AppBar(
        title: const Text('聊天'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 上半部分：机器人聊天（左下角视觉）
            SizedBox(
              height: chatHeight,
              child: const BotChatWidget(),
            ),

            // 分隔线
            Container(
              height: 2,
              color: Colors.grey[300],
            ),

            // 下半部分：好友聊天（右下角视觉）
            Expanded(
              child: _currentFriendId != null
                  ? FriendChatWidget(friendId: _currentFriendId!)
                  : _buildNoFriendSelected(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoFriendSelected() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            '选择一个好友开始聊天',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () async {
              // 导航到好友列表选择好友
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const FriendsScreen(),
                ),
              );
              // 如果返回了选中的好友ID，更新界面
              if (result != null && result is String) {
                setState(() {
                  _currentFriendId = result;
                });
              }
            },
            icon: const Icon(Icons.people),
            label: const Text('选择好友'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          Consumer<ChatProvider>(
            builder: (context, chatProvider, child) {
              final friends = chatProvider.acceptedFriends;
              if (friends.isEmpty) {
                return const SizedBox.shrink();
              }
              return SizedBox(
                height: 200,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        '最近的好友',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[700],
                        ),
                      ),
                    ),
                    Expanded(
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        itemCount: friends.length > 5 ? 5 : friends.length,
                        itemBuilder: (context, index) {
                          final friendship = friends[index];
                          final friend = chatProvider.getFriendUser(friendship.friendId);
                          return GestureDetector(
                            onTap: () {
                              setState(() {
                                _currentFriendId = friendship.friendId;
                              });
                            },
                            child: Container(
                              width: 80,
                              margin: const EdgeInsets.symmetric(horizontal: 8),
                              child: Column(
                                children: [
                                  CircleAvatar(
                                    radius: 30,
                                    backgroundColor: Colors.green,
                                    backgroundImage: friend?.avatar != null
                                        ? NetworkImage(friend!.avatar!)
                                        : null,
                                    child: friend?.avatar == null
                                        ? Text(
                                            friend?.nickname.substring(0, 1) ?? '?',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 20,
                                            ),
                                          )
                                        : null,
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    friend?.nickname ?? '未知',
                                    style: const TextStyle(fontSize: 12),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

