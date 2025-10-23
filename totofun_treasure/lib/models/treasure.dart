import 'package:flutter/material.dart';

class Treasure {
  final String id;
  final String name;
  final String description;
  final double latitude;
  final double longitude;
  final TreasureType type;
  final int experience;
  final int coins;
  final double discoveryRadius; // 发现半径（米）
  bool discovered;

  Treasure({
    required this.id,
    required this.name,
    required this.description,
    required this.latitude,
    required this.longitude,
    required this.type,
    required this.experience,
    required this.coins,
    this.discoveryRadius = 30.0,
    this.discovered = false,
  });

  // 转换为JSON
  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'latitude': latitude,
        'longitude': longitude,
        'type': type.toString(),
        'experience': experience,
        'coins': coins,
        'discoveryRadius': discoveryRadius,
        'discovered': discovered,
      };

  // 从JSON创建
  factory Treasure.fromJson(Map<String, dynamic> json) => Treasure(
        id: json['id'],
        name: json['name'],
        description: json['description'],
        latitude: json['latitude'],
        longitude: json['longitude'],
        type: TreasureType.values.firstWhere(
          (e) => e.toString() == json['type'],
          orElse: () => TreasureType.common,
        ),
        experience: json['experience'],
        coins: json['coins'],
        discoveryRadius: json['discoveryRadius'] ?? 30.0,
        discovered: json['discovered'] ?? false,
      );
}

enum TreasureType {
  common,    // 普通
  uncommon,  // 少见
  rare,      // 稀有
  epic,      // 史诗
  legendary, // 传说
}

extension TreasureTypeExtension on TreasureType {
  String get displayName {
    switch (this) {
      case TreasureType.common:
        return '普通宝藏';
      case TreasureType.uncommon:
        return '少见宝藏';
      case TreasureType.rare:
        return '稀有宝藏';
      case TreasureType.epic:
        return '史诗宝藏';
      case TreasureType.legendary:
        return '传说宝藏';
    }
  }

  Color get color {
    switch (this) {
      case TreasureType.common:
        return const Color(0xFF9E9E9E);
      case TreasureType.uncommon:
        return const Color(0xFF4CAF50);
      case TreasureType.rare:
        return const Color(0xFF2196F3);
      case TreasureType.epic:
        return const Color(0xFF9C27B0);
      case TreasureType.legendary:
        return const Color(0xFFFF9800);
    }
  }

  String get emoji {
    switch (this) {
      case TreasureType.common:
        return '📦';
      case TreasureType.uncommon:
        return '🎁';
      case TreasureType.rare:
        return '💎';
      case TreasureType.epic:
        return '👑';
      case TreasureType.legendary:
        return '⭐';
    }
  }
}

