import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:geolocator/geolocator.dart';

/// 任务验证服务
class VerificationService {
  final ImagePicker _imagePicker = ImagePicker();

  /// GPS定位验证
  Future<VerificationResult> verifyByGPS({
    required Position userPosition,
    required double targetLat,
    required double targetLon,
    double maxDistance = 50.0, // 默认50米范围内
  }) async {
    try {
      final distance = Geolocator.distanceBetween(
        userPosition.latitude,
        userPosition.longitude,
        targetLat,
        targetLon,
      );

      if (distance <= maxDistance) {
        return VerificationResult(
          success: true,
          message: '位置验证成功！您在任务范围内。',
          data: {'distance': distance},
        );
      } else {
        return VerificationResult(
          success: false,
          message: '您距离任务地点还有${distance.toStringAsFixed(0)}米，请靠近后再试。',
          data: {'distance': distance, 'required': maxDistance},
        );
      }
    } catch (e) {
      return VerificationResult(
        success: false,
        message: '定位验证失败：$e',
      );
    }
  }

  /// 拍照验证
  Future<VerificationResult> verifyByPhoto({
    ImageSource source = ImageSource.camera,
    bool addWatermark = true,
  }) async {
    try {
      // 1. 拍照或选择图片
      final XFile? image = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );

      if (image == null) {
        return VerificationResult(
          success: false,
          message: '未选择图片',
        );
      }

      // 2. 压缩图片
      final compressedImage = await compressImage(image.path);

      if (compressedImage == null) {
        return VerificationResult(
          success: false,
          message: '图片处理失败',
        );
      }

      // 3. 添加水印（位置、时间）
      // TODO: 实际项目中需要添加GPS水印
      
      // 4. 上传到服务器（模拟）
      // TODO: 实际项目中需要上传图片到服务器
      await Future.delayed(const Duration(seconds: 1));

      return VerificationResult(
        success: true,
        message: '照片上传成功！等待审核。',
        data: {
          'imagePath': compressedImage,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      return VerificationResult(
        success: false,
        message: '拍照验证失败：$e',
      );
    }
  }

  /// 压缩图片
  Future<String?> compressImage(String imagePath) async {
    try {
      final targetPath = imagePath.replaceAll('.jpg', '_compressed.jpg');
      
      final result = await FlutterImageCompress.compressAndGetFile(
        imagePath,
        targetPath,
        quality: 85,
        minWidth: 1920,
        minHeight: 1080,
      );

      return result?.path;
    } catch (e) {
      print('图片压缩失败: $e');
      return imagePath; // 返回原图
    }
  }

  /// 二维码验证（需要扫描结果）
  VerificationResult verifyByQRCode({
    required String scannedData,
    required String expectedData,
  }) {
    try {
      // 解析二维码数据
      // 格式：totofun://task/{taskId}?timestamp={timestamp}&signature={signature}
      
      if (scannedData.isEmpty) {
        return VerificationResult(
          success: false,
          message: '二维码数据为空',
        );
      }

      // 简单验证：检查是否包含任务ID
      if (scannedData.contains(expectedData)) {
        return VerificationResult(
          success: true,
          message: '二维码验证成功！',
          data: {'qrData': scannedData},
        );
      } else {
        return VerificationResult(
          success: false,
          message: '二维码不匹配，请扫描正确的任务二维码',
        );
      }
    } catch (e) {
      return VerificationResult(
        success: false,
        message: '二维码验证失败：$e',
      );
    }
  }

  /// 组合验证：GPS + 拍照
  Future<VerificationResult> verifyByGPSAndPhoto({
    required Position userPosition,
    required double targetLat,
    required double targetLon,
    double maxDistance = 50.0,
  }) async {
    // 1. 先验证GPS
    final gpsResult = await verifyByGPS(
      userPosition: userPosition,
      targetLat: targetLat,
      targetLon: targetLon,
      maxDistance: maxDistance,
    );

    if (!gpsResult.success) {
      return gpsResult;
    }

    // 2. GPS验证通过后，要求拍照
    final photoResult = await verifyByPhoto();

    if (!photoResult.success) {
      return photoResult;
    }

    return VerificationResult(
      success: true,
      message: '验证完成！位置和照片都已确认。',
      data: {
        ...gpsResult.data,
        ...photoResult.data,
      },
    );
  }

  /// 生成商家二维码数据
  String generateQRCodeData({
    required String taskId,
    required String merchantId,
  }) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    // TODO: 实际项目中需要添加签名防止伪造
    return 'totofun://task/$taskId?merchant=$merchantId&timestamp=$timestamp';
  }
}

/// 验证结果
class VerificationResult {
  final bool success;
  final String message;
  final Map<String, dynamic> data;

  VerificationResult({
    required this.success,
    required this.message,
    this.data = const {},
  });
}

