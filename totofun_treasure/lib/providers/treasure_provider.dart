import 'dart:math';
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/treasure.dart';
import '../services/storage_service.dart';

class TreasureProvider with ChangeNotifier {
  final List<Treasure> _treasures = [];
  final _storageService = StorageService();
  final _uuid = const Uuid();

  List<Treasure> get treasures => _treasures;
  List<Treasure> get undiscoveredTreasures =>
      _treasures.where((t) => !t.discovered).toList();

  TreasureProvider() {
    _loadTreasures();
  }

  // 加载宝藏数据
  Future<void> _loadTreasures() async {
    final savedTreasures = await _storageService.getTreasures();
    if (savedTreasures.isNotEmpty) {
      _treasures.clear();
      _treasures.addAll(savedTreasures);
      notifyListeners();
    }
  }

  // 保存宝藏数据
  Future<void> _saveTreasures() async {
    await _storageService.saveTreasures(_treasures);
  }

  // 生成附近的宝藏
  Future<void> generateNearbyTreasures(double userLat, double userLon,
      {int count = 5}) async {
    _treasures.clear();

    final random = Random();
    
    for (int i = 0; i < count; i++) {
      final type = _getRandomTreasureType();
      final angle = random.nextDouble() * 2 * pi;
      final distance = random.nextDouble() * 0.003 + 0.001; // 100-400米

      final lat = userLat + sin(angle) * distance;
      final lon = userLon + cos(angle) * distance;

      final treasure = Treasure(
        id: _uuid.v4(),
        name: _getTreasureName(type),
        description: _getTreasureDescription(type),
        latitude: lat,
        longitude: lon,
        type: type,
        experience: _getExperienceForType(type),
        coins: _getCoinsForType(type),
        discoveryRadius: 30.0,
      );

      _treasures.add(treasure);
    }

    await _saveTreasures();
    notifyListeners();
    
    print('🎁 生成了${_treasures.length}个宝藏');
  }

  // 发现宝藏
  Future<bool> discoverTreasure(String treasureId) async {
    final index = _treasures.indexWhere((t) => t.id == treasureId);
    if (index == -1 || _treasures[index].discovered) {
      return false;
    }

    _treasures[index].discovered = true;
    await _saveTreasures();
    notifyListeners();
    
    print('✅ 发现宝藏: ${_treasures[index].name}');
    return true;
  }

  // 清除所有宝藏
  Future<void> clearAllTreasures() async {
    _treasures.clear();
    await _saveTreasures();
    notifyListeners();
  }

  // 根据稀有度随机选择宝藏类型
  TreasureType _getRandomTreasureType() {
    final random = Random();
    final value = random.nextInt(100);

    if (value < 40) return TreasureType.common;
    if (value < 70) return TreasureType.uncommon;
    if (value < 90) return TreasureType.rare;
    if (value < 98) return TreasureType.epic;
    return TreasureType.legendary;
  }

  String _getTreasureName(TreasureType type) {
    switch (type) {
      case TreasureType.common:
        return '普通宝箱';
      case TreasureType.uncommon:
        return '精致宝箱';
      case TreasureType.rare:
        return '稀有宝箱';
      case TreasureType.epic:
        return '史诗宝箱';
      case TreasureType.legendary:
        return '传说宝箱';
    }
  }

  String _getTreasureDescription(TreasureType type) {
    switch (type) {
      case TreasureType.common:
        return '一个普通的宝箱，里面有些小奖励';
      case TreasureType.uncommon:
        return '看起来不错的宝箱，值得一探';
      case TreasureType.rare:
        return '稀有的宝箱，闪耀着蓝色的光芒';
      case TreasureType.epic:
        return '史诗级宝箱，散发着紫色的神秘光芒';
      case TreasureType.legendary:
        return '传说中的宝箱，金光闪闪！';
    }
  }

  int _getExperienceForType(TreasureType type) {
    switch (type) {
      case TreasureType.common:
        return 10;
      case TreasureType.uncommon:
        return 25;
      case TreasureType.rare:
        return 50;
      case TreasureType.epic:
        return 100;
      case TreasureType.legendary:
        return 250;
    }
  }

  int _getCoinsForType(TreasureType type) {
    switch (type) {
      case TreasureType.common:
        return 5;
      case TreasureType.uncommon:
        return 15;
      case TreasureType.rare:
        return 30;
      case TreasureType.epic:
        return 75;
      case TreasureType.legendary:
        return 200;
    }
  }
}

