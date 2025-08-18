import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Project - 8bccf8ec-af37-4fb4-bc4d-5a6261bae1dd',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
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
      
      body: SafeArea(
        child: SizedBox.expand(
          child: Container(
            color: Color(0xFFFFFFFF),
            child: LayoutBuilder(
              builder: (context, constraints) {
            return Stack(
              fit: StackFit.expand,
              children: [
                    Positioned(
                      left: 60.0,
                      top: 140.0,
                      width: 150.0,
                      height: 50.0,
                      child:                       Text(
                        'Heading',
                        style: TextStyle(
                          fontSize: 24,
                          color: Color(0xFF1F2937),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      height: 64,
                      decoration: BoxDecoration(color: Color(0xFF3B82F6)),
                      child: SafeArea(
                        bottom: false,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0),
                          child: Row(
                            children: [

                              Expanded(
                                child: Text(
                                  'App',
                                  textAlign: TextAlign.center,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    color: Color(0xFFFFFFFF),
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),

                            ],
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      left: 90.0,
                      top: 300.0,
                      width: 100.0,
                      height: 40.0,
                      child:                       ElevatedButton(
                        onPressed: () {
                          // Add button action here
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Color(0xFF3B82F6),
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
                    )
              ],
            );
              },
            ),
          ),
        ),
      ),
    );
  }
}
