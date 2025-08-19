import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Project - 3cfae4e0-8e83-4d1f-8d19-6c45648afe4f',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: Color(0xFFB3A5C0)),
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
          'Travel App',
          style: TextStyle(
            fontSize: 24,
            color: Color(0xFFFFFFFF),
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Color(0xFFB3A5C0),
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
                          top: 130 * sy,
                          width: 270 * sx,
                          height: 35 * sy,
                          child:                           Text(
                            'Welcome to Your Travel App',
                            style: TextStyle(
                              fontSize: 18,
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
                          left: 30 * sx,
                          top: 320 * sy,
                          width: 200 * sx,
                          height: 45 * sy,
                          child:                           ElevatedButton(
                            onPressed: () {
                              // Add button action here
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Color(0xFF93A1B8),
                              foregroundColor: Color(0xFFFFFFFF),
                              side: BorderSide(
                                color: Color(0xFF3B82F6),
                                width: 0,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(6),
                              ),
                              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            ),
                            child: Text(
                              'Explore',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.normal,
                              ),
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
                          left: 80 * sx,
                          top: 450 * sy,
                          width: 100 * sx,
                          height: 40 * sy,
                          child:                           Text(
                            'Text',
                            textAlign: TextAlign.left,
                            style: TextStyle(
                              fontSize: 16,
                              color: Color(0xFF000000),
                              fontWeight: FontWeight.normal,
                              fontStyle: FontStyle.normal,
                            ),
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
