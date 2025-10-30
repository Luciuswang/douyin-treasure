import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';
import '../services/location_service.dart';

class PhotoVerificationScreen extends StatefulWidget {
  final String taskId;
  final String taskTitle;
  final String instructions;

  const PhotoVerificationScreen({
    super.key,
    required this.taskId,
    required this.taskTitle,
    this.instructions = '请拍摄任务要求的照片',
  });

  @override
  State<PhotoVerificationScreen> createState() => _PhotoVerificationScreenState();
}

class _PhotoVerificationScreenState extends State<PhotoVerificationScreen> {
  XFile? _imageFile;
  Position? _currentPosition;
  bool _isLoading = false;
  String _statusMessage = '';

  final LocationService _locationService = LocationService();
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _initializeLocation();
  }

  Future<void> _initializeLocation() async {
    setState(() {
      _statusMessage = '正在获取位置信息...';
    });
    final hasPermission = await _locationService.checkAndRequestPermission();
    if (hasPermission) {
      final position = await _locationService.getCurrentPosition();
      setState(() {
        _currentPosition = position;
        _statusMessage = position != null ? '位置获取成功' : '无法获取位置';
      });
    } else {
      setState(() {
        _statusMessage = '定位权限被拒绝';
      });
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    setState(() {
      _isLoading = true;
      _statusMessage = '正在选择图片...';
    });
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );
      if (pickedFile != null) {
        setState(() {
          _imageFile = pickedFile;
          _statusMessage = '图片已选择';
        });
      } else {
        setState(() {
          _statusMessage = '未选择图片';
        });
      }
    } catch (e) {
      setState(() {
        _statusMessage = '选择图片失败: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _uploadPhoto() async {
    if (_imageFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请先选择或拍摄照片')),
      );
      return;
    }
    if (_currentPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('无法获取当前位置，请重试')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _statusMessage = '正在上传照片...';
    });

    try {
      // 模拟上传
      await Future.delayed(const Duration(seconds: 2));
      
      // 验证成功，返回结果
      if (mounted) {
        Navigator.pop(context, {
          'success': true,
          'photoPath': _imageFile!.path,
          'latitude': _currentPosition!.latitude,
          'longitude': _currentPosition!.longitude,
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('上传失败: $e')),
        );
        setState(() {
          _statusMessage = '上传失败: $e';
        });
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('拍照验证 - ${widget.taskTitle}'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              elevation: 2,
              margin: const EdgeInsets.only(bottom: 16),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '任务要求',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.instructions,
                      style: const TextStyle(fontSize: 14),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '当前位置: ${_currentPosition != null ? "${_currentPosition!.latitude.toStringAsFixed(4)}, ${_currentPosition!.longitude.toStringAsFixed(4)}" : "获取中..."}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    Text(
                      '时间: ${DateFormat('yyyy-MM-dd HH:mm').format(DateTime.now())}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: _imageFile == null
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.camera_alt, size: 80, color: Colors.grey[300]),
                          const SizedBox(height: 16),
                          Text(
                            _statusMessage,
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                        ],
                      ),
                    )
                  : _buildImagePreview(),
            ),
            const SizedBox(height: 16),
            _buildButtons(),
          ],
        ),
      ),
    );
  }

  Widget _buildImagePreview() {
    if (kIsWeb) {
      // Web版本使用Network/Memory Image
      return FutureBuilder<String>(
        future: _imageFile!.readAsBytes().then((bytes) => 
          'data:image/jpeg;base64,${bytes.toString()}'),
        builder: (context, snapshot) {
          if (snapshot.hasData) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.image, size: 120, color: Colors.blue),
                  const SizedBox(height: 16),
                  Text(
                    '图片已选择: ${_imageFile!.name}',
                    style: const TextStyle(fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '注意：Web版本无法预览图片\n请在手机上测试完整功能',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
            );
          }
          return const Center(child: CircularProgressIndicator());
        },
      );
    } else {
      // 移动端使用File Image
      return Image.file(
        File(_imageFile!.path),
        fit: BoxFit.contain,
      );
    }
  }

  Widget _buildButtons() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Column(
      children: [
        ElevatedButton.icon(
          onPressed: () => _pickImage(ImageSource.camera),
          icon: const Icon(Icons.camera),
          label: Text(kIsWeb ? '选择图片（Web不支持相机）' : '拍摄照片'),
          style: ElevatedButton.styleFrom(
            minimumSize: const Size(double.infinity, 50),
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () => _pickImage(ImageSource.gallery),
          icon: const Icon(Icons.photo_library),
          label: const Text('从相册选择'),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(double.infinity, 50),
          ),
        ),
        if (_imageFile != null) ...[
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _uploadPhoto,
            icon: const Icon(Icons.cloud_upload),
            label: const Text('上传并验证'),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size(double.infinity, 50),
              backgroundColor: Theme.of(context).colorScheme.primary,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ],
    );
  }
}
