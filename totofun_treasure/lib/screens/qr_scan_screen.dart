import 'package:flutter/material.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'dart:io';

/// 二维码扫描页面
class QRScanScreen extends StatefulWidget {
  final String taskId;
  final String taskTitle;

  const QRScanScreen({
    super.key,
    required this.taskId,
    required this.taskTitle,
  });

  @override
  State<QRScanScreen> createState() => _QRScanScreenState();
}

class _QRScanScreenState extends State<QRScanScreen> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;
  bool isScanned = false;
  bool flashOn = false;

  @override
  void reassemble() {
    super.reassemble();
    if (Platform.isAndroid) {
      controller?.pauseCamera();
    }
    controller?.resumeCamera();
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('扫描二维码 - ${widget.taskTitle}'),
        backgroundColor: Colors.black,
        actions: [
          IconButton(
            icon: Icon(flashOn ? Icons.flash_on : Icons.flash_off),
            onPressed: () async {
              await controller?.toggleFlash();
              setState(() {
                flashOn = !flashOn;
              });
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          // 扫描区域
          QRView(
            key: qrKey,
            onQRViewCreated: _onQRViewCreated,
            overlay: QrScannerOverlayShape(
              borderColor: Colors.blue,
              borderRadius: 16,
              borderLength: 30,
              borderWidth: 10,
              cutOutSize: MediaQuery.of(context).size.width * 0.7,
            ),
          ),
          
          // 提示文字
          Positioned(
            bottom: 100,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(16),
              ),
              margin: const EdgeInsets.symmetric(horizontal: 32),
              child: const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.qr_code_scanner, color: Colors.white, size: 40),
                  SizedBox(height: 8),
                  Text(
                    '请对准商家提供的任务二维码',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _onQRViewCreated(QRViewController controller) {
    this.controller = controller;
    controller.scannedDataStream.listen((scanData) {
      if (!isScanned) {
        setState(() {
          isScanned = true;
        });
        
        controller.pauseCamera();
        _handleQRData(scanData.code ?? '');
      }
    });
  }

  void _handleQRData(String qrData) {
    // 返回扫描结果
    Navigator.pop(context, qrData);
  }
}

