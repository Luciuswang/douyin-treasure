import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/map_screen.dart';
import 'providers/user_provider.dart';
import 'providers/treasure_provider.dart';

void main() {
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
        home: const MapScreen(),
      ),
    );
  }
}
