import 'dart:async';
import 'package:geolocator/geolocator.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  Position? _currentPosition;
  StreamSubscription<Position>? _positionStreamSubscription;
  final _positionController = StreamController<Position>.broadcast();

  Stream<Position> get positionStream => _positionController.stream;
  Position? get currentPosition => _currentPosition;

  // 检查并请求定位权限
  Future<bool> checkAndRequestPermission() async {
    // 检查定位服务是否启用
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    // 检查权限
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  // 获取当前位置（一次性）
  Future<Position?> getCurrentPosition() async {
    try {
      final hasPermission = await checkAndRequestPermission();
      if (!hasPermission) {
        return null;
      }

      // 使用高精度GPS定位
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.best,
        timeLimit: const Duration(seconds: 15),
      );

      _currentPosition = position;
      _positionController.add(position);
      
      print('📍 GPS定位成功');
      print('   纬度: ${position.latitude}');
      print('   经度: ${position.longitude}');
      print('   精度: ${position.accuracy}米');
      print('   海拔: ${position.altitude}米');
      
      return position;
    } catch (e) {
      print('❌ 定位失败: $e');
      return null;
    }
  }

  // 开始持续定位
  Future<void> startLocationUpdates() async {
    final hasPermission = await checkAndRequestPermission();
    if (!hasPermission) {
      return;
    }

    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.best,
      distanceFilter: 10, // 移动10米才更新
    );

    _positionStreamSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) {
        _currentPosition = position;
        _positionController.add(position);
        
        print('📍 位置更新: ${position.latitude}, ${position.longitude}');
        print('   精度: ${position.accuracy}米');
      },
      onError: (error) {
        print('❌ 定位错误: $error');
      },
    );
  }

  // 停止定位
  void stopLocationUpdates() {
    _positionStreamSubscription?.cancel();
    _positionStreamSubscription = null;
  }

  // 计算两点之间的距离（米）
  double calculateDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    return Geolocator.distanceBetween(lat1, lon1, lat2, lon2);
  }

  // 检查是否在范围内
  bool isWithinRange(
    double userLat,
    double userLon,
    double targetLat,
    double targetLon,
    double radiusMeters,
  ) {
    final distance = calculateDistance(userLat, userLon, targetLat, targetLon);
    return distance <= radiusMeters;
  }

  void dispose() {
    stopLocationUpdates();
    _positionController.close();
  }
}

