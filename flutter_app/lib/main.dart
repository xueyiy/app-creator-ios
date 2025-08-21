import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Project - bcfe19f8-9950-4e32-97c1-6d779d695d3d',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: Color(0xFFBD9E9E)),
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
          'AI Project - bcfe19f8-9950-4e32-97c1-6d779d695d3d',
          style: TextStyle(
            fontSize: 20,
            color: Color(0xFFFFFFFF),
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Color(0xFFBD9E9E),
        foregroundColor: Color(0xFFFFFFFF),
        elevation: 1,
        centerTitle: false,
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
                          left: 80 * sx,
                          top: 370 * sy,
                          width: 100 * sx,
                          height: 40 * sy,
                          child:                           ElevatedButton(
                            onPressed: () {
                              // Add button action here
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Color(0xFF8A97AD),
                              foregroundColor: Color(0xFFFFFFFF),
                              side: BorderSide(
                                color: Colors.black,
                                width: 0,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            ),
                            child: Text(
                              'Button',
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
                          left: 100 * sx,
                          top: 150 * sy,
                          width: 150 * sx,
                          height: 50 * sy,
                          child:                           Text(
                            'Heading',
                            style: TextStyle(
                              fontSize: 24,
                              color: Color(0xFF1F2937),
                              fontWeight: FontWeight.bold,
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
                          left: 90 * sx,
                          top: 210 * sy,
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
