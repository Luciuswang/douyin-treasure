import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/verification_service.dart';

/// 拍照验证页面
class PhotoVerificationScreen extends StatefulWidget {
  final String taskId;
  final String taskTitle;
  final String instructions;

  const PhotoVerificationScreen({
    super.key,
    required this.taskId,
    required this.taskTitle,
    this.instructions = '请拍摄店铺门头或相关照片',
  });

  @override
  State<PhotoVerificationScreen> createState() => _PhotoVerificationScreenState();
}

class _PhotoVerificationScreenState extends State<PhotoVerificationScreen> {
  final VerificationService _verificationService = VerificationService();
  File? _selectedImage;
  bool _isUploading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('拍照验证 - ${widget.taskTitle}'),
      ),
      body: Column(
        children: [
          // 说明区域
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            color: Colors.blue.shade50,
            child: Column(
              children: [
                const Icon(
                  Icons.camera_alt,
                  size: 48,
                  color: Colors.blue,
                ),
                const SizedBox(height: 12),
                Text(
                  widget.instructions,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  '照片将包含位置和时间水印',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),

          // 照片预览区域
          Expanded(
            child: _selectedImage == null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.add_a_photo,
                          size: 80,
                          color: Colors.grey.shade300,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          '请选择拍照或从相册选择',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  )
                : Stack(
                    children: [
                      Center(
                        child: Image.file(
                          _selectedImage!,
                          fit: BoxFit.contain,
                        ),
                      ),
                      // 水印示例（实际应该叠加在图片上）
                      Positioned(
                        bottom: 16,
                        left: 16,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.location_on, color: Colors.white, size: 16),
                                  SizedBox(width: 4),
                                  Text(
                                    '当前位置',
                                    style: TextStyle(color: Colors.white, fontSize: 12),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(Icons.access_time, color: Colors.white, size: 16),
                                  const SizedBox(width: 4),
                                  Text(
                                    DateTime.now().toString().substring(0, 19),
                                    style: const TextStyle(color: Colors.white, fontSize: 12),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
          ),

          // 底部操作按钮
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.shade300,
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                // 拍照按钮
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isUploading ? null : () => _pickImage(ImageSource.camera),
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('拍照'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // 相册按钮
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isUploading ? null : () => _pickImage(ImageSource.gallery),
                    icon: const Icon(Icons.photo_library),
                    label: const Text('相册'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 提交按钮
          if (_selectedImage != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: ElevatedButton(
                onPressed: _isUploading ? null : _submitPhoto,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.blue,
                ),
                child: _isUploading
                    ? const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          ),
                          SizedBox(width: 12),
                          Text('上传中...', style: TextStyle(fontSize: 16)),
                        ],
                      )
                    : const Text('提交照片', style: TextStyle(fontSize: 16, color: Colors.white)),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final result = await _verificationService.verifyByPhoto(source: source);
      
      if (result.success) {
        setState(() {
          _selectedImage = File(result.data['imagePath']);
        });
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result.message)),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('选择图片失败：$e')),
        );
      }
    }
  }

  Future<void> _submitPhoto() async {
    if (_selectedImage == null) return;

    setState(() {
      _isUploading = true;
    });

    // 模拟上传
    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      _isUploading = false;
    });

    if (mounted) {
      // 返回成功结果
      Navigator.pop(context, {
        'success': true,
        'imagePath': _selectedImage!.path,
        'timestamp': DateTime.now().toIso8601String(),
      });
    }
  }
}

