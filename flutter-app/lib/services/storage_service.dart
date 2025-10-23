import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../models/treasure.dart';

class StorageService {
  static const String _userKey = 'user_data';
  static const String _treasuresKey = 'treasures_data';

  // 保存用户数据
  Future<void> saveUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = jsonEncode(user.toJson());
    await prefs.setString(_userKey, userJson);
  }

  // 获取用户数据
  Future<User?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString(_userKey);
    if (userJson == null) return null;
    
    try {
      final userMap = jsonDecode(userJson);
      return User.fromJson(userMap);
    } catch (e) {
      print('❌ 加载用户数据失败: $e');
      return null;
    }
  }

  // 保存宝藏数据
  Future<void> saveTreasures(List<Treasure> treasures) async {
    final prefs = await SharedPreferences.getInstance();
    final treasuresJson = jsonEncode(
      treasures.map((t) => t.toJson()).toList(),
    );
    await prefs.setString(_treasuresKey, treasuresJson);
  }

  // 获取宝藏数据
  Future<List<Treasure>> getTreasures() async {
    final prefs = await SharedPreferences.getInstance();
    final treasuresJson = prefs.getString(_treasuresKey);
    if (treasuresJson == null) return [];
    
    try {
      final List<dynamic> treasuresList = jsonDecode(treasuresJson);
      return treasuresList.map((t) => Treasure.fromJson(t)).toList();
    } catch (e) {
      print('❌ 加载宝藏数据失败: $e');
      return [];
    }
  }

  // 清除所有数据
  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}

