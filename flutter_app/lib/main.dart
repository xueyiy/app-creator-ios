import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Project - 7d680896-a812-4c15-8165-02278db32ffe',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: Color(0xFF3B82F6)),
        // Heuristic: if screen background equals header color, prefer white to avoid full-screen header look
        scaffoldBackgroundColor: (("${backgroundColor}" == "${appHeaderBgColor}") ? Colors.white : Color(0xFFFFFFFF)),
      ),
      home: HomeScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 64,
        title: Text(
          'Travel Explorer',
          style: TextStyle(
            fontSize: 24,
            color: Color(0xFFFFFFFF),
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Color(0xFF3B82F6),
        foregroundColor: Color(0xFFFFFFFF),
        elevation: 1,
        centerTitle: false,
        actions: [
          IconButton(
            icon: Icon(Icons.menu),
            onPressed: () {},
          ),
        ],
      ),
      backgroundColor: Color(0xFFFFFFFF),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            // Force full-viewport canvas so coordinates map 1:1 to device size
            return Stack(
              fit: StackFit.expand,
              clipBehavior: Clip.none,
              children: [
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final double sx = constraints.maxWidth / 360.0;
                        final double sy = constraints.maxHeight / 720.0;
                        return Positioned(
                          left: 0 * sx,
                          top: 90 * sy,
                          width: 270 * sx,
                          height: 35 * sy,
                          child:                           Text(
                            'Explore Your Next Destination',
                            style: TextStyle(
                              fontSize: 32,
                              color: Color(0xFF1F2937),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      },
                    ),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final double sx = constraints.maxWidth / 360.0;
                        final double sy = constraints.maxHeight / 720.0;
                        return Positioned(
                          left: 0 * sx,
                          top: 145 * sy,
                          width: 270 * sx,
                          height: 45 * sy,
                          child:                           Container(
                            child: Text('Input'),
                          ),
                        );
                      },
                    ),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final double sx = constraints.maxWidth / 360.0;
                        final double sy = constraints.maxHeight / 720.0;
                        return Positioned(
                          left: 0 * sx,
                          top: 210 * sy,
                          width: 270 * sx,
                          height: 180 * sy,
                          child:                           Container(
                            child: Text('ImageCarousel'),
                          ),
                        );
                      },
                    ),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final double sx = constraints.maxWidth / 360.0;
                        final double sy = constraints.maxHeight / 720.0;
                        return Positioned(
                          left: 0 * sx,
                          top: 620 * sy,
                          width: 270 * sx,
                          height: 50 * sy,
                          child:                           Container(
                            child: Text('TabBar'),
                          ),
                        );
                      },
                    )
              ],
            );
          },
        ),
      ),
    );
  }
}
