import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Project - ai_project_1752518135389',
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
        title: Text('home'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        color: Color(0xFFF7F7F7),
        child: Stack(
          children: [
            Positioned(
              left: 10.0,
              top: 10.0,
              width: 100.0,
              height: 40.0,
              child:               Text(
                'Money',
                style: TextStyle(
                  fontSize: 18,
                  color: Color(0xFF000000),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Positioned(
              left: 220.0,
              top: 10.0,
              width: 40.0,
              height: 40.0,
              child:               Icon(
                Icons.person,
                size: 24,
                color: Color(0xFF6B7280),
              ),
            ),
            Positioned(
              left: 10.0,
              top: 60.0,
              width: 251.0,
              height: 129.0,
              child:               Container(
                decoration: BoxDecoration(
                  color: Color(0xFFFFFFFF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: null,
              ),
            ),
            Positioned(
              left: 10.0,
              top: 70.0,
              width: 120.0,
              height: 21.0,
              child:               Text(
                'Cash Balance',
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF000000),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Positioned(
              left: 10.0,
              top: 90.0,
              width: 92.0,
              height: 34.0,
              child:               Text(
                '0.00',
                style: TextStyle(
                  fontSize: 21,
                  color: Color(0xFF000000),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Positioned(
              left: 20.0,
              top: 150.0,
              width: 103.0,
              height: 26.0,
              child:               ElevatedButton(
                onPressed: () {
                  // Add button action here
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFFF7F7F7),
                  foregroundColor: Color(0xFF151414),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8.0),
                  ),
                ),
                child: Text(
                  'Add Cash',
                  style: TextStyle(fontSize: 14),
                ),
              ),
            ),
            Positioned(
              left: 140.0,
              top: 150.0,
              width: 101.0,
              height: 25.0,
              child:               ElevatedButton(
                onPressed: () {
                  // Add button action here
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFFF7F7F7),
                  foregroundColor: Color(0xFF1A1919),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8.0),
                  ),
                ),
                child: Text(
                  'Cash Out',
                  style: TextStyle(fontSize: 14),
                ),
              ),
            ),
            Positioned(
              left: 160.0,
              top: 70.0,
              width: 104.0,
              height: 27.0,
              child:               Text(
                'Account & Routing >',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF404245),
                  fontWeight: FontWeight.normal,
                ),
              ),
            ),
            Positioned(
              left: 10.0,
              top: 210.0,
              width: 111.0,
              height: 130.0,
              child:               Container(
                decoration: BoxDecoration(
                  color: Color(0xFFFFFFFF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: null,
              ),
            ),
            Positioned(
              left: 20.0,
              top: 230.0,
              width: 100.0,
              height: 20.0,
              child:               Text(
                'Savings',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF000000),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Positioned(
              left: 20.0,
              top: 250.0,
              width: 46.0,
              height: 47.0,
              child:               ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: Image.network(
                  'https://www.lendingstream.co.uk/blog/wp-content/uploads/2023/04/1p-Saving-Challenge.jpg',
                  fit: BoxFit.cover,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(22),
                      ),
                      child: Center(
                        child: CircularProgressIndicator(
                          value: loadingProgress.expectedTotalBytes != null
                              ? loadingProgress.cumulativeBytesLoaded / 
                                loadingProgress.expectedTotalBytes!
                              : null,
                        ),
                      ),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(22),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.broken_image,
                            size: 32,
                            color: Colors.grey[600],
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Image not available',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
            Positioned(
              left: 20.0,
              top: 420.0,
              width: 93.0,
              height: 68.0,
              child:               ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyZYOuvNX5ZJmWCrcUMnSrIghHK9Shg06-sg&s',
                  fit: BoxFit.cover,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: CircularProgressIndicator(
                          value: loadingProgress.expectedTotalBytes != null
                              ? loadingProgress.cumulativeBytesLoaded / 
                                loadingProgress.expectedTotalBytes!
                              : null,
                        ),
                      ),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.broken_image,
                            size: 32,
                            color: Colors.grey[600],
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Image not available',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
            Positioned(
              left: 20.0,
              top: 300.0,
              width: 56.0,
              height: 20.0,
              child:               Text(
                '0.00',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF000000),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Positioned(
              left: 20.0,
              top: 320.0,
              width: 70.0,
              height: 20.0,
              child:               Text(
                'Save for a goal',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF858585),
                  fontWeight: FontWeight.normal,
                ),
              ),
            ),
            Positioned(
              left: 140.0,
              top: 210.0,
              width: 110.0,
              height: 130.0,
              child:               Container(
                decoration: BoxDecoration(
                  color: Color(0xFFFFFFFF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: null,
              ),
            ),
            Positioned(
              left: 10.0,
              top: 370.0,
              width: 112.0,
              height: 126.0,
              child:               Container(
                decoration: BoxDecoration(
                  color: Color(0xFFFFFFFF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: null,
              ),
            ),
            Positioned(
              left: 140.0,
              top: 370.0,
              width: 111.0,
              height: 125.0,
              child:               Container(
                decoration: BoxDecoration(
                  color: Color(0xFFFFFFFF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: null,
              ),
            ),
            Positioned(
              left: 20.0,
              top: 380.0,
              width: 99.0,
              height: 20.0,
              child:               Text(
                'Invest in stocks',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF000000),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Positioned(
              left: 150.0,
              top: 270.0,
              width: 90.0,
              height: 72.0,
              child:               ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  'https://i0.wp.com/blog.kraken.com/wp-content/uploads/2023/09/Blog-BTC.png?fit=1536%2C700&ssl=1',
                  fit: BoxFit.cover,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: CircularProgressIndicator(
                          value: loadingProgress.expectedTotalBytes != null
                              ? loadingProgress.cumulativeBytesLoaded / 
                                loadingProgress.expectedTotalBytes!
                              : null,
                        ),
                      ),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.broken_image,
                            size: 32,
                            color: Colors.grey[600],
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Image not available',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
            Positioned(
              left: 150.0,
              top: 230.0,
              width: 97.0,
              height: 20.0,
              child:               Text(
                'Buy bitcoin',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF000000),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Positioned(
              left: 150.0,
              top: 420.0,
              width: 91.0,
              height: 68.0,
              child:               ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  'https://news.clemson.edu/wp-content/uploads/2022/03/pexels-nataliya-vaitkevich-6863259-edit-1029x636.jpg',
                  fit: BoxFit.cover,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: CircularProgressIndicator(
                          value: loadingProgress.expectedTotalBytes != null
                              ? loadingProgress.cumulativeBytesLoaded / 
                                loadingProgress.expectedTotalBytes!
                              : null,
                        ),
                      ),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.broken_image,
                            size: 32,
                            color: Colors.grey[600],
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Image not available',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
            Positioned(
              left: 150.0,
              top: 380.0,
              width: 90.0,
              height: 20.0,
              child:               Text(
                'Free tax filling',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF000000),
                  fontWeight: FontWeight.bold,
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}
