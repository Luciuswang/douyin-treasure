import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// DeepSeek API 服务
class DeepSeekService {
  static const String _apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  static const String _apiKeyKey = 'deepseek_api_key';
  static const String _model = 'deepseek-chat';

  /// 获取 API Key
  Future<String?> getApiKey() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_apiKeyKey);
  }

  /// 设置 API Key
  Future<bool> setApiKey(String apiKey) async {
    if (apiKey.trim().isEmpty) {
      return await removeApiKey();
    }
    final prefs = await SharedPreferences.getInstance();
    return await prefs.setString(_apiKeyKey, apiKey.trim());
  }

  /// 移除 API Key
  Future<bool> removeApiKey() async {
    final prefs = await SharedPreferences.getInstance();
    return await prefs.remove(_apiKeyKey);
  }

  /// 获取 AI 回复
  /// 
  /// [userMessage] 用户消息
  /// [conversationHistory] 对话历史（最近5条消息）
  /// [userNickname] 用户昵称
  /// [userLevel] 用户等级
  Future<String?> getAIReply(
    String userMessage, {
    List<Map<String, String>>? conversationHistory,
    String? userNickname,
    int userLevel = 1,
  }) async {
    final apiKey = await getApiKey();
    if (apiKey == null || apiKey.isEmpty) {
      print('⚠️ 未配置 DeepSeek API 密钥');
      return null;
    }

    try {
      // 构建消息列表
      final messages = <Map<String, String>>[];

      // 系统提示词
      messages.add({
        'role': 'system',
        'content': '''你是Totofun寻宝游戏的AI伙伴"小突"，性格活泼可爱，说话简洁幽默，喜欢用emoji。

你的能力：
- 帮助用户解答游戏相关问题（寻宝、好友、成就等）
- 提供日常生活咨询（学习、健康、生活技巧等）
- 提供学习辅导（作业、知识点、学习方法等）
- 提供健康建议（注意：不能替代专业医疗诊断，只能提供一般性建议）
- 陪伴聊天，做用户的好朋友

用户信息：
- 昵称：${userNickname ?? '玩家'}
- 等级：Lv$userLevel

回复要求：
- 简短（50-100字以内）
- 活泼有趣，使用emoji
- 如果是医疗问题，要提醒用户咨询专业医生
- 如果是学习问题，要给出具体建议
- 保持友好和鼓励的语气''',
      });

      // 添加对话历史
      if (conversationHistory != null && conversationHistory.isNotEmpty) {
        messages.addAll(conversationHistory);
      }

      // 添加当前用户消息
      messages.add({
        'role': 'user',
        'content': userMessage,
      });

      print('🤖 调用 DeepSeek API: ${messages.length} 条消息');

      // 发送请求
      final response = await http.post(
        Uri.parse(_apiUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $apiKey',
        },
        body: jsonEncode({
          'model': _model,
          'messages': messages,
          'max_tokens': 200,
          'temperature': 0.8,
          'stream': false,
        }),
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('请求超时');
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final reply = data['choices']?[0]?['message']?['content'] as String?;
        if (reply != null && reply.isNotEmpty) {
          print('✅ DeepSeek API 回复成功: ${reply.substring(0, reply.length > 50 ? 50 : reply.length)}...');
          return reply;
        }
      } else {
        final errorData = jsonDecode(response.body) as Map<String, dynamic>?;
        print('❌ DeepSeek API 调用失败: ${response.statusCode} - ${errorData?['error']}');
        
        if (response.statusCode == 401) {
          print('❌ API 密钥无效，请检查配置');
        }
      }
    } catch (e) {
      print('❌ DeepSeek API 调用异常: $e');
    }

    return null;
  }

  /// 获取默认机器人回复（当 API 不可用时）
  String getDefaultReply() {
    final replies = [
      '我在听呢！😊 有什么想聊的吗？',
      '嗯嗯，我在呢~ 有什么问题吗？',
      '我在！有什么需要帮助的吗？',
      '虽然我不太懂，但我很愿意听你说~ 💙',
      '让我想想... 你可以试试问我关于寻宝的问题哦！',
      '哈哈，这个问题有点难呢~ 要不我们聊聊寻宝？',
      '我在学习呢，多和我聊天我会变得更聪明！😄',
    ];
    return replies[DateTime.now().millisecond % replies.length];
  }
}

