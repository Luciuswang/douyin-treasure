import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/chat_provider.dart';
import '../../models/friendship.dart';
import 'chat_screen.dart';
import 'add_friend_screen.dart';

/// 好友列表页面
class FriendsScreen extends StatefulWidget {
  const FriendsScreen({super.key});

  @override
  State<FriendsScreen> createState() => _FriendsScreenState();
}

class _FriendsScreenState extends State<FriendsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('好友'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: '我的好友'),
            Tab(text: '新的请求'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const AddFriendScreen(),
                ),
              );
            },
            tooltip: '添加好友',
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildFriendsList(),
          _buildRequestsList(),
        ],
      ),
    );
  }

  // 好友列表
  Widget _buildFriendsList() {
    return Consumer<ChatProvider>(
      builder: (context, chatProvider, child) {
        final friends = chatProvider.acceptedFriends;

        if (friends.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.people_outline,
                  size: 80,
                  color: Colors.grey[400],
                ),
                const SizedBox(height: 16),
                Text(
                  '还没有好友',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '点击右上角添加好友吧',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[500],
                  ),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          itemCount: friends.length,
          itemBuilder: (context, index) {
            final friendship = friends[index];
            final friend = chatProvider.getFriendUser(friendship.friendId);

            return ListTile(
              leading: CircleAvatar(
                backgroundColor: Colors.blue,
                backgroundImage: friend?.avatar != null
                    ? NetworkImage(friend!.avatar!)
                    : null,
                child: friend?.avatar == null
                    ? Text(
                        friend?.nickname.substring(0, 1) ?? '?',
                        style: const TextStyle(color: Colors.white),
                      )
                    : null,
              ),
              title: Text(friend?.nickname ?? '未知用户'),
              subtitle: Text(
                friend?.statusText ?? '离线',
                style: TextStyle(
                  color: friend?.isOnline == true ? Colors.green : Colors.grey,
                  fontSize: 12,
                ),
              ),
              trailing: friend?.isOnline == true
                  ? Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                    )
                  : null,
              onTap: () {
                // 打开聊天页面
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ChatScreen(friendId: friendship.friendId),
                  ),
                );
              },
              onLongPress: () {
                _showFriendOptions(context, friendship);
              },
            );
          },
        );
      },
    );
  }

  // 好友请求列表
  Widget _buildRequestsList() {
    return Consumer<ChatProvider>(
      builder: (context, chatProvider, child) {
        final requests = chatProvider.pendingRequests;

        if (requests.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.inbox_outlined,
                  size: 80,
                  color: Colors.grey[400],
                ),
                const SizedBox(height: 16),
                Text(
                  '没有新的好友请求',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          itemCount: requests.length,
          itemBuilder: (context, index) {
            final friendship = requests[index];
            
            return FutureBuilder(
              future: chatProvider.searchUsers(friendship.friendId),
              builder: (context, snapshot) {
                final friend = snapshot.data?.firstOrNull;

                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: Colors.blue,
                          backgroundImage: friend?.avatar != null
                              ? NetworkImage(friend!.avatar!)
                              : null,
                          child: friend?.avatar == null
                              ? Text(
                                  friend?.nickname.substring(0, 1) ?? '?',
                                  style: const TextStyle(color: Colors.white),
                                )
                              : null,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                friend?.nickname ?? '未知用户',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '请求添加你为好友',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Row(
                          children: [
                            TextButton(
                              onPressed: () async {
                                final success = await chatProvider.acceptFriendRequest(
                                  friendship.friendId,
                                );
                                if (success && mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('已接受好友请求')),
                                  );
                                }
                              },
                              child: const Text('接受'),
                            ),
                            TextButton(
                              onPressed: () async {
                                final success = await chatProvider.rejectFriendRequest(
                                  friendship.friendId,
                                );
                                if (success && mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('已拒绝好友请求')),
                                  );
                                }
                              },
                              style: TextButton.styleFrom(
                                foregroundColor: Colors.grey,
                              ),
                              child: const Text('拒绝'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  // 显示好友选项
  void _showFriendOptions(BuildContext context, Friendship friendship) {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.chat),
                title: const Text('发送消息'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ChatScreen(friendId: friendship.friendId),
                    ),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.delete, color: Colors.red),
                title: const Text('删除好友', style: TextStyle(color: Colors.red)),
                onTap: () async {
                  Navigator.pop(context);
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('删除好友'),
                      content: const Text('确定要删除这个好友吗？'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: const Text('取消'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(context, true),
                          style: TextButton.styleFrom(foregroundColor: Colors.red),
                          child: const Text('删除'),
                        ),
                      ],
                    ),
                  );

                  if (confirmed == true && mounted) {
                    final chatProvider = context.read<ChatProvider>();
                    final success = await chatProvider.removeFriend(friendship.friendId);
                    if (success && mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('已删除好友')),
                      );
                    }
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }
}


