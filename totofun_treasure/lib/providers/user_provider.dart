import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/storage_service.dart';

class UserProvider with ChangeNotifier {
  User _user = User();
  final _storageService = StorageService();

  User get user => _user;

  UserProvider() {
    _loadUser();
  }

  // 加载用户数据
  Future<void> _loadUser() async {
    final userData = await _storageService.getUser();
    if (userData != null) {
      _user = userData;
      notifyListeners();
    }
  }

  // 保存用户数据
  Future<void> _saveUser() async {
    await _storageService.saveUser(_user);
  }

  // 添加经验
  Future<bool> addExperience(int exp) async {
    final leveledUp = _user.addExperience(exp);
    await _saveUser();
    notifyListeners();
    return leveledUp;
  }

  // 添加金币
  Future<void> addCoins(int coins) async {
    _user.addCoins(coins);
    await _saveUser();
    notifyListeners();
  }

  // 发现宝藏
  Future<void> discoverTreasure(String treasureId, int exp, int coins) async {
    _user.discoverTreasure(treasureId);
    final leveledUp = await addExperience(exp);
    await addCoins(coins);
    
    if (leveledUp) {
      // 可以在这里触发升级动画
      print('🎉 恭喜升级到${_user.level}级！');
    }
  }

  // 重置用户数据
  Future<void> resetUser() async {
    _user = User();
    await _saveUser();
    notifyListeners();
  }
}

