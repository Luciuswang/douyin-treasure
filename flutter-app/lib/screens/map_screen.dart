import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:amap_flutter_map/amap_flutter_map.dart';
import '../services/location_service.dart';
import '../providers/user_provider.dart';
import '../providers/treasure_provider.dart';
import '../models/treasure.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final _locationService = LocationService();
  AMapController? _mapController;
  Position? _currentPosition;
  bool _isLoading = true;
  String _statusMessage = '正在初始化...';

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    setState(() {
      _statusMessage = '正在请求定位权限...';
    });

    // 请求权限
    final hasPermission = await _locationService.checkAndRequestPermission();
    if (!hasPermission) {
      setState(() {
        _isLoading = false;
        _statusMessage = '定位权限被拒绝';
      });
      _showPermissionDialog();
      return;
    }

    // 获取当前位置
    setState(() {
      _statusMessage = '正在获取GPS位置...';
    });

    final position = await _locationService.getCurrentPosition();
    if (position == null) {
      setState(() {
        _isLoading = false;
        _statusMessage = '定位失败，请重试';
      });
      return;
    }

    setState(() {
      _currentPosition = position;
      _isLoading = false;
      _statusMessage = '定位成功！';
    });

    // 生成宝藏
    if (mounted) {
      final treasureProvider = context.read<TreasureProvider>();
      await treasureProvider.generateNearbyTreasures(
        position.latitude,
        position.longitude,
      );
    }

    // 开始持续定位
    _locationService.startLocationUpdates();
    _listenToLocationUpdates();
  }

  void _listenToLocationUpdates() {
    _locationService.positionStream.listen((position) {
      setState(() {
        _currentPosition = position;
      });
      _checkNearbyTreasures(position);
    });
  }

  void _checkNearbyTreasures(Position position) {
    final treasureProvider = context.read<TreasureProvider>();
    final userProvider = context.read<UserProvider>();

    for (final treasure in treasureProvider.undiscoveredTreasures) {
      final distance = _locationService.calculateDistance(
        position.latitude,
        position.longitude,
        treasure.latitude,
        treasure.longitude,
      );

      // 在发现范围内
      if (distance <= treasure.discoveryRadius) {
        _onTreasureDiscovered(treasure, userProvider, treasureProvider);
      }
    }
  }

  Future<void> _onTreasureDiscovered(
    Treasure treasure,
    UserProvider userProvider,
    TreasureProvider treasureProvider,
  ) async {
    await treasureProvider.discoverTreasure(treasure.id);
    await userProvider.discoverTreasure(
      treasure.id,
      treasure.experience,
      treasure.coins,
    );

    if (mounted) {
      _showTreasureDiscoveredDialog(treasure);
    }
  }

  void _showTreasureDiscoveredDialog(Treasure treasure) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Text(treasure.type.emoji, style: const TextStyle(fontSize: 32)),
            const SizedBox(width: 12),
            Expanded(child: Text('发现${treasure.name}！')),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(treasure.description),
            const SizedBox(height: 16),
            Text('🎯 经验 +${treasure.experience}'),
            Text('💰 金币 +${treasure.coins}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('太好了！'),
          ),
        ],
      ),
    );
  }

  void _showPermissionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('需要定位权限'),
        content: const Text('请在设置中允许访问位置信息'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Geolocator.openAppSettings();
            },
            child: const Text('去设置'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Totofun 突突翻'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {
              // TODO: 打开个人中心
            },
          ),
        ],
      ),
      body: _isLoading
          ? _buildLoadingScreen()
          : _currentPosition == null
              ? _buildErrorScreen()
              : _buildMapScreen(),
      floatingActionButton: _currentPosition != null
          ? Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                FloatingActionButton(
                  heroTag: 'refresh',
                  onPressed: _refreshTreasures,
                  child: const Icon(Icons.refresh),
                ),
                const SizedBox(height: 16),
                FloatingActionButton(
                  heroTag: 'location',
                  onPressed: _centerToUser,
                  child: const Icon(Icons.my_location),
                ),
              ],
            )
          : null,
    );
  }

  Widget _buildLoadingScreen() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 24),
          Text(_statusMessage),
        ],
      ),
    );
  }

  Widget _buildErrorScreen() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 24),
          Text(_statusMessage),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _initializeApp,
            child: const Text('重试'),
          ),
        ],
      ),
    );
  }

  Widget _buildMapScreen() {
    return Consumer2<UserProvider, TreasureProvider>(
      builder: (context, userProvider, treasureProvider, child) {
        return Stack(
          children: [
            AMapWidget(
              initialCameraPosition: CameraPosition(
                target: LatLng(
                  _currentPosition!.latitude,
                  _currentPosition!.longitude,
                ),
                zoom: 16,
              ),
              onMapCreated: (controller) {
                _mapController = controller;
              },
              markers: _buildMarkers(treasureProvider.treasures),
            ),
            _buildUserInfoPanel(userProvider),
          ],
        );
      },
    );
  }

  Set<Marker> _buildMarkers(List<Treasure> treasures) {
    final markers = <Marker>{};

    // 用户位置标记
    if (_currentPosition != null) {
      markers.add(
        Marker(
          position: LatLng(
            _currentPosition!.latitude,
            _currentPosition!.longitude,
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
        ),
      );
    }

    // 宝藏标记
    for (final treasure in treasures) {
      if (!treasure.discovered) {
        markers.add(
          Marker(
            position: LatLng(treasure.latitude, treasure.longitude),
            icon: BitmapDescriptor.defaultMarkerWithHue(
              _getHueForTreasureType(treasure.type),
            ),
            infoWindow: InfoWindow(
              title: treasure.name,
              snippet: treasure.description,
            ),
          ),
        );
      }
    }

    return markers;
  }

  double _getHueForTreasureType(TreasureType type) {
    switch (type) {
      case TreasureType.common:
        return BitmapDescriptor.hueGreen;
      case TreasureType.uncommon:
        return BitmapDescriptor.hueCyan;
      case TreasureType.rare:
        return BitmapDescriptor.hueBlue;
      case TreasureType.epic:
        return BitmapDescriptor.hueViolet;
      case TreasureType.legendary:
        return BitmapDescriptor.hueOrange;
    }
  }

  Widget _buildUserInfoPanel(UserProvider userProvider) {
    final user = userProvider.user;
    return Positioned(
      top: 16,
      left: 16,
      right: 16,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('等级 ${user.level}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              LinearProgressIndicator(value: user.levelProgress),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('🎯 ${user.experience}/${user.experienceForNextLevel}'),
                  Text('💰 ${user.coins}'),
                  Text('🎁 ${user.treasuresDiscovered}'),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _refreshTreasures() async {
    if (_currentPosition == null) return;
    
    final treasureProvider = context.read<TreasureProvider>();
    await treasureProvider.clearAllTreasures();
    await treasureProvider.generateNearbyTreasures(
      _currentPosition!.latitude,
      _currentPosition!.longitude,
    );
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('已刷新宝藏！')),
      );
    }
  }

  void _centerToUser() {
    if (_mapController != null && _currentPosition != null) {
      _mapController!.moveCamera(
        CameraUpdate.newLatLng(
          LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
        ),
      );
    }
  }

  @override
  void dispose() {
    _locationService.stopLocationUpdates();
    super.dispose();
  }
}

