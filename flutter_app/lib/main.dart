import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AIO Smartz Camera',
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
      appBar: AppBar(
        title: Text('Home'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        color: Color(0xFFFFFFFF),
        child: Stack(
          children: [
            Positioned(
              left: 60.0,
              top: 200.0,
              width: 100.0,
              height: 40.0,
              child:               ElevatedButton(
                onPressed: () {
                  // Add button action here
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF2196F3),
                  foregroundColor: Color(0xFFFFFFFF),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8.0),
                  ),
                ),
                child: Text(
                  'Explore',
                  style: TextStyle(fontSize: 14),
                ),
              ),
            ),
            Positioned(
              left: 10.0,
              top: 130.0,
              width: 174.0,
              height: 20.0,
              child:               Container(
                child: Text('Heading'),
              ),
            ),
            Positioned(
              left: 0.0,
              top: 0.0,
              width: 270.0,
              height: 64.0,
              child:               Container(
                child: Text('AppHeader'),
              ),
            )
          ],
        ),
      ),
    );
  }
}
