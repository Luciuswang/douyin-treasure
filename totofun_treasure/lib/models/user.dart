class User {
  String name;
  int level;
  int experience;
  int coins;
  int treasuresDiscovered;
  List<String> discoveredTreasureIds;

  User({
    this.name = '寻宝者',
    this.level = 1,
    this.experience = 0,
    this.coins = 0,
    this.treasuresDiscovered = 0,
    List<String>? discoveredTreasureIds,
  }) : discoveredTreasureIds = discoveredTreasureIds ?? [];

  // 获取当前等级所需经验
  int get experienceForCurrentLevel => level * 100;

  // 获取下一等级所需经验
  int get experienceForNextLevel => (level + 1) * 100;

  // 获取当前等级进度（0-1）
  double get levelProgress {
    final currentLevelExp = experienceForCurrentLevel;
    final nextLevelExp = experienceForNextLevel;
    final exp = experience - currentLevelExp;
    final required = nextLevelExp - currentLevelExp;
    return (exp / required).clamp(0.0, 1.0);
  }

  // 添加经验
  bool addExperience(int exp) {
    experience += exp;
    bool leveledUp = false;
    
    while (experience >= experienceForNextLevel) {
      level++;
      leveledUp = true;
    }
    
    return leveledUp;
  }

  // 添加金币
  void addCoins(int amount) {
    coins += amount;
  }

  // 发现宝藏
  void discoverTreasure(String treasureId) {
    if (!discoveredTreasureIds.contains(treasureId)) {
      discoveredTreasureIds.add(treasureId);
      treasuresDiscovered++;
    }
  }

  // 转换为JSON
  Map<String, dynamic> toJson() => {
        'name': name,
        'level': level,
        'experience': experience,
        'coins': coins,
        'treasuresDiscovered': treasuresDiscovered,
        'discoveredTreasureIds': discoveredTreasureIds,
      };

  // 从JSON创建
  factory User.fromJson(Map<String, dynamic> json) => User(
        name: json['name'] ?? '寻宝者',
        level: json['level'] ?? 1,
        experience: json['experience'] ?? 0,
        coins: json['coins'] ?? 0,
        treasuresDiscovered: json['treasuresDiscovered'] ?? 0,
        discoveredTreasureIds:
            List<String>.from(json['discoveredTreasureIds'] ?? []),
      );
}

