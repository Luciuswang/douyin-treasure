import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'screens/home_screen.dart';
import 'screens/merchant/merchant_dashboard_screen.dart';
import 'screens/merchant/create_task_screen.dart';
import 'providers/user_provider.dart';
import 'providers/treasure_provider.dart';
import 'providers/task_provider.dart';
import 'providers/merchant_provider.dart';
import 'providers/chat_provider.dart';
import 'config/firebase_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 初始化 Firebase
  try {
    await Firebase.initializeApp(
      options: FirebaseConfig.current,
    );
  } catch (e) {
    print('Firebase 初始化失败: $e');
    print('聊天功能将不可用，但其他功能正常');
  }
  
  runApp(const TotofunApp());
}

class TotofunApp extends StatelessWidget {
  const TotofunApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => UserProvider()),
        ChangeNotifierProvider(create: (_) => TreasureProvider()),
        ChangeNotifierProvider(create: (_) => TaskProvider()),
        ChangeNotifierProvider(create: (_) => MerchantProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
      ],
      child: MaterialApp(
        title: 'Totofun 突突翻',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.blue,
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF4FC3F7),
            brightness: Brightness.light,
          ),
        ),
        home: const HomeScreen(),
        routes: {
          '/merchant/dashboard': (context) => const MerchantDashboardScreen(),
          '/merchant/create-task': (context) => const CreateTaskScreen(),
        },
      ),
    );
  }
}
