const jwt = require('jsonwebtoken');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const os = require('os');

class TestFlightService {
  constructor() {
    console.log('🚀 Initializing TestFlightService...');
    console.log('🔍 Loading App Store Connect credentials...');
    console.log(`   🖥️  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   📱 Platform: ${process.platform}`);
    console.log(`   🔧 Node Version: ${process.version}`);
    console.log(`   📁 Working Directory: ${process.cwd()}`);
    
    this.issuerId = process.env.APP_STORE_CONNECT_ISSUER_ID;
    this.keyId = process.env.APP_STORE_CONNECT_KEY_ID;
    
    console.log(`🏢 Issuer ID from env: ${this.issuerId ? '✅ Set' : '❌ Not set'}`);
    console.log(`🔑 Key ID from env: ${this.keyId ? '✅ Set' : '❌ Not set'}`);
    
    // Try to load private key from environment variable first
    this.privateKey = process.env.APP_STORE_CONNECT_PRIVATE_KEY;
    console.log(`🔐 Private key from env: ${this.privateKey ? '✅ Present' : '❌ Not present'}`);
    
    // If environment variable is not available or invalid, try to read from file
    if (!this.privateKey && this.keyId) {
      console.log('📁 Environment variable not available, trying to load from file...');
      const possiblePaths = [
        // Standard pattern: AuthKey_{keyId}.p8
        path.join(__dirname, 'keys', `AuthKey_${this.keyId}.p8`),
        // Alternative pattern: Find any AuthKey_*.p8 file
        ...this.findAuthKeyFiles(path.join(__dirname, 'keys')),
        // Home directory fallback
        path.join(process.env.HOME || os.homedir(), 'private_keys', `AuthKey_${this.keyId}.p8`),
      ];

      console.log('🔍 Checking possible key file paths:');
      for (const keyPath of possiblePaths) {
        console.log(`   📁 ${keyPath}: ${fs.existsSync(keyPath) ? '✅ Exists' : '❌ Not found'}`);
      }

      for (const keyPath of possiblePaths) {
        if (keyPath && fs.existsSync(keyPath)) {
          try {
            console.log(`📖 Reading private key from: ${keyPath}`);
            this.privateKey = fs.readFileSync(keyPath, 'utf8');
            console.log('✅ Private key loaded successfully from file');
            console.log(`   📏 Key length: ${this.privateKey.length} characters`);
            console.log(`   📄 Key format: ${this.privateKey.includes('BEGIN PRIVATE KEY') ? '✅ PEM format' : '❌ Invalid format'}`);
            break;
          } catch (error) {
            console.warn('⚠️ Could not read private key from file:', keyPath, error.message);
          }
        }
      }
    }
    
    // Log the loading status for debugging
    if (this.privateKey) {
      console.log('✅ Private key loaded successfully');
      console.log(`🔑 Key ID: ${this.keyId}`);
      console.log(`🏢 Issuer ID: ${this.issuerId ? this.issuerId.substring(0, 8) + '...' : 'NOT SET'}`);
      console.log(`📦 Bundle ID: ${this.bundleId || 'NOT SET'}`);
      console.log(`📱 App ID: ${this.appId || 'NOT SET'}`);
    } else {
      console.log('❌ Private key not found. Checked paths:');
      console.log(`   - Environment variable: APP_STORE_CONNECT_PRIVATE_KEY`);
      if (this.keyId) {
        console.log(`   - File: backend/keys/AuthKey_${this.keyId}.p8`);
        console.log(`   - Home: ~/private_keys/AuthKey_${this.keyId}.p8`);
      } else {
        console.log('   - APP_STORE_CONNECT_KEY_ID not set');
      }
    }
    
    this.bundleId = process.env.BUNDLE_ID || 'com.visios.nocode';
    this.appId = process.env.APP_STORE_CONNECT_APP_ID;
    
    this.baseURL = 'https://api.appstoreconnect.apple.com/v1';
    
    console.log('🏁 TestFlightService initialization complete');
    console.log('='.repeat(60));
  }

  // Helper method to find any AuthKey_*.p8 files in a directory
  findAuthKeyFiles(directory) {
    try {
      if (!fs.existsSync(directory)) return [];
      
      const files = fs.readdirSync(directory);
      return files
        .filter(file => file.startsWith('AuthKey_') && file.endsWith('.p8'))
        .map(file => path.join(directory, file));
    } catch (error) {
      console.warn('⚠️ Could not scan directory for AuthKey files:', directory, error.message);
      return [];
    }
  }

  // Generate JWT token for App Store Connect API
  generateJWT() {
    console.log('🔑 Starting JWT generation...');
    
    if (!this.privateKey || !this.keyId || !this.issuerId) {
      console.log('❌ JWT generation failed - missing credentials:');
      console.log(`   Private Key: ${this.privateKey ? '✅ Present' : '❌ Missing'}`);
      console.log(`   Key ID: ${this.keyId ? '✅ Present' : '❌ Missing'}`);
      console.log(`   Issuer ID: ${this.issuerId ? '✅ Present' : '❌ Missing'}`);
      throw new Error('Missing App Store Connect credentials');
    }

    console.log('✅ All credentials present for JWT generation');

    // Validate private key format
    console.log('🔍 Validating private key format...');
    if (!this.privateKey.includes('BEGIN PRIVATE KEY')) {
      console.log('❌ Invalid private key format detected');
      console.log(`   Key starts with: ${this.privateKey.substring(0, 50)}...`);
      throw new Error('Invalid private key format - must be a PEM formatted private key');
    }
    console.log('✅ Private key format validation passed');

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.issuerId,
      iat: now,
      exp: now + (20 * 60), // 20 minutes
      aud: 'appstoreconnect-v1'
    };

    const header = {
      alg: 'ES256',
      kid: this.keyId,
      typ: 'JWT'
    };

    console.log('📋 JWT Payload created:');
    console.log(`   🏢 Issuer (iss): ${payload.iss}`);
    console.log(`   ⏰ Issued At (iat): ${payload.iat} (${new Date(payload.iat * 1000).toISOString()})`);
    console.log(`   ⏰ Expires At (exp): ${payload.exp} (${new Date(payload.exp * 1000).toISOString()})`);
    console.log(`   🎯 Audience (aud): ${payload.aud}`);
    
    console.log('📋 JWT Header created:');
    console.log(`   🔐 Algorithm (alg): ${header.alg}`);
    console.log(`   🔑 Key ID (kid): ${header.kid}`);
    console.log(`   📝 Type (typ): ${header.typ}`);

    try {
      console.log('🔐 Signing JWT with ES256 algorithm...');
      const token = jwt.sign(payload, this.privateKey, { 
        algorithm: 'ES256',
        header 
      });
      console.log('✅ JWT signed successfully!');
      console.log(`   Token length: ${token.length} characters`);
      console.log(`   Token preview: ${token.substring(0, 50)}...`);
      return token;
    } catch (error) {
      console.error('❌ JWT signing failed:', error.message);
      console.error('🔑 Private key preview:', this.privateKey.substring(0, 50) + '...');
      console.error('🔍 Private key details:');
      console.error(`   Length: ${this.privateKey.length} characters`);
      console.error(`   Contains BEGIN: ${this.privateKey.includes('BEGIN PRIVATE KEY')}`);
      console.error(`   Contains END: ${this.privateKey.includes('END PRIVATE KEY')}`);
      console.error(`   Line count: ${this.privateKey.split('\n').length}`);
      throw new Error(`JWT signing failed: ${error.message}`);
    }
  }

  // Get app information from App Store Connect
  async getAppInfo() {
    try {
      console.log('📱 Getting app information from App Store Connect...');
      console.log(`   🔍 Searching for bundle ID: ${this.bundleId}`);
      
      const token = this.generateJWT();
      console.log('✅ JWT token generated for app info request');
      
      console.log(`🌐 Making API request to: ${this.baseURL}/apps`);
      const response = await axios.get(`${this.baseURL}/apps`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          'filter[bundleId]': this.bundleId
        }
      });

      console.log(`✅ API response received: ${response.status} ${response.statusText}`);
      const apps = response.data.data;
      console.log(`📊 Found ${apps.length} app(s) with bundle ID: ${this.bundleId}`);
      
      if (apps.length === 0) {
        console.log('❌ No app found with the specified bundle ID');
        throw new Error(`No app found with bundle ID: ${this.bundleId}`);
      }

      const app = apps[0];
      console.log(`✅ App found: ${app.attributes.name} (${app.id})`);
      console.log(`   📱 Name: ${app.attributes.name}`);
      console.log(`   🆔 App ID: ${app.id}`);
      console.log(`   📦 Bundle ID: ${app.attributes.bundleId}`);
      console.log(`   🏢 SKU: ${app.attributes.sku}`);
      
      return app;
    } catch (error) {
      console.error('❌ Error getting app info:');
      console.error(`   Message: ${error.message}`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Status Text: ${error.response.statusText}`);
        console.error(`   Response Data:`, JSON.stringify(error.response.data, null, 2));
      }
      if (error.request) {
        console.error(`   Request Error: ${error.request}`);
      }
      throw error;
    }
  }

  // Package Flutter app with screen data
  async packageFlutterApp(projectData) {
    try {
      console.log('='.repeat(80));
      console.log('📦 FLUTTER APP PACKAGING STARTED');
      console.log('='.repeat(80));
      console.log('📱 Packaging Flutter app with project data:');
      console.log(`   🕐 Timestamp: ${new Date().toISOString()}`);
      console.log(`   📁 Current Directory: ${process.cwd()}`);
      console.log(`   🔧 Node Version: ${process.version}`);
      console.log(`   💾 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
      
      const { templateId, projectId, template, deploymentInfo } = projectData;
      
      console.log('📋 Project Data Summary:');
      console.log('  - Template ID:', templateId);
      console.log('  - Project ID:', projectId);
      console.log('  - Template name:', template?.name);
      console.log('  - Screens count:', template?.screens?.length || 0);
      console.log('  - App name:', deploymentInfo?.appName);
      console.log('  - Bundle ID:', deploymentInfo?.bundleId);
      console.log('  - Version:', deploymentInfo?.version);
      console.log('  - Build Number:', deploymentInfo?.buildNumber);
      
      // Debug: Log complete project data structure
      console.log('🔍 Complete projectData structure:');
      console.log(JSON.stringify({
        templateId,
        projectId,
        template: template ? {
          ...template,
          screens: template.screens?.map(screen => ({
            id: screen.id,
            name: screen.name,
            componentPath: screen.componentPath,
            hasContent: !!screen.content,
            hasComponents: !!screen.components,
            contentKeys: screen.content ? Object.keys(screen.content) : [],
            directComponentsCount: screen.components?.length || 0
          }))
        } : null,
        deploymentInfo
      }, null, 2));
      
      // Debug: Log template structure
      if (template) {
        console.log('🔍 Template structure:');
        console.log('  - Keys:', Object.keys(template));
        if (template.screens) {
          console.log('  - First screen keys:', Object.keys(template.screens[0] || {}));
          if (template.screens[0]) {
            console.log('  - First screen name:', template.screens[0].name);
            console.log('  - First screen componentPath:', template.screens[0].componentPath);
            if (template.screens[0].content) {
              console.log('  - First screen content keys:', Object.keys(template.screens[0].content));
            }
            // Also log the complete first screen object for debugging
            console.log('🔍 Complete first screen object:');
            console.log(JSON.stringify(template.screens[0], null, 2));
          }
        }
      }
      
      // Debug: Log screen data structure  
      if (template?.screens && template.screens.length > 0) {
        console.log('🔍 Screen data preview:');
        template.screens.forEach((screen, index) => {
          console.log(`  Screen ${index + 1}: ${screen.name || 'unnamed'}`);
          console.log(`    - Has content:`, !!screen.content);
          console.log(`    - Has droppedComponents:`, !!screen.content?.droppedComponents);
          console.log(`    - Components count:`, screen.content?.droppedComponents?.length || 0);
          if (screen.content?.droppedComponents && screen.content.droppedComponents.length > 0) {
            console.log(`    - Component types:`, screen.content.droppedComponents.map(c => c.type).join(', '));
          }
          
          // Also check for direct components array (JSON structure)
          if (screen.components && Array.isArray(screen.components)) {
            console.log(`    - Direct components count:`, screen.components.length);
            console.log(`    - Direct component types:`, screen.components.map(c => c.type).join(', '));
          }
        });
      } else {
        console.log('⚠️  No screens found in template data');
      }
      
      // Convert screen data to proper format for Flutter generation
      const processedScreens = [];
      if (template?.screens && template.screens.length > 0) {
        for (const screen of template.screens) {
          let components = [];
          
          // Check multiple possible component sources
          if (screen.content?.droppedComponents) {
            components = screen.content.droppedComponents;
            console.log(`📱 Using droppedComponents for screen ${screen.name}: ${components.length} components`);
          } else if (screen.components) {
            components = screen.components;
            console.log(`📱 Using direct components for screen ${screen.name}: ${components.length} components`);
          } else {
            console.log(`⚠️  No components found for screen ${screen.name}`);
          }
          
          processedScreens.push({
            screenName: screen.name || screen.screenName || 'home',
            originalName: screen.originalName || screen.name || 'Home',
            components: components,
            screenProperties: screen.screenProperties || screen.content?.screenProperties || {},
            metadata: screen.metadata || {}
          });
        }
      }
      
      console.log(`📋 Processed ${processedScreens.length} screens for Flutter generation`);
      processedScreens.forEach((screen, index) => {
        console.log(`  Processed Screen ${index + 1}: ${screen.screenName} (${screen.components.length} components)`);
      });
      
      console.log('🔢 Version Configuration:');
      console.log(`  - Input version: ${deploymentInfo?.version}`);
      console.log(`  - Input buildNumber: ${deploymentInfo?.buildNumber}`);
      console.log(`  - Fallback version: 1.0.1`);
      console.log(`  - Fallback buildNumber: ${Math.floor(Date.now() / 1000).toString()} (timestamp)`);
      
      // Create temporary directory for build
      const buildDir = path.join(__dirname, 'temp', `build_${Date.now()}`);
      fs.mkdirSync(buildDir, { recursive: true });

      // Create app configuration file
      const appConfig = {
        appName: deploymentInfo.appName,
        bundleId: this.bundleId,
        screens: processedScreens, // Use processed screens instead of raw template.screens
        projectId,
        templateId,
        buildTime: new Date().toISOString(),
        appIcon: deploymentInfo.appIcon || null, // Support for custom app icon
        version: deploymentInfo.version || '1.0.1',
        buildNumber: deploymentInfo.buildNumber || Math.floor(Date.now() / 1000).toString()
      };

      console.log('📦 Final App Configuration:');
      console.log(`  - Final version: ${appConfig.version}`);
      console.log(`  - Final buildNumber: ${appConfig.buildNumber}`);
      console.log(`  - pubspec.yaml will use: ${appConfig.version}+${appConfig.buildNumber}`);

      // Write configuration to Flutter assets
      const configPath = path.join(buildDir, 'app_config.json');
      fs.writeFileSync(configPath, JSON.stringify(appConfig, null, 2));

      // Create a complete Flutter project structure with all iOS files
      const flutterStructure = {
        // Flutter core files
        'pubspec.yaml': this.generatePubspecYaml(deploymentInfo.appName, appConfig.version, appConfig.buildNumber),
        'lib/main.dart': this.generateMainDart(appConfig),
        'lib/screens_data.dart': this.generateScreensDataDart(appConfig),
        'assets/app_config.json': JSON.stringify(appConfig, null, 2),
        
        // iOS project files - Info.plist
        'ios/Runner/Info.plist': this.generateInfoPlist(deploymentInfo.appName, this.bundleId),
        
        // iOS project files - Xcode workspace
        'ios/Runner.xcworkspace/contents.xcworkspacedata': this.generateXcworkspaceData(),
        'ios/Runner.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist': this.generateWorkspaceChecks(),
        
        // iOS project files - Main Xcode project (improved)
        'ios/Runner.xcodeproj/project.pbxproj': this.generateProjectPbxprojFixed(deploymentInfo.appName, this.bundleId),
        'ios/Runner.xcodeproj/xcshareddata/xcschemes/Runner.xcscheme': this.generateXcscheme(),
        
        // iOS AppDelegate files
        'ios/Runner/AppDelegate.swift': this.generateAppDelegate(),
        'ios/Runner/Runner-Bridging-Header.h': this.generateBridgingHeader(),
        
        // iOS assets and configuration (improved with app icon support)
        'ios/Runner/Assets.xcassets/AppIcon.appiconset/Contents.json': this.generateAppIconContentsFixed(),
        'ios/Runner/Assets.xcassets/LaunchImage.imageset/Contents.json': this.generateLaunchImageContents(),
        'ios/Runner/Base.lproj/LaunchScreen.storyboard': this.generateLaunchScreen(),
        'ios/Runner/Base.lproj/Main.storyboard': this.generateMainStoryboard(),
        
        // Flutter iOS configuration (fixed paths)
        'ios/Flutter/AppFrameworkInfo.plist': this.generateAppFrameworkInfo(),
        'ios/Flutter/Debug.xcconfig': this.generateDebugXcconfig(),
        'ios/Flutter/Release.xcconfig': this.generateReleaseXcconfig(),
        'ios/Flutter/Generated.xcconfig': this.generateGeneratedXcconfig(),
        
        // Podfile for dependencies
        'ios/Podfile': this.generatePodfile(),
        'ios/Podfile.lock': this.generatePodfileLock(),
        
        // Flutter build configuration
        '.flutter-plugins': this.generateFlutterPlugins(),
        '.flutter-plugins-dependencies': this.generateFlutterPluginsDependencies(),
        
        // Android files (for completeness)
        'android/app/build.gradle': this.generateAndroidBuildGradle(deploymentInfo.appName, this.bundleId),
        'android/app/src/main/AndroidManifest.xml': this.generateAndroidManifest(deploymentInfo.appName, this.bundleId),
        'android/app/src/main/kotlin/MainActivity.kt': this.generateMainActivity(),
        'android/build.gradle': this.generateRootBuildGradle(),
        'android/gradle.properties': this.generateGradleProperties(),
        'android/settings.gradle': this.generateSettingsGradle(),
        
        // Setup script for proper environment
        'setup_flutter_env.sh': this.generateFlutterSetupScript()
      };

      // Write Flutter files
      for (const [filePath, content] of Object.entries(flutterStructure)) {
        const fullPath = path.join(buildDir, filePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content);
      }

      // Create IPA package (simplified - in real implementation, you'd use flutter build ios)
      const ipaPath = await this.createIPA(buildDir, deploymentInfo.appName, appConfig);
      
      return {
        buildDir,
        ipaPath,
        appConfig
      };
    } catch (error) {
      console.error('Error packaging Flutter app:', error);
      throw error;
    }
  }

  // Package Flutter app source code only (for GitHub Actions)
  async packageFlutterAppSourceOnly(projectData) {
    try {
      console.log('🚨🚨🚨 DEBUG: packageFlutterAppSourceOnly called! 🚨🚨🚨');
      console.log('='.repeat(80));
      console.log('📦 FLUTTER SOURCE PACKAGING STARTED (GitHub Actions)');
      console.log('='.repeat(80));
      console.log('📱 Packaging Flutter source code with project data:');
      console.log(`   🕐 Timestamp: ${new Date().toISOString()}`);
      console.log(`   📁 Current Directory: ${process.cwd()}`);
      console.log(`   🔧 Node Version: ${process.version}`);
      console.log(`   💾 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
      
      const { templateId, projectId, template, deploymentInfo, pageId, firebaseToken, fetchFromBackend, firebaseBaseUrl } = projectData;
      
      console.log('📋 Project Data Summary:');
      console.log('  - Template ID:', templateId);
      console.log('  - Project ID:', projectId);
      console.log('  - Template name:', template?.name);
      console.log('  - Screens count:', template?.screens?.length || 0);
      console.log('  - App name:', deploymentInfo?.appName);
      console.log('  - Bundle ID:', deploymentInfo?.bundleId);
      console.log('  - Version:', deploymentInfo?.version);
      console.log('  - Build Number:', deploymentInfo?.buildNumber);
      
      // Convert screen data to proper format for Flutter generation (from request body)
      let processedScreens = [];
      if (template?.screens && template.screens.length > 0) {
        for (const screen of template.screens) {
          let components = [];
          if (screen.content?.droppedComponents) {
            components = screen.content.droppedComponents;
            console.log(`📱 Using droppedComponents for screen ${screen.name}: ${components.length} components`);
          } else if (screen.components) {
            components = screen.components;
            console.log(`📱 Using direct components for screen ${screen.name}: ${components.length} components`);
          }
          processedScreens.push({
            screenName: screen.name || screen.screenName || 'home',
            originalName: screen.originalName || screen.name || 'Home',
            components,
            screenProperties: screen.screenProperties || screen.content?.screenProperties || {},
            metadata: screen.metadata || {}
          });
        }
      }

      // Optionally fetch latest JSON from backend by project/page id
      if (fetchFromBackend || processedScreens.length === 0) {
        const fetched = await this.tryFetchScreensFromBackend({ projectId, pageId, firebaseToken, firebaseBaseUrl });
        if (fetched && fetched.length > 0) {
          console.log(`🌐 Using screens fetched from backend: ${fetched.length}`);
          processedScreens = fetched;
        } else {
          console.log('⚠️  Backend fetch returned no screens; using request body data if any.');
        }
      }
      
      console.log(`📋 Processed ${processedScreens.length} screens for Flutter generation`);
      processedScreens.forEach((screen, index) => {
        console.log(`  Processed Screen ${index + 1}: ${screen.screenName} (${screen.components.length} components)`);
      });
      
      console.log('🔢 Version Configuration:');
      console.log(`  - Input version: ${deploymentInfo?.version}`);
      console.log(`  - Input buildNumber: ${deploymentInfo?.buildNumber}`);
      console.log(`  - Fallback version: 1.0.1`);
      console.log(`  - Fallback buildNumber: ${Math.floor(Date.now() / 1000).toString()} (timestamp)`);
      
      // Create temporary directory for build
      const buildDir = path.join(__dirname, 'temp', `source_${Date.now()}`);
      fs.mkdirSync(buildDir, { recursive: true });

      // Create app configuration file
      const appConfig = {
        appName: deploymentInfo.appName,
        bundleId: this.bundleId,
        screens: processedScreens,
        projectId,
        templateId,
        buildTime: new Date().toISOString(),
        appIcon: deploymentInfo.appIcon || null,
        version: deploymentInfo.version || '1.0.1',
        buildNumber: deploymentInfo.buildNumber || Math.floor(Date.now() / 1000).toString()
      };

      // Write configuration to Flutter assets
      const configPath = path.join(buildDir, 'app_config.json');
      fs.writeFileSync(configPath, JSON.stringify(appConfig, null, 2));

      // Create a complete Flutter project structure with all iOS files
      const flutterStructure = {
        // Flutter core files
        'pubspec.yaml': this.generatePubspecYaml(deploymentInfo.appName, appConfig.version, appConfig.buildNumber),
        'lib/main.dart': this.generateMainDart(appConfig),
        'lib/screens_data.dart': this.generateScreensDataDart(appConfig),
        'assets/app_config.json': JSON.stringify(appConfig, null, 2),
        
        // iOS project files - Info.plist
        'ios/Runner/Info.plist': this.generateInfoPlist(deploymentInfo.appName, this.bundleId),
        
        // iOS project files - Xcode workspace
        'ios/Runner.xcworkspace/contents.xcworkspacedata': this.generateXcworkspaceData(),
        'ios/Runner.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist': this.generateWorkspaceChecks(),
        
        // iOS project files - Main Xcode project (improved)
        'ios/Runner.xcodeproj/project.pbxproj': this.generateProjectPbxprojFixed(deploymentInfo.appName, this.bundleId),
        'ios/Runner.xcodeproj/xcshareddata/xcschemes/Runner.xcscheme': this.generateXcscheme(),
        
        // iOS AppDelegate files
        'ios/Runner/AppDelegate.swift': this.generateAppDelegate(),
        'ios/Runner/Runner-Bridging-Header.h': this.generateBridgingHeader(),
        
        // iOS assets and configuration (improved with app icon support)
        'ios/Runner/Assets.xcassets/AppIcon.appiconset/Contents.json': this.generateAppIconContentsFixed(),
        'ios/Runner/Assets.xcassets/LaunchImage.imageset/Contents.json': this.generateLaunchImageContents(),
        'ios/Runner/Base.lproj/LaunchScreen.storyboard': this.generateLaunchScreen(),
        'ios/Runner/Base.lproj/Main.storyboard': this.generateMainStoryboard(),
        
        // Flutter iOS configuration (fixed paths)
        'ios/Flutter/AppFrameworkInfo.plist': this.generateAppFrameworkInfo(),
        'ios/Flutter/Debug.xcconfig': this.generateDebugXcconfig(),
        'ios/Flutter/Release.xcconfig': this.generateReleaseXcconfig(),
        'ios/Flutter/Generated.xcconfig': this.generateGeneratedXcconfig(),
        
        // Podfile for dependencies
        'ios/Podfile': this.generatePodfile(),
        'ios/Podfile.lock': this.generatePodfileLock(),
        
        // Flutter build configuration
        '.flutter-plugins': this.generateFlutterPlugins(),
        '.flutter-plugins-dependencies': this.generateFlutterPluginsDependencies(),
        
        // Android files (for completeness)
        'android/app/build.gradle': this.generateAndroidBuildGradle(deploymentInfo.appName, this.bundleId),
        'android/app/src/main/AndroidManifest.xml': this.generateAndroidManifest(deploymentInfo.appName, this.bundleId),
        'android/app/src/main/kotlin/MainActivity.kt': this.generateMainActivity(),
        'android/build.gradle': this.generateRootBuildGradle(),
        'android/gradle.properties': this.generateGradleProperties(),
        'android/settings.gradle': this.generateSettingsGradle(),
        
        // Setup script for proper environment
        'setup_flutter_env.sh': this.generateFlutterSetupScript()
      };

      // Write Flutter files
      for (const [filePath, content] of Object.entries(flutterStructure)) {
        const fullPath = path.join(buildDir, filePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content);
      }

      console.log('✅ Flutter source code generated successfully');
      console.log(`📁 Source directory: ${buildDir}`);
      console.log(`📊 Files generated: ${Object.keys(flutterStructure).length}`);
      
      return {
        buildDir,
        appConfig
      };
    } catch (error) {
      console.error('Error packaging Flutter source:', error);
      throw error;
    }
  }

  // Generate pubspec.yaml for Flutter
  generatePubspecYaml(appName, version = '1.0.1', buildNumber = '1') {
    return `name: ${appName.toLowerCase().replace(/[^a-z0-9]/g, '_')}
description: A Flutter app generated by App Creator
version: ${version}+${buildNumber}

environment:
  sdk: '>=3.0.0 <4.0.0'
  flutter: ">=3.0.0"

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2
  cached_network_image: ^3.3.0
  http: ^1.1.0
  path_provider: ^2.1.1
  shared_preferences: ^2.2.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^2.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/
`;
  }

  // Generate main.dart for Flutter
  generateMainDart(appConfig) {
    // Use the same JSON-to-Flutter logic as the frontend
    const screenData = appConfig.screens && appConfig.screens.length > 0 ? appConfig.screens[0] : null;
    
    if (!screenData || !screenData.components || screenData.components.length === 0) {
      // Fallback to simple welcome screen if no screens provided
      return this.generateFallbackMainDart(appConfig);
    }

    // Generate Flutter app using the same component rendering logic as frontend
    return this.generateMainDartFromComponents(appConfig, screenData);
  }

  // Try to fetch current screen JSON(s) from backend by projectId/pageId
  async tryFetchScreensFromBackend({ projectId, pageId, firebaseToken, firebaseBaseUrl }) {
    try {
      const screens = [];
      const baseUrl = firebaseBaseUrl || process.env.FIREBASE_API_BASE_URL || 'http://10.80.7.189:3200';
      const headers = { 'Content-Type': 'application/json' };
      if (firebaseToken) headers['Access-Token'] = firebaseToken;

      // If pageId provided, fetch single page JSON
      if (pageId) {
        const url = `${baseUrl}/project/pages/${pageId}`;
        console.log(`🌐 Fetching page JSON for packaging: ${url}`);
        const res = await fetch(url, { method: 'GET', headers });
        if (res.ok) {
          const data = await res.json();
          if (data?.json) {
            screens.push({
              screenName: data.json.screenName || 'home',
              originalName: data.json.originalName || 'Home',
              components: data.json.components || [],
              screenProperties: data.json.screenProperties || {},
              metadata: data.json.metadata || {}
            });
          }
        } else {
          console.log(`⚠️  Failed to fetch page JSON: ${res.status}`);
        }
      }

      // If projectId provided and no pageId, fetch pages list and then first page JSON
      if (screens.length === 0 && projectId) {
        const listUrl = `${baseUrl}/project/${projectId}/pages`;
        console.log(`🌐 Fetching project pages for packaging: ${listUrl}`);
        const res = await fetch(listUrl, { method: 'GET', headers });
        if (res.ok) {
          const pages = await res.json();
          const first = Array.isArray(pages) ? pages[0] : null;
          if (first?.id) {
            const pageUrl = `${baseUrl}/project/pages/${first.id}`;
            console.log(`🌐 Fetching first page JSON: ${pageUrl}`);
            const pageRes = await fetch(pageUrl, { method: 'GET', headers });
            if (pageRes.ok) {
              const page = await pageRes.json();
              if (page?.json) {
                screens.push({
                  screenName: page.json.screenName || 'home',
                  originalName: page.json.originalName || 'Home',
                  components: page.json.components || [],
                  screenProperties: page.json.screenProperties || {},
                  metadata: page.json.metadata || {}
                });
              }
            }
          }
        }
      }

      // Validate components and ensure responsive properties are preserved
      if (screens.length > 0) {
        screens.forEach((s, i) => {
          console.log(`✅ Backend screen ${i + 1}: ${s.screenName} (${(s.components || []).length} components)`);
        });
      }
      return screens;
    } catch (err) {
      console.log('⚠️  Error fetching screens from backend:', err.message);
      return [];
    }
  }

  generateFallbackMainDart(appConfig) {
    return `import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${appConfig.appName || 'Generated App'}',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.grey),
      ),
      home: HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${appConfig.appName || 'Generated App'}'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.mobile_friendly,
              size: 64,
              color: Theme.of(context).primaryColor,
            ),
            SizedBox(height: 24),
            Text(
              'Welcome to ${appConfig.appName || 'Generated App'}!',
              style: Theme.of(context).textTheme.headlineMedium,
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 16),
            Text(
              'Your app is ready to use',
              style: Theme.of(context).textTheme.bodyLarge,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
`;
  }

  generateMainDartFromComponents(appConfig, screenData) {
    console.log('🚨 DEBUG: generateMainDartFromComponents called!');
    console.log('🚨 DEBUG: appConfig:', JSON.stringify(appConfig, null, 2));
    console.log('🚨 DEBUG: screenData:', JSON.stringify(screenData, null, 2));
    
    const components = screenData.components || [];
    const screenProperties = screenData.screenProperties || {};
    const screenName = screenData.screenName || 'home';
    const backgroundColor = screenProperties.backgroundColor || '#ffffff';
    
    // Determine layout strategy
    const useAbsoluteLayout = this.shouldUseAbsoluteLayout(components);
    
    // Find AppHeader (used in either strategy)
    const appHeaderComponent = components.find(c => {
      const t = (c.type || '').toLowerCase();
      return t === 'appheader' || t === 'appbar' || t === 'header' || t === 'topbar';
    });
    const appTitle = appHeaderComponent?.props?.appTitle || appConfig.appName || 'Generated App';
    const appHeaderBgColor = appHeaderComponent?.props?.backgroundColor || '#3b82f6';
    const appHeaderTextColor = appHeaderComponent?.props?.titleColor || '#ffffff';
    const appHeaderTitlePercent = appHeaderComponent?.responsive?.titleFontPercent;
    const appHeaderHeight = Math.max(parseFloat(appHeaderComponent?.props?.height) || 64, 44);
    const appHeaderFontSize = appHeaderTitlePercent !== undefined
      ? `MediaQuery.of(context).size.width * ${appHeaderTitlePercent}`
      : (appHeaderComponent?.props?.fontSize || 20);
    const showBackButton = appHeaderComponent?.props?.showBackButton || false;
    const showMenuButton = appHeaderComponent?.props?.showMenuButton || false;
    
    // Always exclude AppHeader-like components; render via Scaffold.appBar
    const positionedComponents = components.filter(c => {
      const t = (c.type || '').toLowerCase();
      return !(t === 'appheader' || t === 'appbar' || t === 'header' || t === 'topbar');
    });
    
    console.log(`🎨 Generating Flutter code for ${positionedComponents.length} positioned components on screen: ${screenName} (absoluteLayout=${useAbsoluteLayout})`);
    console.log(`📋 Component types in positioned components: ${positionedComponents.map(c => c.type).join(', ')}`);
    console.log(`📋 AppHeader component found: ${!!appHeaderComponent}, will render in Scaffold AppBar: ${!!appHeaderComponent}`);

    return `import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${appConfig.appName || 'Generated App'}',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: ${this.parseColorToFlutter(appHeaderBgColor)}),
        // Heuristic: if screen background equals header color, prefer white to avoid full-screen header look
        scaffoldBackgroundColor: ${(appHeaderComponent ? `((${JSON.stringify('${backgroundColor}')} == ${JSON.stringify('${appHeaderBgColor}')}) ? Colors.white : ${this.parseColorToFlutter(backgroundColor)})` : this.parseColorToFlutter(backgroundColor))},
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
      ${appHeaderComponent ? `appBar: AppBar(
        toolbarHeight: ${appHeaderHeight},
        title: Text(
          '${appTitle}',
          style: TextStyle(
            fontSize: ${appHeaderFontSize},
            color: ${this.parseColorToFlutter(appHeaderTextColor)},
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: ${this.parseColorToFlutter(appHeaderBgColor)},
        foregroundColor: ${this.parseColorToFlutter(appHeaderTextColor)},
        elevation: 1,
        centerTitle: false,${showBackButton ? `
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),` : ''}${showMenuButton ? `
        actions: [
          IconButton(
            icon: Icon(Icons.menu),
            onPressed: () {},
          ),
        ],` : ''}
      ),` : ''}
      backgroundColor: ${this.parseColorToFlutter(backgroundColor)},
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            // Force full-viewport canvas so coordinates map 1:1 to device size
            return Stack(
              fit: StackFit.expand,
              clipBehavior: Clip.none,
              children: [
${positionedComponents.map(component => this.generateComponentWidget(component, '                    ')).filter(Boolean).join(',\n')}
              ],
            );
          },
        ),
      ),
    );
  }
}
`;
  }

  // Decide if absolute layout should be used based on responsive percentages or explicit positions
  shouldUseAbsoluteLayout(components) {
    try {
      if (!components || !Array.isArray(components)) return false;
      return components.some(c => {
        const r = c?.responsive || {};
        const hasPercents = r.xPercent !== undefined || r.yPercent !== undefined || r.widthPercent !== undefined || r.heightPercent !== undefined;
        const hasPixelPos = c?.position?.x !== undefined || c?.position?.y !== undefined;
        return hasPercents || hasPixelPos;
      });
    } catch (_) {
      return false;
    }
  }

  generateComponentWidget(component, indent) {
    const type = component.type || 'Text';
    const position = component.position || { x: 0, y: 0 };
    const size = component.size || { width: 100, height: 30 };
    const props = component.props || {};

    let widgetCode = '';

    switch (type) {
      case 'Text':
        widgetCode = this.generateTextWidget({ ...props, responsive: component.responsive }, indent);
        break;
      case 'Heading':
        widgetCode = this.generateHeadingWidget({ ...props, responsive: component.responsive }, indent);
        break;
      case 'Button':
        widgetCode = this.generateButtonWidget({ ...props, responsive: component.responsive }, indent);
        break;
      case 'Card':
        widgetCode = this.generateCardWidget(props, indent);
        break;
      case 'Icon':
        widgetCode = this.generateIconWidget(props, indent);
        break;
      case 'Image':
        widgetCode = this.generateImageWidget(props, indent);
        break;
      case 'Container':
        widgetCode = this.generateContainerWidget(props, indent);
        break;
      case 'AppHeader':
        // AppHeader should not be positioned, it's handled by Scaffold appBar
        // Return empty widget since it's rendered in the AppBar
        return null;
      default:
        widgetCode = `${indent}Container(
${indent}  child: Text('${type}'),
${indent})`;
    }

    // Prefer responsive percentages when available; fallback to pixel positioning
    const responsive = component.responsive || {};
    const hasResponsive = (
      responsive.xPercent !== undefined ||
      responsive.yPercent !== undefined ||
      responsive.widthPercent !== undefined ||
      responsive.heightPercent !== undefined
    );

    if (hasResponsive) {
      const leftExpr = (responsive.xPercent !== undefined)
        ? `constraints.maxWidth * ${responsive.xPercent}`
        : `${position.x || 0}.0`;
      const topExpr = (responsive.yPercent !== undefined)
        ? `constraints.maxHeight * ${responsive.yPercent}`
        : `${position.y || 0}.0`;
      const widthExpr = (responsive.widthPercent !== undefined)
        ? `constraints.maxWidth * ${responsive.widthPercent}`
        : `${size.width || 100}.0`;
      const heightExpr = (responsive.heightPercent !== undefined)
        ? `constraints.maxHeight * ${responsive.heightPercent}`
        : `${size.height || 30}.0`;

      return `${indent}Positioned(
${indent}  left: ${leftExpr},
${indent}  top: ${topExpr},
${indent}  width: ${widthExpr},
${indent}  height: ${heightExpr},
${indent}  child: ${widgetCode.replace(new RegExp(`^${indent}`, 'gm'), indent + '  ')},
${indent})`;
    }

    // Legacy pixel-based positioning: scale from a 360x720 design space
    const pxLeft = (position.x || 0);
    const pxTop = (position.y || 0);
    const pxWidth = (size.width || 100);
    const pxHeight = (size.height || 30);
    return `${indent}LayoutBuilder(
${indent}  builder: (context, constraints) {
${indent}    final double sx = constraints.maxWidth / 360.0;
${indent}    final double sy = constraints.maxHeight / 720.0;
${indent}    return Positioned(
${indent}      left: ${pxLeft} * sx,
${indent}      top: ${pxTop} * sy,
${indent}      width: ${pxWidth} * sx,
${indent}      height: ${pxHeight} * sy,
${indent}      child: ${widgetCode.replace(new RegExp(`^${indent}`, 'gm'), indent + '      ')},
${indent}    );
${indent}  },
${indent})`;
  }

  generateTextWidget(props, indent) {
    const text = props.text || 'Sample Text';
    const fontSize = Math.max(parseFloat(props.fontSize) || 16, 12); // Minimum 12px for mobile
    const color = this.parseColorToFlutter(props.color || '#000000');
    const fontWeight = (props.fontWeight === 'bold' || props.fontWeight === '700') ? 'FontWeight.bold' : 'FontWeight.normal';
    const textAlign = props.textAlign === 'center' ? 'TextAlign.center' : props.textAlign === 'right' ? 'TextAlign.right' : 'TextAlign.left';
    const fontStyle = props.fontStyle === 'italic' ? 'FontStyle.italic' : 'FontStyle.normal';
    const fontPercent = props?.responsive?.fontPercent;

    return `${indent}Text(
${indent}  '${text.replace(/'/g, "\\'")}',
${indent}  textAlign: ${textAlign},
${indent}  style: TextStyle(
${indent}    ${fontPercent !== undefined ? `fontSize: MediaQuery.of(context).size.width * ${fontPercent},` : `fontSize: ${fontSize},`}
${indent}    color: ${color},
${indent}    fontWeight: ${fontWeight},
${indent}    fontStyle: ${fontStyle},
${indent}  ),
${indent})`;
  }

  generateHeadingWidget(props, indent) {
    const text = props.text || 'Heading';
    const level = props.level || 'h1';
    let fontSize = 24;
    
    // Map heading levels to font sizes
    switch (level) {
      case 'h1': fontSize = 32; break;
      case 'h2': fontSize = 28; break;
      case 'h3': fontSize = 24; break;
      case 'h4': fontSize = 20; break;
      case 'h5': fontSize = 18; break;
      case 'h6': fontSize = 16; break;
    }
    
    const color = this.parseColorToFlutter(props.color || '#1f2937');
    const fontWeight = props.fontWeight === 'bold' ? 'FontWeight.bold' : 'FontWeight.w600';

    const fontPercent = props && props.responsive ? props.responsive.fontPercent : undefined;

    return `${indent}Text(
${indent}  '${text.replace(/'/g, "\\'")}',
${indent}  style: TextStyle(
${indent}    ${fontPercent !== undefined ? `fontSize: MediaQuery.of(context).size.width * ${fontPercent},` : `fontSize: ${fontSize},`}
${indent}    color: ${color},
${indent}    fontWeight: ${fontWeight},
${indent}  ),
${indent})`;
  }

  generateAppHeaderWidget(props, indent) {
    const backgroundColor = this.parseColorToFlutter(props.backgroundColor || '#3b82f6');
    const title = props.appTitle || 'App';
    const titleColor = this.parseColorToFlutter(props.titleColor || '#ffffff');
    const titleSize = Math.max(parseFloat(props.titleSize) || parseFloat(props.fontSize) || 18, 12);
    const titleFontPercent = props?.responsive?.titleFontPercent; // may be undefined
    const height = Math.max(parseFloat(props.height) || 64, 44);
    const showBack = props.showBackButton || false;
    const showMenu = props.showMenuButton || false;
    const iconColor = this.parseColorToFlutter(props.iconColor || '#ffffff');

    return `${indent}Container(
${indent}  height: ${height},
${indent}  decoration: BoxDecoration(color: ${backgroundColor}),
${indent}  child: SafeArea(
${indent}    bottom: false,
${indent}    child: Padding(
${indent}      padding: const EdgeInsets.symmetric(horizontal: 16.0),
${indent}      child: Row(
${indent}        children: [
${showBack ? `${indent}          Icon(Icons.arrow_back, color: ${iconColor}),
${indent}          SizedBox(width: 8),` : ''}
${indent}          Expanded(
${indent}            child: Text(
${indent}              '${title.replace(/'/g, "\\'")}',
${indent}              textAlign: TextAlign.center,
${indent}              overflow: TextOverflow.ellipsis,
${indent}              style: TextStyle(
${indent}                color: ${titleColor},
${indent}                ${titleFontPercent !== undefined ? `fontSize: MediaQuery.of(context).size.width * ${titleFontPercent},` : `fontSize: ${titleSize},`}
${indent}                fontWeight: FontWeight.w600,
${indent}              ),
${indent}            ),
${indent}          ),
${showMenu ? `${indent}          SizedBox(width: 8),
${indent}          Icon(Icons.menu, color: ${iconColor}),` : ''}
${indent}        ],
${indent}      ),
${indent}    ),
${indent}  ),
${indent})`;
  }

  generateButtonWidget(props, indent) {
    const text = props.text || 'Button';
    const backgroundColor = this.parseColorToFlutter(props.backgroundColor || '#3b82f6');
    const textColor = this.parseColorToFlutter(props.color || props.textColor || '#ffffff');
    const fontSize = Math.max(parseFloat(props.fontSize) || 14, 12);
    const fontWeight = props.fontWeight === 'bold' || props.fontWeight === '600' || props.fontWeight === '700' ? 'FontWeight.bold' : 'FontWeight.normal';
    const borderRadius = parseFloat(props.borderRadius) || 8;
    const borderColor = this.parseColorToFlutter(props.borderColor || backgroundColor);
    const borderWidth = parseFloat(props.borderWidth) || 0;
    const paddingAll = props.padding !== undefined ? Math.max(parseFloat(props.padding) || 0, 0) : null;
    const paddingH = props.paddingHorizontal !== undefined ? Math.max(parseFloat(props.paddingHorizontal) || 0, 0) : null;
    const paddingV = props.paddingVertical !== undefined ? Math.max(parseFloat(props.paddingVertical) || 0, 0) : null;

    return `${indent}ElevatedButton(
${indent}  onPressed: () {
${indent}    // Add button action here
${indent}  },
${indent}  style: ElevatedButton.styleFrom(
${indent}    backgroundColor: ${backgroundColor},
${indent}    foregroundColor: ${textColor},
${indent}    side: BorderSide(
${indent}      color: ${borderColor},
${indent}      width: ${borderWidth},
${indent}    ),
${indent}    shape: RoundedRectangleBorder(
${indent}      borderRadius: BorderRadius.circular(${borderRadius}),
${indent}    ),
${indent}    ${paddingAll !== null
      ? `padding: EdgeInsets.all(${paddingAll}),`
      : `padding: EdgeInsets.symmetric(horizontal: ${paddingH !== null ? paddingH : 16}, vertical: ${paddingV !== null ? paddingV : 12}),`}
${indent}  ),
${indent}  child: Text(
${indent}    '${text.replace(/'/g, "\\'")}',
${indent}    style: TextStyle(
${indent}      ${props && props.responsive && props.responsive.fontPercent !== undefined ? `fontSize: MediaQuery.of(context).size.width * ${props.responsive.fontPercent},` : `fontSize: ${fontSize},`}
${indent}      fontWeight: ${fontWeight},
${indent}    ),
${indent}  ),
${indent})`;
  }

  generateIconWidget(props, indent) {
    const iconName = props.name || 'star';
    const size = Math.max(parseFloat(props.size) || 24, 16);
    const color = this.parseColorToFlutter(props.color || '#6b7280');

    // Map icon names to Flutter icons (same as existing logic)
    const iconMapping = {
      'user': 'Icons.person',
      'person': 'Icons.person',
      'home': 'Icons.home',
      'settings': 'Icons.settings',
      'search': 'Icons.search',
      'menu': 'Icons.menu',
      'star': 'Icons.star',
      'heart': 'Icons.favorite',
      'plus': 'Icons.add',
      'add': 'Icons.add',
      'minus': 'Icons.remove',
      'remove': 'Icons.remove',
      'check': 'Icons.check',
      'close': 'Icons.close',
      'x': 'Icons.close'
    };

    const flutterIcon = iconMapping[iconName.toLowerCase()] || 'Icons.star';

    return `${indent}Icon(
${indent}  ${flutterIcon},
${indent}  size: ${size},
${indent}  color: ${color},
${indent})`;
  }

  generateImageWidget(props, indent) {
    const borderRadius = parseFloat(props.borderRadius) || 8;
    const src = props.src || '';
    const alt = props.alt || 'Image';
    const objectFit = props.objectFit || 'cover';
    
    // Convert objectFit to Flutter's BoxFit
    let boxFit = 'BoxFit.cover';
    switch (objectFit) {
      case 'contain':
        boxFit = 'BoxFit.contain';
        break;
      case 'fill':
        boxFit = 'BoxFit.fill';
        break;
      case 'cover':
      default:
        boxFit = 'BoxFit.cover';
        break;
    }

    if (!src || src.trim() === '') {
      // Fallback for empty src
      return `${indent}Container(
${indent}  decoration: BoxDecoration(
${indent}    color: Colors.grey[300],
${indent}    borderRadius: BorderRadius.circular(${borderRadius}),
${indent}  ),
${indent}  child: Icon(
${indent}    Icons.image,
${indent}    size: 32,
${indent}    color: Colors.grey[600],
${indent}  ),
${indent})`;
    }

    // Use ClipRRect for border radius and Image.network for actual images
    return `${indent}ClipRRect(
${indent}  borderRadius: BorderRadius.circular(${borderRadius}),
${indent}  child: Image.network(
${indent}    '${src.replace(/'/g, "\\'")}',
${indent}    fit: ${boxFit},
${indent}    loadingBuilder: (context, child, loadingProgress) {
${indent}      if (loadingProgress == null) return child;
${indent}      return Container(
${indent}        decoration: BoxDecoration(
${indent}          color: Colors.grey[300],
${indent}          borderRadius: BorderRadius.circular(${borderRadius}),
${indent}        ),
${indent}        child: Center(
${indent}          child: CircularProgressIndicator(
${indent}            value: loadingProgress.expectedTotalBytes != null
${indent}                ? loadingProgress.cumulativeBytesLoaded / 
${indent}                  loadingProgress.expectedTotalBytes!
${indent}                : null,
${indent}          ),
${indent}        ),
${indent}      );
${indent}    },
${indent}    errorBuilder: (context, error, stackTrace) {
${indent}      return Container(
${indent}        decoration: BoxDecoration(
${indent}          color: Colors.grey[300],
${indent}          borderRadius: BorderRadius.circular(${borderRadius}),
${indent}        ),
${indent}        child: Column(
${indent}          mainAxisAlignment: MainAxisAlignment.center,
${indent}          children: [
${indent}            Icon(
${indent}              Icons.broken_image,
${indent}              size: 32,
${indent}              color: Colors.grey[600],
${indent}            ),
${indent}            SizedBox(height: 4),
${indent}            Text(
${indent}              'Image not available',
${indent}              style: TextStyle(
${indent}                fontSize: 12,
${indent}                color: Colors.grey[600],
${indent}              ),
${indent}            ),
${indent}          ],
${indent}        ),
${indent}      );
${indent}    },
${indent}  ),
${indent})`;
  }

  generateContainerWidget(props, indent) {
    const backgroundColor = this.parseColorToFlutter(props.backgroundColor || '#F5F5F5');
    const borderRadius = parseFloat(props.borderRadius) || 8;
    const text = props.text;

    let childWidget = 'null';
    if (text) {
      const textColor = this.parseColorToFlutter(props.textColor || '#000000');
      const fontSize = Math.max(parseFloat(props.fontSize) || 14, 12);
      
      childWidget = `Center(
${indent}    child: Text(
${indent}      '${text.replace(/'/g, "\\'")}',
${indent}      style: TextStyle(
${indent}        color: ${textColor},
${indent}        fontSize: ${fontSize},
${indent}      ),
${indent}    ),
${indent}  )`;
    }

    return `${indent}Container(
${indent}  decoration: BoxDecoration(
${indent}    color: ${backgroundColor},
${indent}    borderRadius: BorderRadius.circular(${borderRadius}),
${indent}  ),
${indent}  child: ${childWidget},
${indent})`;
  }

  parseColorToFlutter(colorString) {
    if (!colorString || colorString === 'transparent') {
      return 'Colors.transparent';
    }
    
    try {
      if (colorString.startsWith('#')) {
        const hex = colorString.substring(1);
        return `Color(0xFF${hex.toUpperCase()})`;
      }
      return 'Colors.black';
    } catch (e) {
      return 'Colors.black';
    }
  }

  // Generate Info.plist for iOS
  generateInfoPlist(appName, bundleId) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleDisplayName</key>
  <string>${appName}</string>
  <key>CFBundleExecutable</key>
  <string>Runner</string>
  <key>CFBundleIdentifier</key>
  <string>${bundleId}</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${appName}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>$(MARKETING_VERSION)</string>
  <key>CFBundleVersion</key>
  <string>$(CURRENT_PROJECT_VERSION)</string>
  <key>LSRequiresIPhoneOS</key>
  <true/>
  <key>UIRequiredDeviceCapabilities</key>
  <array>
    <string>arm64</string>
  </array>
  <key>UILaunchStoryboardName</key>
  <string>LaunchScreen</string>
  <key>UIMainStoryboardFile</key>
  <string>Main</string>
  <key>UISupportedInterfaceOrientations</key>
  <array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
  </array>
  <key>UISupportedInterfaceOrientations~ipad</key>
  <array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationPortraitUpsideDown</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
  </array>
  <key>UIViewControllerBasedStatusBarAppearance</key>
  <false/>
  <key>CADisableMinimumFrameDurationOnPhone</key>
  <true/>
  <key>UIApplicationSupportsIndirectInputEvents</key>
  <true/>
  <key>CFBundleIcons</key>
  <dict>
    <key>CFBundlePrimaryIcon</key>
    <dict>
      <key>CFBundleIconFiles</key>
      <array>
        <string>AppIcon</string>
      </array>
      <key>UIPrerenderedIcon</key>
      <true/>
    </dict>
  </dict>
  <key>CFBundleIconName</key>
  <string>AppIcon</string>
</dict>
</plist>
`;
  }

  // Generate screens data Dart file
  generateScreensDataDart(appConfig) {
    return `// Generated screens data for ${appConfig.appName}
import 'dart:convert';

class ScreensData {
  static const String appConfigJson = '''${JSON.stringify(appConfig, null, 2)}''';
  
  static Map<String, dynamic> get appConfig {
    return json.decode(appConfigJson);
  }
  
  static List<dynamic> get screens {
    return appConfig['screens'] ?? [];
  }
  
  static String get appName {
    return appConfig['appName'] ?? 'My App';
  }
  
  static String get bundleId {
    return appConfig['bundleId'] ?? 'com.example.app';
  }
  
  static String get projectId {
    return appConfig['projectId'] ?? '';
  }
  
  static String get templateId {
    return appConfig['templateId'] ?? '';
  }
}
`;
  }

  // Generate Xcode workspace data
  generateXcworkspaceData() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Workspace
   version = "1.0">
   <FileRef
      location = "group:Runner.xcodeproj">
   </FileRef>
   <FileRef
      location = "group:Pods/Pods.xcodeproj">
   </FileRef>
</Workspace>
`;
  }

  // Generate workspace checks
  generateWorkspaceChecks() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>IDEDidComputeMac32BitWarning</key>
  <true/>
</dict>
</plist>
`;
  }

  // Generate Xcode project file (simplified)
  generateProjectPbxproj(appName, bundleId) {
    const projectId = Math.random().toString(36).substring(2, 15);
    return `// !$*UTF8*$!
{
  archiveVersion = 1;
  classes = {
  };
  objectVersion = 54;
  objects = {
    /* Begin PBXProject section */
    97C146E61CF9000F007C117D /* Project object */ = {
      isa = PBXProject;
      attributes = {
        LastUpgradeCheck = 1300;
        ORGANIZATIONNAME = "App Creator";
        TargetAttributes = {
          97C146ED1CF9000F007C117D = {
            CreatedOnToolsVersion = 7.3.1;
            DevelopmentTeam = DEVELOPMENT_TEAM;
          };
        };
      };
      buildConfigurationList = 97C146E91CF9000F007C117D;
      compatibilityVersion = "Xcode 9.3";
      developmentRegion = en;
      hasScannedForEncodings = 0;
      knownRegions = (
        en,
        Base,
      );
      mainGroup = 97C146E51CF9000F007C117D;
      productRefGroup = 97C146EF1CF9000F007C117D;
      projectDirPath = "";
      projectRoot = "";
      targets = (
        97C146ED1CF9000F007C117D,
      );
    };
    /* End PBXProject section */
  };
  rootObject = 97C146E61CF9000F007C117D;
}
`;
  }

  // Generate Xcode scheme
  generateXcscheme() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "1300"
   version = "1.3">
   <BuildAction
      parallelizeBuildables = "YES"
      buildImplicitDependencies = "YES">
      <BuildActionEntries>
         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "YES"
            buildForProfiling = "YES"
            buildForArchiving = "YES"
            buildForAnalyzing = "YES">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "97C146ED1CF9000F007C117D"
               BuildableName = "Runner.app"
               BlueprintName = "Runner"
               ReferencedContainer = "container:Runner.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <TestAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      shouldUseLaunchSchemeArgsEnv = "YES">
   </TestAction>
   <LaunchAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      launchStyle = "0"
      useCustomWorkingDirectory = "NO"
      ignoresPersistentStateOnLaunch = "NO"
      debugDocumentVersioning = "YES"
      debugServiceExtension = "internal"
      allowLocationSimulation = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "97C146ED1CF9000F007C117D"
            BuildableName = "Runner.app"
            BlueprintName = "Runner"
            ReferencedContainer = "container:Runner.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </LaunchAction>
   <ProfileAction
      buildConfiguration = "Profile"
      shouldUseLaunchSchemeArgsEnv = "YES"
      savedToolIdentifier = ""
      useCustomWorkingDirectory = "NO"
      debugDocumentVersioning = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "97C146ED1CF9000F007C117D"
            BuildableName = "Runner.app"
            BlueprintName = "Runner"
            ReferencedContainer = "container:Runner.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </ProfileAction>
   <AnalyzeAction
      buildConfiguration = "Debug">
   </AnalyzeAction>
   <ArchiveAction
      buildConfiguration = "Release"
      revealArchiveInOrganizer = "YES">
   </ArchiveAction>
</Scheme>
`;
  }

  // Generate AppDelegate.swift
  generateAppDelegate() {
    return `import UIKit
import Flutter

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
`;
  }

  // Generate bridging header
  generateBridgingHeader() {
    return `#import "GeneratedPluginRegistrant.h"
`;
  }

  // Generate app icon contents
  generateAppIconContentsFixed() {
    return `{
  "images" : [
    { "idiom" : "iphone", "scale" : "2x", "size" : "20x20", "filename": "Icon-App-20x20@2x.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "20x20", "filename": "Icon-App-20x20@3x.png" },
    { "idiom" : "iphone", "scale" : "2x", "size" : "29x29", "filename": "Icon-App-29x29@2x.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "29x29", "filename": "Icon-App-29x29@3x.png" },
    { "idiom" : "iphone", "scale" : "2x", "size" : "40x40", "filename": "Icon-App-40x40@2x.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "40x40", "filename": "Icon-App-40x40@3x.png" },
    { "idiom" : "iphone", "scale" : "2x", "size" : "60x60", "filename": "Icon-App-60x60@2x.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "60x60", "filename": "Icon-App-60x60@3x.png" },

    { "idiom" : "ipad", "scale" : "1x", "size" : "20x20", "filename": "Icon-App-20x20@1x~ipad.png" },
    { "idiom" : "ipad", "scale" : "2x", "size" : "20x20", "filename": "Icon-App-20x20@2x~ipad.png" },
    { "idiom" : "ipad", "scale" : "1x", "size" : "29x29", "filename": "Icon-App-29x29@1x~ipad.png" },
    { "idiom" : "ipad", "scale" : "2x", "size" : "29x29", "filename": "Icon-App-29x29@2x~ipad.png" },
    { "idiom" : "ipad", "scale" : "1x", "size" : "40x40", "filename": "Icon-App-40x40@1x~ipad.png" },
    { "idiom" : "ipad", "scale" : "2x", "size" : "40x40", "filename": "Icon-App-40x40@2x~ipad.png" },
    { "idiom" : "ipad", "scale" : "1x", "size" : "76x76", "filename": "Icon-App-76x76@1x~ipad.png" },
    { "idiom" : "ipad", "scale" : "2x", "size" : "76x76", "filename": "Icon-App-76x76@2x~ipad.png" },
    { "idiom" : "ipad", "scale" : "2x", "size" : "83.5x83.5", "filename": "Icon-App-83.5x83.5@2x~ipad.png" },

    { "idiom" : "ios-marketing", "scale" : "1x", "size" : "1024x1024", "filename": "Icon-App-1024x1024@1x.png" }
  ],
  "info" : { "author" : "xcode", "version" : 1 },
  "properties" : { "pre-rendered" : true }
}
`;
  }

  // Generate launch image contents
  generateLaunchImageContents() {
    return `{
  "images" : [
    {
      "idiom" : "universal",
      "filename" : "LaunchImage.png",
      "scale" : "1x"
    },
    {
      "idiom" : "universal",
      "filename" : "LaunchImage@2x.png",
      "scale" : "2x"
    },
    {
      "idiom" : "universal",
      "filename" : "LaunchImage@3x.png",
      "scale" : "3x"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
`;
  }

  // Generate launch screen storyboard
  generateLaunchScreen() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="12121" systemVersion="16G29" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="12089"/>
    </dependencies>
    <scenes>
        <!--View Controller-->
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                    <layoutGuides>
                        <viewControllerLayoutGuide type="top" id="Ydg-fD-yQy"/>
                        <viewControllerLayoutGuide type="bottom" id="xbc-2k-c8Z"/>
                    </layoutGuides>
                    <view key="view" contentMode="scaleToFill" id="Ze5-6b-2t3">
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <color key="backgroundColor" red="1" green="1" blue="1" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="53" y="375"/>
        </scene>
    </scenes>
</document>
`;
  }

  // Generate main storyboard
  generateMainStoryboard() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="10117" systemVersion="15F34" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" useTraitCollections="YES" initialViewController="BYZ-38-t0r">
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="10085"/>
    </dependencies>
    <scenes>
        <!--Flutter View Controller-->
        <scene sceneID="tne-QT-ifu">
            <objects>
                <viewController id="BYZ-38-t0r" customClass="FlutterViewController" sceneMemberID="viewController">
                    <layoutGuides>
                        <viewControllerLayoutGuide type="top" id="y3c-jy-aDJ"/>
                        <viewControllerLayoutGuide type="bottom" id="wfy-db-euE"/>
                    </layoutGuides>
                    <view key="view" contentMode="scaleToFill" id="8bC-Xf-vdC">
                        <rect key="frame" x="0.0" y="0.0" width="600" height="600"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <color key="backgroundColor" white="1" alpha="1" colorSpace="custom" customColorSpace="calibratedWhite"/>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="dkx-z0-nzr" sceneMemberID="firstResponder"/>
            </objects>
        </scene>
    </scenes>
</document>
`;
  }

  // Generate App Framework Info
  generateAppFrameworkInfo() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>App</string>
  <key>CFBundleIdentifier</key>
  <string>io.flutter.flutter.app</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>App</string>
  <key>CFBundlePackageType</key>
  <string>FMWK</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>CFBundleSignature</key>
  <string>????</string>
  <key>CFBundleVersion</key>
  <string>1.0</string>
  <key>MinimumOSVersion</key>
  <string>12.0</string>
</dict>
</plist>
`;
  }

  // Generate debug Xcode config
  generateDebugXcconfig() {
    return `#include "Generated.xcconfig"
`;
  }

  // Generate release Xcode config
  generateReleaseXcconfig() {
    return `#include "Generated.xcconfig"
`;
  }

  // Generate generated Xcode config
  generateGeneratedXcconfig() {
    return `// This is a generated file; do not edit or check into version control.
FLUTTER_ROOT=\${FLUTTER_ROOT}
FLUTTER_APPLICATION_PATH=\${FLUTTER_APPLICATION_PATH}
COCOAPODS_PARALLEL_CODE_SIGN=true
FLUTTER_TARGET=lib/main.dart
FLUTTER_BUILD_DIR=build
FLUTTER_BUILD_NAME=1.0.0
FLUTTER_BUILD_NUMBER=1
EXCLUDED_ARCHS[sdk=iphonesimulator*]=i386
EXCLUDED_ARCHS[sdk=iphoneos*]=armv7
DART_OBFUSCATION=false
TRACK_WIDGET_CREATION=true
TREE_SHAKE_ICONS=false
PACKAGE_CONFIG=.dart_tool/package_config.json
`;
  }

  // Generate Podfile
  generatePodfile() {
    return `# Uncomment this line to define a global platform for your project
platform :ios, '12.0'

# CocoaPods analytics sends network stats synchronously affecting flutter build latency.
ENV['COCOAPODS_DISABLE_STATS'] = 'true'

project 'Runner', {
  'Debug' => :debug,
  'Profile' => :release,
  'Release' => :release,
}

def flutter_root
  generated_xcode_build_settings_path = File.expand_path(File.join('..', 'Flutter', 'Generated.xcconfig'), __FILE__)
  unless File.exist?(generated_xcode_build_settings_path)
    raise "#{generated_xcode_build_settings_path} must exist. If you're running pod install manually, make sure flutter pub get is executed first"
  end

  File.foreach(generated_xcode_build_settings_path) do |line|
    matches = line.match(/FLUTTER_ROOT\=(.*)/)
    return matches[1].strip if matches
  end
  raise "FLUTTER_ROOT not found in #{generated_xcode_build_settings_path}. Try deleting Generated.xcconfig, then run flutter pub get"
end

require File.expand_path(File.join('packages', 'flutter_tools', 'bin', 'podhelper'), flutter_root)

flutter_ios_podfile_setup

target 'Runner' do
  use_frameworks!
  use_modular_headers!

  flutter_install_all_ios_pods File.dirname(File.realpath(__FILE__))
end

post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
  end
end
`;
  }

  // Generate Podfile.lock
  generatePodfileLock() {
    return `PODS:
  - Flutter (1.0.0)

DEPENDENCIES:
  - Flutter (from \`Flutter\`)

EXTERNAL SOURCES:
  Flutter:
    :path: Flutter

SPEC CHECKSUMS:
  Flutter: f04841e97a9d0b0a8025694d0796dd46242b2854

PODFILE CHECKSUM: 70d9d25280d0dd177a5f637cdb0f0b0b12c6a189

COCOAPODS: 1.11.3
`;
  }

  // Generate Flutter plugins file
  generateFlutterPlugins() {
    return `# This is a generated file; do not edit or check into version control.
`;
  }

  // Generate Flutter plugins dependencies
  generateFlutterPluginsDependencies() {
    return `{
  "info": "This is a generated file; do not edit or check into version control.",
  "plugins": {
    "ios": [

    ],
    "android": [

    ],
    "macos": [

    ],
    "linux": [

    ],
    "windows": [

    ],
    "web": [

    ]
  },
  "dependencyGraph": [

  ],
  "date_created": "2024-01-01 00:00:00.000000",
  "version": "3.16.0"
}
`;
  }

  // Generate Android build.gradle
  generateAndroidBuildGradle(appName, bundleId) {
    return `def localProperties = new Properties()
def localPropertiesFile = rootProject.file('local.properties')
if (localPropertiesFile.exists()) {
    localPropertiesFile.withReader('UTF-8') { reader ->
        localProperties.load(reader)
    }
}

def flutterRoot = localProperties.getProperty('flutter.sdk')
if (flutterRoot == null) {
    throw new GradleException("Flutter SDK not found. Define location with flutter.sdk in the local.properties file.")
}

def flutterVersionCode = localProperties.getProperty('flutter.versionCode')
if (flutterVersionCode == null) {
    flutterVersionCode = '1'
}

def flutterVersionName = localProperties.getProperty('flutter.versionName')
if (flutterVersionName == null) {
    flutterVersionName = '1.0'
}

apply plugin: 'com.android.application'
apply plugin: 'kotlin-android'
apply from: "$flutterRoot/packages/flutter_tools/gradle/flutter.gradle"

android {
    namespace "${bundleId}"
    compileSdkVersion flutter.compileSdkVersion
    ndkVersion flutter.ndkVersion

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = '1.8'
    }

    sourceSets {
        main.java.srcDirs += 'src/main/kotlin'
    }

    defaultConfig {
        applicationId "${bundleId}"
        minSdkVersion flutter.minSdkVersion
        targetSdkVersion flutter.targetSdkVersion
        versionCode flutterVersionCode.toInteger()
        versionName flutterVersionName
    }

    buildTypes {
        release {
            signingConfig signingConfigs.debug
        }
    }
}

flutter {
    source '../..'
}

dependencies {
    implementation "org.jetbrains.kotlin:kotlin-stdlib-jdk7:$kotlin_version"
}
`;
  }

  // Generate Android manifest
  generateAndroidManifest(appName, bundleId) {
    return `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:label="${appName}"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            <meta-data
              android:name="io.flutter.embedding.android.NormalTheme"
              android:resource="@style/NormalTheme"
              />
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
        <meta-data
            android:name="flutterEmbedding"
            android:value="2" />
    </application>
</manifest>
`;
  }

  // Generate MainActivity
  generateMainActivity() {
    return `package ${this.bundleId}

import io.flutter.embedding.android.FlutterActivity

class MainActivity: FlutterActivity() {
}
`;
  }

  // Generate root build.gradle
  generateRootBuildGradle() {
    return `buildscript {
    ext.kotlin_version = '1.7.10'
    repositories {
        google()
        mavenCentral()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:7.3.0'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.buildDir = '../build'
subprojects {
    project.buildDir = "\${rootProject.buildDir}/\${project.name}"
}
subprojects {
    project.evaluationDependsOn(':app')
}

tasks.register("clean", Delete) {
    delete rootProject.buildDir
}
`;
  }

  // Generate gradle.properties
  generateGradleProperties() {
    return `org.gradle.jvmargs=-Xmx1536M
android.useAndroidX=true
android.enableJetifier=true
`;
  }

  // Generate settings.gradle
  generateSettingsGradle() {
    return `include ':app'

def localPropertiesFile = new File(rootProject.projectDir, "local.properties")
def properties = new Properties()

assert localPropertiesFile.exists()
localPropertiesFile.withReader("UTF-8") { reader -> properties.load(reader) }

def flutterSdkPath = properties.getProperty("flutter.sdk")
assert flutterSdkPath != null, "flutter.sdk not set in local.properties"
apply from: "$flutterSdkPath/packages/flutter_tools/gradle/app_plugin_loader.gradle"
`;
  }

  // Create IPA file with Flutter build process
  async createIPA(buildDir, appName, appConfig) {
    try {
      console.log('='.repeat(80));
      console.log('🔨 FLUTTER IPA BUILD PROCESS STARTED');
      console.log('='.repeat(80));
      console.log('🔨 Starting Flutter iOS build process...');
      console.log(`   🕐 Timestamp: ${new Date().toISOString()}`);
      console.log(`   📁 Build Directory: ${buildDir}`);
      console.log(`   📱 App Name: ${appName}`);
      console.log(`   🏗️  App Config:`, JSON.stringify(appConfig, null, 2));
      console.log(`   📁 Current Directory: ${process.cwd()}`);
      console.log(`   🔧 Node Version: ${process.version}`);
      console.log(`   💾 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
      
      const flutterProjectPath = path.join(__dirname, '..', 'flutter_app');
      
      // Check server environment and capabilities
      const isProduction = process.env.NODE_ENV === 'production';
      const forceRealBuilds = process.env.FORCE_REAL_BUILDS === 'true';
      const hasFlutterProject = fs.existsSync(flutterProjectPath);
      
      console.log('🔍 Environment check:');
      console.log(`   - Production: ${isProduction}`);
      console.log(`   - Force Real Builds: ${forceRealBuilds}`);
      console.log(`   - Has Flutter Project: ${hasFlutterProject}`);
      console.log(`   - Platform: ${process.platform}`);
      console.log(`   - Flutter Project Path: ${flutterProjectPath}`);
      
      // Check if Flutter project exists
      if (!hasFlutterProject) {
        console.log('⚠️  Flutter project not found at:', flutterProjectPath);
        if (isProduction || forceRealBuilds) {
          throw new Error('Flutter project required for production builds but not found');
        }
        console.log('🧪 Creating simulated IPA for development...');
        return this.createSimulatedIPA(buildDir, appName, appConfig);
      }
      
      // Check if we're on macOS (required for iOS builds)
      if (process.platform !== 'darwin') {
        console.log('⚠️  PLATFORM CHECK: Not running on macOS');
        console.log(`   Current platform: ${process.platform}`);
        console.log(`   Required platform: darwin (macOS)`);
        if (isProduction || forceRealBuilds) {
          throw new Error('iOS builds require macOS but running on: ' + process.platform);
        }
        console.log('🧪 Creating simulated IPA (non-macOS environment)...');
        return this.createSimulatedIPA(buildDir, appName, appConfig);
      }
      
      // Check if Flutter and Xcode are available
      const { spawn } = require('child_process');
      
      // Check Flutter
      try {
        await new Promise((resolve, reject) => {
          const flutterCheck = spawn('flutter', ['--version'], { stdio: 'pipe' });
          flutterCheck.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error('Flutter not available'));
          });
          flutterCheck.on('error', reject);
        });
        console.log('✅ Flutter is available');
      } catch (error) {
        console.log('⚠️  Flutter not available:', error.message);
        if (isProduction || forceRealBuilds) {
          throw new Error('Flutter is required for production builds but not available');
        }
        console.log('🧪 Creating simulated IPA (Flutter not available)...');
        return this.createSimulatedIPA(buildDir, appName, appConfig);
      }
      
      // Check Xcode
      try {
        await new Promise((resolve, reject) => {
          const xcodeCheck = spawn('xcrun', ['--version'], { stdio: 'pipe' });
          xcodeCheck.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error('Xcode command line tools not available'));
          });
          xcodeCheck.on('error', reject);
        });
        console.log('✅ Xcode command line tools are available');
      } catch (error) {
        console.log('⚠️  Xcode command line tools not available:', error.message);
        if (isProduction || forceRealBuilds) {
          throw new Error('Xcode is required for production builds but not available');
        }
        console.log('🧪 Creating simulated IPA (Xcode not available)...');
        return this.createSimulatedIPA(buildDir, appName, appConfig);
      }
      
      console.log('🏗️  All requirements met - building real Flutter iOS app...');
      
      // Use version and build numbers from appConfig (already generated consistently)
      const buildNumber = appConfig.buildNumber; 
      const version = appConfig.version;
      
      console.log(`📱 Using version: ${version}, build: ${buildNumber} (from appConfig)`);
      
      // Update Flutter app with current project data
      await this.updateFlutterApp(flutterProjectPath, appConfig, buildNumber, version);
      
      // Build the Flutter app
      const ipaPath = await this.buildFlutterIPA(flutterProjectPath, buildDir, appName, buildNumber);
      
      return ipaPath;
      
    } catch (error) {
      console.error('❌ Error creating IPA:', error.message);
      console.error('📋 Error details:', {
        name: error.name,
        code: error.code,
        platform: process.platform,
        nodeEnv: process.env.NODE_ENV,
        forceRealBuilds: process.env.FORCE_REAL_BUILDS
      });
      
      // Don't fall back to simulated IPA in production or when explicitly disabled
      if (process.env.NODE_ENV === 'production' || 
          process.env.FORCE_REAL_BUILDS === 'true' || 
          process.env.DISABLE_SIMULATED_BUILDS === 'true') {
        console.log('🚫 Simulated IPA fallback disabled - throwing real error');
        throw error;
      }
      
      console.log('🧪 Falling back to simulated IPA (development only)');
      return this.createSimulatedIPA(buildDir, appName, appConfig);
    }
  }
  
  // Create simulated IPA for development/testing
  async createSimulatedIPA(buildDir, appName, appConfig) {
    console.log('🧪 Creating simulated IPA for development...');
    
    // For production environments, we should NOT upload simulated IPAs to TestFlight
    // They will always fail with provisioning profile errors
    if (process.env.NODE_ENV === 'production' || process.env.FORCE_REAL_BUILDS === 'true') {
      throw new Error('Simulated IPA creation disabled in production. Real Flutter build required.');
    }
    
      const ipaPath = path.join(buildDir, `${appName}.ipa`);
      
    // Use version and build numbers from appConfig (already generated consistently)
    const buildNumber = appConfig.buildNumber;
    const version = appConfig.version;
    
    console.log(`📱 Using version: ${version}, build: ${buildNumber} (from appConfig, simulated IPA)`);
    
    // Create a simple ZIP structure that mimics an IPA
    const tempDir = path.join(buildDir, 'temp_app');
    const payloadDir = path.join(tempDir, 'Payload');
    const appDir = path.join(payloadDir, `${appName}.app`);
    
    fs.mkdirSync(appDir, { recursive: true });
    
    // Create a proper XML Info.plist (not JSON)
    const infoPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key>
  <string>${appName}</string>
  <key>CFBundleExecutable</key>
  <string>${appName}</string>
  <key>CFBundleIdentifier</key>
  <string>${process.env.BUNDLE_ID || 'com.visios.nocode'}</string>
  <key>CFBundleName</key>
  <string>${appName}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>${version}</string>
  <key>CFBundleVersion</key>
  <string>${buildNumber}</string>
  <key>LSRequiresIPhoneOS</key>
  <true/>
  <key>UIRequiredDeviceCapabilities</key>
  <array>
    <string>arm64</string>
  </array>
</dict>
</plist>`;
    
    fs.writeFileSync(path.join(appDir, 'Info.plist'), infoPlistContent);
    
    // Create a dummy executable
    fs.writeFileSync(path.join(appDir, appName), 'dummy executable');
    
    // WARNING: Add a clear marker that this is simulated
    fs.writeFileSync(path.join(appDir, 'SIMULATED_BUILD.txt'), 
      `This is a simulated IPA for development only.\nReal Flutter builds should be used for TestFlight.\nGenerated: ${new Date().toISOString()}`
    );
    
    // Create ZIP (IPA is just a ZIP file)
    const archiver = require('archiver');
        const output = fs.createWriteStream(ipaPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
        output.on('close', () => {
        console.log(`📦 Simulated IPA created: ${archive.pointer()} total bytes`);
        console.log('⚠️  WARNING: This is a simulated IPA and will likely fail TestFlight upload validation');
        console.log('💡 For real TestFlight uploads, ensure Flutter and Xcode are properly configured');
        
        // Clean up temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });
        
          resolve(ipaPath);
        });

        archive.on('error', reject);
        archive.pipe(output);
      archive.directory(payloadDir, 'Payload');
        archive.finalize();
      });
  }

  // Generate export options plist for Xcode
  generateExportOptions() {
    const teamId = process.env.APPLE_TEAM_ID || 'TEAM_ID_PLACEHOLDER';
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store</string>
  <key>destination</key>
  <string>export</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>uploadBitcode</key>
  <false/>
  <key>uploadSymbols</key>
  <true/>
  <key>compileBitcode</key>
  <false/>
  <key>teamID</key>
  <string>${teamId}</string>
  <key>signingCertificate</key>
  <string>Apple Distribution: SHO Technologies Inc. (GD7UT9D9NY)</string>
  <key>provisioningProfiles</key>
  <dict>
    <key>${this.bundleId}</key>
    <string>App Store Profile</string>
  </dict>
  <key>manageAppVersionAndBuildNumber</key>
  <true/>
</dict>
</plist>
`;
  }

  // Generate build script for actual Flutter compilation
  generateBuildScript(appName) {
    return `#!/bin/bash
set -e

echo "🚀 Building Flutter iOS app: ${appName}"
echo "📁 Build directory: $(pwd)"
echo "📱 Bundle ID: ${this.bundleId}"

# Check if Flutter is installed
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter is not installed. Please install Flutter first."
    echo "   Visit: https://docs.flutter.dev/get-started/install"
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode is not installed. Please install Xcode from the App Store."
    exit 1
fi

# Setup Flutter environment variables
echo "🔧 Setting up Flutter environment..."
export FLUTTER_ROOT="\$(flutter --version | grep 'Flutter' | awk '{print \$3}' | sed 's/\/bin\/flutter//')"
if [ -z "\$FLUTTER_ROOT" ]; then
    export FLUTTER_ROOT="\$(which flutter | sed 's/\/bin\/flutter//')"
fi
if [ -z "\$FLUTTER_ROOT" ]; then
    export FLUTTER_ROOT="\$HOME/flutter"
fi

export FLUTTER_APPLICATION_PATH="\$(pwd)"

echo "✅ Flutter Root: \$FLUTTER_ROOT"
echo "✅ App Path: \$FLUTTER_APPLICATION_PATH"

echo "✅ Flutter version:"
flutter --version

echo "✅ Xcode version:"
xcodebuild -version

# Fix hardcoded Flutter paths in Xcode project
echo "🔧 Fixing Flutter paths in Xcode project..."
if [ -f "ios/Runner.xcodeproj/project.pbxproj" ]; then
    # Replace any hardcoded Flutter paths with environment variable
    sed -i '' 's|/usr/local/flutter|"\$FLUTTER_ROOT"|g' ios/Runner.xcodeproj/project.pbxproj
    sed -i '' 's|/Users/.*/flutter|"\$FLUTTER_ROOT"|g' ios/Runner.xcodeproj/project.pbxproj
    sed -i '' 's|/usr/local/bin/flutter/packages/flutter_tools/bin/xcode_backend.sh|"\$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh"|g' ios/Runner.xcodeproj/project.pbxproj
    echo "✅ Fixed Flutter paths in project.pbxproj"
fi

# Update Generated.xcconfig with correct paths
echo "🔧 Updating Generated.xcconfig..."
cat > ios/Flutter/Generated.xcconfig << EOF
// This is a generated file; do not edit or check into version control.
FLUTTER_ROOT=$flutter_root
FLUTTER_APPLICATION_PATH=$app_path
COCOAPODS_PARALLEL_CODE_SIGN=true
FLUTTER_TARGET=lib/main.dart
FLUTTER_BUILD_DIR=build
FLUTTER_BUILD_NAME=1.0.0
FLUTTER_BUILD_NUMBER=1
EXCLUDED_ARCHS[sdk=iphonesimulator*]=i386
EXCLUDED_ARCHS[sdk=iphoneos*]=armv7
DART_OBFUSCATION=false
TRACK_WIDGET_CREATION=true
TREE_SHAKE_ICONS=false
PACKAGE_CONFIG=.dart_tool/package_config.json
EOF

# Create default app icon if none exists
echo "🎨 Setting up app icons..."
if [ ! -f "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png" ]; then
    echo "📱 No custom app icon found, using default Flutter icon"
    # You can add custom app icon logic here
fi

echo "📦 Getting Flutter dependencies..."
flutter pub get

# Clean previous builds
echo "🧹 Cleaning previous builds..."
flutter clean
flutter pub get

echo "🔨 Building Flutter for iOS (Release mode)..."
flutter build ios --release --no-codesign

echo "📱 Building iOS archive with Xcode..."
cd ios
xcodebuild clean archive \\
  -workspace Runner.xcworkspace \\
  -scheme Runner \\
  -configuration Release \\
  -archivePath ../build/Runner.xcarchive \\
  -allowProvisioningUpdates \\
  FLUTTER_ROOT="\$FLUTTER_ROOT" \\
  FLUTTER_APPLICATION_PATH="\$FLUTTER_APPLICATION_PATH"

echo "📤 Exporting IPA for App Store..."
cd ..
xcodebuild -exportArchive \\
  -archivePath build/Runner.xcarchive \\
  -exportPath build/ipa \\
  -exportOptionsPlist exportOptions.plist \\
  -allowProvisioningUpdates

echo "✅ Build completed! IPA file location:"
echo "   $(pwd)/build/ipa/Runner.ipa"
echo ""
echo "🚀 Ready for TestFlight upload!"
echo "   You can now upload this IPA to App Store Connect via:"
echo "   - Xcode Organizer"
echo "   - Application Loader"
echo "   - App Store Connect website"
echo "   - Or using this API service"

# Optional: Validate the IPA
echo "🔍 Validating IPA..."
if [ ! -z "\${APP_STORE_CONNECT_KEY_ID}" ] && [ ! -z "\${APP_STORE_CONNECT_ISSUER_ID}" ]; then
xcrun altool --validate-app \\
  -f build/ipa/Runner.ipa \\
  -t ios \\
  --apiKey \${APP_STORE_CONNECT_KEY_ID} \\
  --apiIssuer \${APP_STORE_CONNECT_ISSUER_ID} \\
      || echo "⚠️  Validation skipped (may require app to be uploaded first)"
else
    echo "⚠️  API keys not configured for validation"
fi

echo "🎉 Build process completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Upload the IPA to App Store Connect"
echo "   2. Submit for TestFlight review"
echo "   3. Distribute to testers"
`;
  }

  // Upload build to App Store Connect using altool
  async uploadBuild(ipaPath, appConfig) {
    try {
      console.log('='.repeat(80));
      console.log('🚀 TESTFLIGHT DEPLOYMENT ATTEMPT STARTED');
      console.log('='.repeat(80));
      console.log('📤 Starting intelligent build upload...');
      console.log('🔍 Checking deployment environment...');
      console.log(`   📱 Platform: ${process.platform}`);
      console.log(`   📦 IPA Path: ${ipaPath}`);
      console.log(`   🏗️  App Config:`, JSON.stringify(appConfig, null, 2));
      console.log(`   🕐 Timestamp: ${new Date().toISOString()}`);
      console.log(`   📁 Current Directory: ${process.cwd()}`);
      console.log(`   🔧 Node Version: ${process.version}`);
      console.log(`   💾 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
      
      // Check platform first - for non-macOS environments, return early without requiring credentials
      if (process.platform !== 'darwin') {
        console.log('');
        console.log('⚠️  PLATFORM DETECTION: Not running on macOS');
        console.log(`   Current platform: ${process.platform}`);
        console.log(`   Expected platform: darwin (macOS)`);
        console.log('');
        console.log('🔄 GITHUB ACTIONS RECOMMENDED');
        console.log('');
        console.log('✅ SOLUTION: Use GitHub Actions with macOS runners');
        console.log('   1. 🏗️  Go to: https://github.com/xueyiy/app-creator-ios/actions');
        console.log('   2. 🚀 Run "Deploy to TestFlight" workflow');
        console.log('   3. 📱 Uses real macOS runners with Xcode');
        console.log('   4. 🔨 Builds real Flutter apps');
        console.log('   5. 📤 Uploads to actual TestFlight');
        console.log('');
        console.log('💡 INFO: Frontend should automatically trigger GitHub Actions');
        console.log('   - This server endpoint should primarily be for macOS builds');
        console.log('   - Linux/Windows servers should delegate to GitHub Actions');
        console.log('');
        
        // Return a response instead of throwing an error
        return {
          success: false,
          useGitHubActions: true,
          message: 'iOS deployment requires macOS. Please use GitHub Actions for automated deployment.',
          platform: process.platform,
          githubActionsUrl: 'https://github.com/xueyiy/app-creator-ios/actions',
          debugInfo: {
            reason: 'Platform not supported for direct iOS builds',
            currentPlatform: process.platform,
            requiredPlatform: 'darwin (macOS)',
            recommendation: 'Use GitHub Actions with macOS runners'
          }
        };
      }
      
      // Check if we have the necessary credentials (only on macOS)
      console.log('');
      console.log('🔐 Validating App Store Connect credentials...');
      console.log(`   🏢 Issuer ID: ${this.issuerId ? '✅ Set (' + this.issuerId.substring(0, 8) + '...)' : '❌ Missing'}`);
      console.log(`   🔑 Key ID: ${this.keyId ? '✅ Set (' + this.keyId + ')' : '❌ Missing'}`);
      console.log(`   🔐 Private Key: ${this.privateKey ? '✅ Loaded (' + this.privateKey.length + ' chars)' : '❌ Missing'}`);
      
      if (!this.issuerId || !this.keyId || !this.privateKey) {
        console.log('❌ Credential validation failed!');
        console.log('   Missing required credentials for App Store Connect API');
        console.log('   This should not happen if GitHub Actions is being used properly.');
        throw new Error('App Store Connect API credentials not configured');
      }
      
      console.log('✅ All credentials validated successfully!');
      
      // If we're on macOS, try altool
      console.log('');
      console.log('🛠️  Checking for Xcode command line tools...');
      const { spawn } = require('child_process');
      let hasXcrun = false;
      
      try {
        await new Promise((resolve, reject) => {
          const xcrunCheck = spawn('xcrun', ['--version'], { stdio: 'pipe' });
          xcrunCheck.on('close', (code) => {
            if (code === 0) {
              hasXcrun = true;
              resolve();
            } else {
              reject(new Error('xcrun not available'));
            }
          });
          xcrunCheck.on('error', reject);
        });
        console.log('✅ Xcode command line tools available');
      } catch (error) {
        console.log('⚠️  xcrun not available, cannot upload via altool');
        console.log(`   Reason: ${error.message}`);
        hasXcrun = false;
      }
      
      if (hasXcrun) {
        console.log('🛠️  Using xcrun altool for upload...');
        return this.uploadBuildViaAltool(ipaPath, appConfig);
      } else {
        console.log('');
        console.log('❌ NO UPLOAD METHOD AVAILABLE');
        console.log('   - Platform: Not macOS (no Xcode)');
        console.log('   - Altool: Not available');
        console.log('   - GitHub Actions: Should be used by frontend');
        console.log('');
        throw new Error('Neither GitHub Actions nor local altool available for upload');
      }
      
    } catch (error) {
      console.log('');
      console.log('❌ DEPLOYMENT FAILED');
      console.log('='.repeat(80));
      console.error('❌ Error in upload process:', error.message);
      console.error('   Stack trace:', error.stack);
      console.log('='.repeat(80));
      throw error;
    }
  }

  // Original altool upload method (renamed)
  async uploadBuildViaAltool(ipaPath, appConfig) {
    try {
      console.log('📤 Starting build upload using altool...');
      
      const { spawn } = require('child_process');
      const path = require('path');
      const fs = require('fs');
      
      // Create private_keys directory in the expected location
      const privateKeysDir = path.join(process.env.HOME, 'private_keys');
      if (!fs.existsSync(privateKeysDir)) {
        fs.mkdirSync(privateKeysDir, { recursive: true });
      }
      
      // Create API key file in the expected location
      const keyPath = path.join(privateKeysDir, `AuthKey_${this.keyId}.p8`);
      fs.writeFileSync(keyPath, this.privateKey);
      
      console.log('🔐 Created API key file at:', keyPath);
      
      // Build altool command
      const altoolCommand = [
        'altool',
        '--upload-app',
        '-f', ipaPath,
        '-t', 'ios',
        '--apiKey', process.env.APP_STORE_CONNECT_KEY_ID,
        '--apiIssuer', process.env.APP_STORE_CONNECT_ISSUER_ID,
        '--show-progress'
      ];
      
      console.log('🚀 Executing altool command...');
      
      return new Promise((resolve, reject) => {
        // Set a timeout for the upload process (10 minutes)
        const uploadTimeout = setTimeout(() => {
          console.log('⏰ Upload timeout reached, terminating altool process...');
          altool.kill('SIGTERM');
          reject(new Error('Upload timeout: Process took longer than 10 minutes'));
        }, 10 * 60 * 1000); // 10 minutes
        
        const altool = spawn('xcrun', altoolCommand, {
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let output = '';
        let errorOutput = '';
        
        altool.stdout.on('data', (data) => {
          const message = data.toString();
          output += message;
          console.log('📤', message.trim());
        });
        
        altool.stderr.on('data', (data) => {
          const message = data.toString();
          errorOutput += message;
          console.log('⚠️ ', message.trim());
        });
        
        altool.on('close', (code) => {
          clearTimeout(uploadTimeout);
          
          // Clean up API key file
          try {
            fs.unlinkSync(keyPath);
            console.log('🗑️  Cleaned up API key file');
          } catch (err) {
            console.log('⚠️  Could not clean up API key file');
          }
          
          if (code === 0) {
            console.log('✅ Build upload completed successfully');
            resolve({
              id: 'build-' + Date.now(),
              status: 'uploaded',
              message: 'Build uploaded successfully via altool',
              output: output
            });
          } else {
            console.log('❌ Build upload failed with exit code:', code);
            reject(new Error(`altool failed with exit code ${code}: ${errorOutput}`));
          }
        });
        
        altool.on('error', (error) => {
          clearTimeout(uploadTimeout);
          
          // Clean up API key file
          try {
            fs.unlinkSync(keyPath);
          } catch (err) {
            // Ignore cleanup errors
          }
          
          console.log('❌ Failed to execute altool:', error.message);
          reject(error);
        });
      });
      
    } catch (error) {
      console.error('Error uploading build via altool:', error.message);
      throw error;
    }
  }

  // Get TestFlight builds
  async getBuilds() {
    try {
      const token = this.generateJWT();
      const app = await this.getAppInfo();
      
      const response = await axios.get(`${this.baseURL}/builds`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          'filter[app]': app.id,
          'sort': '-uploadedDate',
          'limit': 10
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error getting builds:', error.response?.data || error.message);
      throw error;
    }
  }

  // Create TestFlight group and send invitations
  async sendTestFlightInvitations(emails, buildId) {
    try {
      const token = this.generateJWT();
      const app = await this.getAppInfo();

      // Create beta group
      const groupResponse = await axios.post(`${this.baseURL}/betaGroups`, {
        data: {
          type: 'betaGroups',
          attributes: {
            name: `Beta Group ${Date.now()}`,
            isInternalGroup: false
          },
          relationships: {
            app: {
              data: {
                type: 'apps',
                id: app.id
              }
            }
          }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const betaGroup = groupResponse.data.data;

      // Send invitations to each email
      const invitations = [];
      for (const email of emails) {
        try {
          const inviteResponse = await axios.post(`${this.baseURL}/betaTesterInvitations`, {
            data: {
              type: 'betaTesterInvitations',
              attributes: {
                email: email
              },
              relationships: {
                betaGroup: {
                  data: {
                    type: 'betaGroups',
                    id: betaGroup.id
                  }
                }
              }
            }
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          invitations.push({
            email,
            status: 'sent',
            invitation: inviteResponse.data.data
          });
        } catch (error) {
          invitations.push({
            email,
            status: 'failed',
            error: error.response?.data?.errors?.[0]?.detail || error.message
          });
        }
      }

      return {
        betaGroup,
        invitations
      };
    } catch (error) {
      console.error('Error sending TestFlight invitations:', error.response?.data || error.message);
      throw error;
    }
  }

  // Generate TestFlight public link
  async generatePublicLink(buildId) {
    try {
      const token = this.generateJWT();
      
      // In real implementation, this would create a public link
      // For now, we'll return a simulated link
      const linkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      return {
        publicLink: `https://testflight.apple.com/join/${linkCode}`,
        linkCode,
        expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      };
    } catch (error) {
      console.error('Error generating public link:', error);
      throw error;
    }
  }

  // Clean up temporary files
  async cleanup(buildDir) {
    try {
      if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Error cleaning up:', error);
    }
  }

  // Generate improved Xcode project file with proper Flutter script references
  generateProjectPbxprojFixed(appName, bundleId) {
    const projectId = Math.random().toString(36).substring(2, 15);
    return `// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 54;
	objects = {

/* Begin PBXBuildFile section */
		1498D2341E8E89220040F4C2 /* GeneratedPluginRegistrant.m in Sources */ = {isa = PBXBuildFile; fileRef = 1498D2331E8E89220040F4C2 /* GeneratedPluginRegistrant.m */; };
		3B3967161E833CAA004F5970 /* AppFrameworkInfo.plist in Resources */ = {isa = PBXBuildFile; fileRef = 3B3967151E833CAA004F5970 /* AppFrameworkInfo.plist */; };
		74858FAF1ED2DC5600515810 /* AppDelegate.swift in Sources */ = {isa = PBXBuildFile; fileRef = 74858FAE1ED2DC5600515810 /* AppDelegate.swift */; };
		97C146FC1CF9000F007C117D /* Main.storyboard in Resources */ = {isa = PBXBuildFile; fileRef = 97C146FA1CF9000F007C117D /* Main.storyboard */; };
		97C146FE1CF9000F007C117D /* Assets.xcassets in Resources */ = {isa = PBXBuildFile; fileRef = 97C146FD1CF9000F007C117D /* Assets.xcassets */; };
		97C147011CF9000F007C117D /* LaunchScreen.storyboard in Resources */ = {isa = PBXBuildFile; fileRef = 97C146FF1CF9000F007C117D /* LaunchScreen.storyboard */; };
/* End PBXBuildFile section */

/* Begin PBXCopyFilesBuildPhase section */
		9705A1C41CF9048500538489 /* Embed Frameworks */ = {
			isa = PBXCopyFilesBuildPhase;
			buildActionMask = 2147483647;
			dstPath = "";
			dstSubfolderSpec = 10;
			files = (
			);
			name = "Embed Frameworks";
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXCopyFilesBuildPhase section */

/* Begin PBXFileReference section */
		1498D2321E8E86230040F4C2 /* GeneratedPluginRegistrant.h */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.c.h; path = GeneratedPluginRegistrant.h; sourceTree = "<group>"; };
		1498D2331E8E89220040F4C2 /* GeneratedPluginRegistrant.m */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = sourcecode.c.objc; path = GeneratedPluginRegistrant.m; sourceTree = "<group>"; };
		3B3967151E833CAA004F5970 /* AppFrameworkInfo.plist */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = text.plist.xml; name = AppFrameworkInfo.plist; path = Flutter/AppFrameworkInfo.plist; sourceTree = "<group>"; };
		74858FAD1ED2DC5600515810 /* Runner-Bridging-Header.h */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.c.h; path = "Runner-Bridging-Header.h"; sourceTree = "<group>"; };
		74858FAE1ED2DC5600515810 /* AppDelegate.swift */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = sourcecode.swift; path = AppDelegate.swift; sourceTree = "<group>"; };
		7AFA3C8E1D35360C0083082E /* Release.xcconfig */ = {isa = PBXFileReference; lastKnownFileType = text.xcconfig; name = Release.xcconfig; path = Flutter/Release.xcconfig; sourceTree = "<group>"; };
		9740EEB21CF90195004384FC /* Debug.xcconfig */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = text.xcconfig; name = Debug.xcconfig; path = Flutter/Debug.xcconfig; sourceTree = "<group>"; };
		9740EEB31CF90195004384FC /* Generated.xcconfig */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = text.xcconfig; name = Generated.xcconfig; path = Flutter/Generated.xcconfig; sourceTree = "<group>"; };
		97C146EE1CF9000F007C117D /* Runner.app */ = {isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = Runner.app; sourceTree = BUILT_PRODUCTS_DIR; };
		97C146FB1CF9000F007C117D /* Base */ = {isa = PBXFileReference; lastKnownFileType = file.storyboard; name = Base; path = Base.lproj/Main.storyboard; sourceTree = "<group>"; };
		97C146FD1CF9000F007C117D /* Assets.xcassets */ = {isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>"; };
		97C147001CF9000F007C117D /* Base */ = {isa = PBXFileReference; lastKnownFileType = file.storyboard; name = Base; path = Base.lproj/LaunchScreen.storyboard; sourceTree = "<group>"; };
		97C147021CF9000F007C117D /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; };
/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
		97C146EB1CF9000F007C117D /* Frameworks */ = {
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
		9740EEB11CF90186004384FC /* Flutter */ = {
			isa = PBXGroup;
			children = (
				3B3967151E833CAA004F5970 /* AppFrameworkInfo.plist */,
				9740EEB21CF90195004384FC /* Debug.xcconfig */,
				7AFA3C8E1D35360C0083082E /* Release.xcconfig */,
				9740EEB31CF90195004384FC /* Generated.xcconfig */,
			);
			name = Flutter;
			sourceTree = "<group>";
		};
		97C146E51CF9000F007C117D = {
			isa = PBXGroup;
			children = (
				9740EEB11CF90186004384FC /* Flutter */,
				97C146F01CF9000F007C117D /* Runner */,
				97C146EF1CF9000F007C117D /* Products */,
			);
			sourceTree = "<group>";
		};
		97C146EF1CF9000F007C117D /* Products */ = {
			isa = PBXGroup;
			children = (
				97C146EE1CF9000F007C117D /* Runner.app */,
			);
			name = Products;
			sourceTree = "<group>";
		};
		97C146F01CF9000F007C117D /* Runner */ = {
			isa = PBXGroup;
			children = (
				97C146FA1CF9000F007C117D /* Main.storyboard */,
				97C146FD1CF9000F007C117D /* Assets.xcassets */,
				97C146FF1CF9000F007C117D /* LaunchScreen.storyboard */,
				97C147021CF9000F007C117D /* Info.plist */,
				1498D2321E8E86230040F4C2 /* GeneratedPluginRegistrant.h */,
				1498D2331E8E89220040F4C2 /* GeneratedPluginRegistrant.m */,
				74858FAE1ED2DC5600515810 /* AppDelegate.swift */,
				74858FAD1ED2DC5600515810 /* Runner-Bridging-Header.h */,
			);
			path = Runner;
			sourceTree = "<group>";
		};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
		97C146ED1CF9000F007C117D /* Runner */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = 97C147051CF9000F007C117D /* Build configuration list for PBXNativeTarget "Runner" */;
			buildPhases = (
				9740EEB61CF901F6004384FC /* Run Script */,
				97C146EA1CF9000F007C117D /* Sources */,
				97C146EB1CF9000F007C117D /* Frameworks */,
				97C146EC1CF9000F007C117D /* Resources */,
				9705A1C41CF9048500538489 /* Embed Frameworks */,
				3B06AD1E1E4923F5004D2608 /* Thin Binary */,
			);
			buildRules = (
			);
			dependencies = (
			);
			name = Runner;
			productName = Runner;
			productReference = 97C146EE1CF9000F007C117D /* Runner.app */;
			productType = "com.apple.product-type.application";
		};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
		97C146E61CF9000F007C117D /* Project object */ = {
			isa = PBXProject;
			attributes = {
				LastUpgradeCheck = 1300;
				ORGANIZATIONNAME = "App Creator";
				TargetAttributes = {
					97C146ED1CF9000F007C117D = {
						CreatedOnToolsVersion = 7.3.1;
						LastSwiftMigration = 0910;
					};
				};
			};
			buildConfigurationList = 97C146E91CF9000F007C117D /* Build configuration list for PBXProject "Runner" */;
			compatibilityVersion = "Xcode 9.3";
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				en,
				Base,
			);
			mainGroup = 97C146E51CF9000F007C117D;
			productRefGroup = 97C146EF1CF9000F007C117D /* Products */;
			projectDirPath = "";
			projectRoot = "";
			targets = (
				97C146ED1CF9000F007C117D /* Runner */,
			);
		};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
		97C146EC1CF9000F007C117D /* Resources */ = {
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				97C147011CF9000F007C117D /* LaunchScreen.storyboard in Resources */,
				3B3967161E833CAA004F5970 /* AppFrameworkInfo.plist in Resources */,
				97C146FE1CF9000F007C117D /* Assets.xcassets in Resources */,
				97C146FC1CF9000F007C117D /* Main.storyboard in Resources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXResourcesBuildPhase section */

/* Begin PBXShellScriptBuildPhase section */
		3B06AD1E1E4923F5004D2608 /* Thin Binary */ = {
			isa = PBXShellScriptBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			inputPaths = (
			);
			name = "Thin Binary";
			outputPaths = (
			);
			runOnlyForDeploymentPostprocessing = 0;
			shellPath = /bin/sh;
			shellScript = "\\"\\$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh\\" embed_and_thin";
		};
		9740EEB61CF901F6004384FC /* Run Script */ = {
			isa = PBXShellScriptBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			inputPaths = (
			);
			name = "Run Script";
			outputPaths = (
			);
			runOnlyForDeploymentPostprocessing = 0;
			shellPath = /bin/sh;
			shellScript = "\\"\\$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh\\" build";
		};
/* End PBXShellScriptBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
		97C146EA1CF9000F007C117D /* Sources */ = {
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				74858FAF1ED2DC5600515810 /* AppDelegate.swift in Sources */,
				1498D2341E8E89220040F4C2 /* GeneratedPluginRegistrant.m in Sources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXSourcesBuildPhase section */

/* Begin PBXVariantGroup section */
		97C146FA1CF9000F007C117D /* Main.storyboard */ = {
			isa = PBXVariantGroup;
			children = (
				97C146FB1CF9000F007C117D /* Base */,
			);
			name = Main.storyboard;
			sourceTree = "<group>";
		};
		97C146FF1CF9000F007C117D /* LaunchScreen.storyboard */ = {
			isa = PBXVariantGroup;
			children = (
				97C147001CF9000F007C117D /* Base */,
			);
			name = LaunchScreen.storyboard;
			sourceTree = "<group>";
		};
/* End PBXVariantGroup section */

/* Begin XCBuildConfiguration section */
		249021D3217E4FDB00AE95B9 /* Profile */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ALWAYS_SEARCH_USER_PATHS = NO;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_CXX_LANGUAGE_STANDARD = "gnu++0x";
				CLANG_CXX_LIBRARY = "libc++";
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
				CLANG_WARN_BOOL_CONVERSION = YES;
				CLANG_WARN_COMMA = YES;
				CLANG_WARN_CONSTANT_CONVERSION = YES;
				CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES;
				CLANG_WARN_DIRECT_OBJC_ISA_USAGE = YES_ERROR;
				CLANG_WARN_EMPTY_BODY = YES;
				CLANG_WARN_ENUM_CONVERSION = YES;
				CLANG_WARN_INFINITE_RECURSION = YES;
				CLANG_WARN_INT_CONVERSION = YES;
				CLANG_WARN_NON_LITERAL_NULL_CONVERSION = YES;
				CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES;
				CLANG_WARN_OBJC_LITERAL_CONVERSION = YES;
				CLANG_WARN_OBJC_ROOT_CLASS = YES_ERROR;
				CLANG_WARN_RANGE_LOOP_ANALYSIS = YES;
				CLANG_WARN_STRICT_PROTOTYPES = YES;
				CLANG_WARN_SUSPICIOUS_MOVE = YES;
				CLANG_WARN_UNREACHABLE_CODE = YES;
				CLANG_WARN__DUPLICATE_METHOD_MATCH = YES;
				"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "iPhone Developer";
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
				ENABLE_NS_ASSERTIONS = NO;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				GCC_C_LANGUAGE_STANDARD = gnu99;
				GCC_NO_COMMON_BLOCKS = YES;
				GCC_WARN_64_TO_32_BIT_CONVERSION = YES;
				GCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
				GCC_WARN_UNDECLARED_SELECTOR = YES;
				GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
				GCC_WARN_UNUSED_FUNCTION = YES;
				GCC_WARN_UNUSED_VARIABLE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 12.0;
				MTL_ENABLE_DEBUG_INFO = NO;
				SDKROOT = iphoneos;
				SUPPORTED_PLATFORMS = iphoneos;
				TARGETED_DEVICE_FAMILY = "1,2";
				VALIDATE_PRODUCT = YES;
			};
			name = Profile;
		};
		249021D4217E4FDB00AE95B9 /* Profile */ = {
			isa = XCBuildConfiguration;
			baseConfigurationReference = 7AFA3C8E1D35360C0083082E /* Release.xcconfig */;
			buildSettings = {
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				CLANG_ENABLE_MODULES = YES;
				CURRENT_PROJECT_VERSION = "$(FLUTTER_BUILD_NUMBER)";
				MARKETING_VERSION = "$(FLUTTER_BUILD_NAME)";
				ENABLE_BITCODE = NO;
				INFOPLIST_FILE = Runner/Info.plist;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				PRODUCT_BUNDLE_IDENTIFIER = ${bundleId};
				PRODUCT_NAME = "$(TARGET_NAME)";
				SWIFT_OBJC_BRIDGING_HEADER = "Runner/Runner-Bridging-Header.h";
				SWIFT_VERSION = 5.0;
				VERSIONING_SYSTEM = "apple-generic";
			};
			name = Profile;
		};
		97C147031CF9000F007C117D /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ALWAYS_SEARCH_USER_PATHS = NO;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_CXX_LANGUAGE_STANDARD = "gnu++0x";
				CLANG_CXX_LIBRARY = "libc++";
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
				CLANG_WARN_BOOL_CONVERSION = YES;
				CLANG_WARN_COMMA = YES;
				CLANG_WARN_CONSTANT_CONVERSION = YES;
				CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES;
				CLANG_WARN_DIRECT_OBJC_ISA_USAGE = YES_ERROR;
				CLANG_WARN_EMPTY_BODY = YES;
				CLANG_WARN_ENUM_CONVERSION = YES;
				CLANG_WARN_INFINITE_RECURSION = YES;
				CLANG_WARN_INT_CONVERSION = YES;
				CLANG_WARN_NON_LITERAL_NULL_CONVERSION = YES;
				CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES;
				CLANG_WARN_OBJC_LITERAL_CONVERSION = YES;
				CLANG_WARN_OBJC_ROOT_CLASS = YES_ERROR;
				CLANG_WARN_RANGE_LOOP_ANALYSIS = YES;
				CLANG_WARN_STRICT_PROTOTYPES = YES;
				CLANG_WARN_SUSPICIOUS_MOVE = YES;
				CLANG_WARN_UNREACHABLE_CODE = YES;
				CLANG_WARN__DUPLICATE_METHOD_MATCH = YES;
				"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "iPhone Developer";
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = dwarf;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				ENABLE_TESTABILITY = YES;
				GCC_C_LANGUAGE_STANDARD = gnu99;
				GCC_DYNAMIC_NO_PIC = NO;
				GCC_NO_COMMON_BLOCKS = YES;
				GCC_OPTIMIZATION_LEVEL = 0;
				GCC_PREPROCESSOR_DEFINITIONS = (
					"DEBUG=1",
					"$(inherited)",
				);
				GCC_WARN_64_TO_32_BIT_CONVERSION = YES;
				GCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
				GCC_WARN_UNDECLARED_SELECTOR = YES;
				GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
				GCC_WARN_UNUSED_FUNCTION = YES;
				GCC_WARN_UNUSED_VARIABLE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 12.0;
				MTL_ENABLE_DEBUG_INFO = YES;
				ONLY_ACTIVE_ARCH = YES;
				SDKROOT = iphoneos;
				TARGETED_DEVICE_FAMILY = "1,2";
			};
			name = Debug;
		};
		97C147041CF9000F007C117D /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ALWAYS_SEARCH_USER_PATHS = NO;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_CXX_LANGUAGE_STANDARD = "gnu++0x";
				CLANG_CXX_LIBRARY = "libc++";
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
				CLANG_WARN_BOOL_CONVERSION = YES;
				CLANG_WARN_COMMA = YES;
				CLANG_WARN_CONSTANT_CONVERSION = YES;
				CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES;
				CLANG_WARN_DIRECT_OBJC_ISA_USAGE = YES_ERROR;
				CLANG_WARN_EMPTY_BODY = YES;
				CLANG_WARN_ENUM_CONVERSION = YES;
				CLANG_WARN_INFINITE_RECURSION = YES;
				CLANG_WARN_INT_CONVERSION = YES;
				CLANG_WARN_NON_LITERAL_NULL_CONVERSION = YES;
				CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES;
				CLANG_WARN_OBJC_LITERAL_CONVERSION = YES;
				CLANG_WARN_OBJC_ROOT_CLASS = YES_ERROR;
				CLANG_WARN_RANGE_LOOP_ANALYSIS = YES;
				CLANG_WARN_STRICT_PROTOTYPES = YES;
				CLANG_WARN_SUSPICIOUS_MOVE = YES;
				CLANG_WARN_UNREACHABLE_CODE = YES;
				CLANG_WARN__DUPLICATE_METHOD_MATCH = YES;
				"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "iPhone Developer";
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
				ENABLE_NS_ASSERTIONS = NO;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				GCC_C_LANGUAGE_STANDARD = gnu99;
				GCC_NO_COMMON_BLOCKS = YES;
				GCC_WARN_64_TO_32_BIT_CONVERSION = YES;
				GCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
				GCC_WARN_UNDECLARED_SELECTOR = YES;
				GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
				GCC_WARN_UNUSED_FUNCTION = YES;
				GCC_WARN_UNUSED_VARIABLE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 12.0;
				MTL_ENABLE_DEBUG_INFO = NO;
				SDKROOT = iphoneos;
				SWIFT_COMPILATION_MODE = wholemodule;
				SWIFT_OPTIMIZATION_LEVEL = "-O";
				TARGETED_DEVICE_FAMILY = "1,2";
				VALIDATE_PRODUCT = YES;
			};
			name = Release;
		};
		97C147061CF9000F007C117D /* Debug */ = {
			isa = XCBuildConfiguration;
			baseConfigurationReference = 9740EEB21CF90195004384FC /* Debug.xcconfig */;
			buildSettings = {
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				CLANG_ENABLE_MODULES = YES;
				CURRENT_PROJECT_VERSION = "$(FLUTTER_BUILD_NUMBER)";
				ENABLE_BITCODE = NO;
				INFOPLIST_FILE = Runner/Info.plist;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				PRODUCT_BUNDLE_IDENTIFIER = ${bundleId};
				PRODUCT_NAME = "$(TARGET_NAME)";
				SWIFT_OBJC_BRIDGING_HEADER = "Runner/Runner-Bridging-Header.h";
				SWIFT_OPTIMIZATION_LEVEL = "-Onone";
				SWIFT_VERSION = 5.0;
				VERSIONING_SYSTEM = "apple-generic";
			};
			name = Debug;
		};
		97C147071CF9000F007C117D /* Release */ = {
			isa = XCBuildConfiguration;
			baseConfigurationReference = 7AFA3C8E1D35360C0083082E /* Release.xcconfig */;
			buildSettings = {
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				CLANG_ENABLE_MODULES = YES;
				CURRENT_PROJECT_VERSION = "$(FLUTTER_BUILD_NUMBER)";
				ENABLE_BITCODE = NO;
				INFOPLIST_FILE = Runner/Info.plist;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				PRODUCT_BUNDLE_IDENTIFIER = ${bundleId};
				PRODUCT_NAME = "$(TARGET_NAME)";
				SWIFT_OBJC_BRIDGING_HEADER = "Runner/Runner-Bridging-Header.h";
				SWIFT_VERSION = 5.0;
				VERSIONING_SYSTEM = "apple-generic";
			};
			name = Release;
		};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
		97C146E91CF9000F007C117D /* Build configuration list for PBXProject "Runner" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				97C147031CF9000F007C117D /* Debug */,
				97C147041CF9000F007C117D /* Release */,
				249021D3217E4FDB00AE95B9 /* Profile */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		};
		97C147051CF9000F007C117D /* Build configuration list for PBXNativeTarget "Runner" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				97C147061CF9000F007C117D /* Debug */,
				97C147071CF9000F007C117D /* Release */,
				249021D4217E4FDB00AE95B9 /* Profile */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		};
/* End XCConfigurationList section */
	};
	rootObject = 97C146E61CF9000F007C117D /* Project object */;
}
`;
  }

  // Generate improved app icon contents with better default handling
  generateAppIconContentsFixed() {
    return `{
  "images" : [
    { "idiom" : "iphone", "scale" : "2x", "size" : "20x20", "filename": "Icon-App-20x20@2x.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "20x20", "filename": "Icon-App-20x20@3x.png" },
    { "idiom" : "iphone", "scale" : "2x", "size" : "29x29", "filename": "Icon-App-29x29@2x.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "29x29", "filename": "Icon-App-29x29@3x.png" },
    { "idiom" : "iphone", "scale" : "2x", "size" : "40x40", "filename": "Icon-App-40x40@2x.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "40x40", "filename": "Icon-App-40x40@3x.png" },
    { "idiom" : "iphone", "scale" : "2x", "size" : "60x60", "filename": "Icon-App-60x60@2x.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "60x60", "filename": "Icon-App-60x60@3x.png" },

    { "idiom" : "ipad", "scale" : "1x", "size" : "20x20", "filename": "Icon-App-20x20@1x~ipad.png" },
    { "idiom" : "ipad", "scale" : "2x", "size" : "20x20", "filename": "Icon-App-20x20@2x~ipad.png" },
    { "idiom" : "ipad", "scale" : "1x", "size" : "29x29", "filename": "Icon-App-29x29@1x~ipad.png" },
    { "idiom" : "ipad", "scale" : "2x", "size" : "29x29", "filename": "Icon-App-29x29@2x~ipad.png" },
    { "idiom" : "ipad", "scale" : "1x", "size" : "40x40", "filename": "Icon-App-40x40@1x~ipad.png" },
    { "idiom" : "ipad", "scale" : "2x", "size" : "40x40", "filename": "Icon-App-40x40@2x~ipad.png" },
    { "idiom" : "ipad", "scale" : "1x", "size" : "76x76", "filename": "Icon-App-76x76@1x~ipad.png" },
    { "idiom" : "ipad", "scale" : "2x", "size" : "76x76", "filename": "Icon-App-76x76@2x~ipad.png" },
    { "idiom" : "ipad", "scale" : "2x", "size" : "83.5x83.5", "filename": "Icon-App-83.5x83.5@2x~ipad.png" },

    { "idiom" : "ios-marketing", "scale" : "1x", "size" : "1024x1024", "filename": "Icon-App-1024x1024@1x.png" }
  ],
  "info" : { "author" : "xcode", "version" : 1 },
  "properties" : { "pre-rendered" : true }
}
`;
  }

  // Generate Flutter environment setup script
  generateFlutterSetupScript() {
    return `#!/bin/bash
# Flutter Environment Setup Script
# This script configures the Flutter project to work with any Flutter installation

set -e

echo "🔧 Setting up Flutter environment for App Creator project..."

# Function to find Flutter installation
find_flutter() {
    if command -v flutter &> /dev/null; then
        FLUTTER_BIN=$(which flutter)
        export FLUTTER_ROOT=$(dirname $(dirname $FLUTTER_BIN))
        echo "✅ Found Flutter at: $FLUTTER_ROOT"
        return 0
    fi
    
    # Check common Flutter installation paths
    for path in "$HOME/flutter" "$HOME/development/flutter" "/usr/local/flutter" "/opt/flutter"; do
        if [ -d "$path" ] && [ -f "$path/bin/flutter" ]; then
            export FLUTTER_ROOT="$path"
            export PATH="$FLUTTER_ROOT/bin:$PATH"
            echo "✅ Found Flutter at: $FLUTTER_ROOT"
            return 0
        fi
    done
    
    echo "❌ Flutter not found. Please install Flutter first:"
    echo "   Visit: https://docs.flutter.dev/get-started/install"
    return 1
}

# Function to update Generated.xcconfig
update_xcconfig() {
    local flutter_root="$1"
    local app_path="$2"
    
    echo "🔧 Updating Generated.xcconfig..."
    
    cat > ios/Flutter/Generated.xcconfig << EOF
// This is a generated file; do not edit or check into version control.
FLUTTER_ROOT=$flutter_root
FLUTTER_APPLICATION_PATH=$app_path
COCOAPODS_PARALLEL_CODE_SIGN=true
FLUTTER_TARGET=lib/main.dart
FLUTTER_BUILD_DIR=build
FLUTTER_BUILD_NAME=1.0.0
FLUTTER_BUILD_NUMBER=1
EXCLUDED_ARCHS[sdk=iphonesimulator*]=i386
EXCLUDED_ARCHS[sdk=iphoneos*]=armv7
DART_OBFUSCATION=false
TRACK_WIDGET_CREATION=true
TREE_SHAKE_ICONS=false
PACKAGE_CONFIG=.dart_tool/package_config.json
EOF
    
    echo "✅ Updated Generated.xcconfig"
}

# Function to fix Xcode project paths
fix_xcode_project() {
    local flutter_root="$1"
    
    if [ -f "ios/Runner.xcodeproj/project.pbxproj" ]; then
        echo "🔧 Fixing Xcode project Flutter paths..."
        
        # Backup original file
        cp ios/Runner.xcodeproj/project.pbxproj ios/Runner.xcodeproj/project.pbxproj.backup
        
        # Replace hardcoded paths with environment variables
        sed -i '' 's|/usr/local/flutter|"$FLUTTER_ROOT"|g' ios/Runner.xcodeproj/project.pbxproj
        sed -i '' 's|/Users/.*/flutter|"$FLUTTER_ROOT"|g' ios/Runner.xcodeproj/project.pbxproj
        sed -i '' 's|/usr/local/bin/flutter/packages/flutter_tools/bin/xcode_backend.sh|"$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh"|g' ios/Runner.xcodeproj/project.pbxproj
        
        echo "✅ Fixed Xcode project paths"
    fi
}

# Main setup process
main() {
    echo "🚀 App Creator Flutter Project Setup"
    echo "======================================"
    
    # Check if we're in a Flutter project
    if [ ! -f "pubspec.yaml" ]; then
        echo "❌ Not in a Flutter project directory. Please run this from the project root."
        exit 1
    fi
    
    # Find Flutter installation
    if ! find_flutter; then
        exit 1
    fi
    
    # Set application path
    export FLUTTER_APPLICATION_PATH=$(pwd)
    
    # Update configuration files
    update_xcconfig "$FLUTTER_ROOT" "$FLUTTER_APPLICATION_PATH"
    fix_xcode_project "$FLUTTER_ROOT"
    
    # Run Flutter doctor to check setup
    echo "🏥 Running Flutter doctor..."
    flutter doctor
    
    # Get dependencies
    echo "📦 Getting Flutter dependencies..."
    flutter pub get
    
    # Generate iOS dependencies
    if [ -d "ios" ]; then
        echo "🍎 Setting up iOS dependencies..."
        cd ios
        if command -v pod &> /dev/null; then
            pod install
        else
            echo "⚠️  CocoaPods not found. Install with: sudo gem install cocoapods"
        fi
        cd ..
    fi
    
    echo ""
    echo "✅ Flutter environment setup complete!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Open ios/Runner.xcworkspace in Xcode"
    echo "   2. Configure signing in Xcode"
    echo "   3. Build and run: flutter run"
    echo "   4. For App Store: flutter build ios --release"
    echo ""
    echo "🔧 Environment variables set:"
    echo "   FLUTTER_ROOT=$FLUTTER_ROOT"
    echo "   FLUTTER_APPLICATION_PATH=$FLUTTER_APPLICATION_PATH"
}

# Run main function
main "$@"
`;
  }

  // Update Flutter app with current project data
  async updateFlutterApp(flutterProjectPath, appConfig, buildNumber, version) {
    const path = require('path');
    const fs = require('fs');
    
    console.log('📝 Updating Flutter app files...');
    
    // Update pubspec.yaml with version info
    const pubspecPath = path.join(flutterProjectPath, 'pubspec.yaml');
    let pubspecContent = fs.readFileSync(pubspecPath, 'utf8');
    
    // Update version and build number
    pubspecContent = pubspecContent.replace(
      /version:\s*[\d\.]+\+[\d]+/,
      `version: ${version}+${buildNumber}`
    );
    
    fs.writeFileSync(pubspecPath, pubspecContent);
    console.log('✅ Updated pubspec.yaml with version:', `${version}+${buildNumber}`);
    
    // Create lib directory if it doesn't exist
    const libDir = path.join(flutterProjectPath, 'lib');
    if (!fs.existsSync(libDir)) {
      fs.mkdirSync(libDir, { recursive: true });
    }
    
    // Update lib/main.dart with app content
    const mainDartPath = path.join(flutterProjectPath, 'lib', 'main.dart');
    const mainDartContent = this.generateMainDart(appConfig);
    fs.writeFileSync(mainDartPath, mainDartContent);
    console.log('✅ Updated lib/main.dart');
    
    // Note: No longer need screens_data.dart since components are rendered directly in main.dart
    
    // Create assets directory if it doesn't exist
    const assetsDir = path.join(flutterProjectPath, 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Create assets/app_config.json
    const appConfigPath = path.join(flutterProjectPath, 'assets', 'app_config.json');
    fs.writeFileSync(appConfigPath, JSON.stringify(appConfig, null, 2));
    console.log('✅ Updated assets/app_config.json');
    
    console.log('✅ Updated Flutter app with project data');
  }

  // Build Flutter IPA
  async buildFlutterIPA(flutterProjectPath, buildDir, appName, buildNumber) {
    const { spawn } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    
    console.log('📦 Running flutter build ios --release...');
    
    // Step 1: Run flutter build ios
    await new Promise((resolve, reject) => {
      const flutterBuild = spawn('flutter', ['build', 'ios', '--release'], {
        cwd: flutterProjectPath,
        stdio: 'pipe'
      });
      
      flutterBuild.stdout.on('data', (data) => {
        const message = data.toString();
        console.log('🔨', message.trim());
      });
      
      flutterBuild.stderr.on('data', (data) => {
        const message = data.toString();
        console.log('⚠️ ', message.trim());
      });
      
      flutterBuild.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Flutter build completed');
          resolve();
        } else {
          reject(new Error(`Flutter build failed with code ${code}`));
        }
      });
    });
    
    // Step 2: Create exportOptions.plist for App Store distribution with manual signing
    const exportOptionsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store</string>
  <key>teamID</key>
  <string>${process.env.APPLE_TEAM_ID}</string>
  <key>uploadBitcode</key>
  <false/>
  <key>uploadSymbols</key>
  <true/>
  <key>compileBitcode</key>
  <false/>
  <key>manageAppVersionAndBuildNumber</key>
  <true/>
  <key>destination</key>
  <string>export</string>
  <key>signingStyle</key>
  <string>manual</string>
  <key>signingCertificate</key>
  <string>Apple Distribution: SHO Technologies Inc. (GD7UT9D9NY)</string>
  <key>provisioningProfiles</key>
  <dict>
    <key>com.visios.nocode</key>
    <string>noCodeApp App Store Profile</string>
  </dict>
</dict>
</plist>`;
    
    const exportOptionsPath = path.join(buildDir, 'exportOptions.plist');
    fs.writeFileSync(exportOptionsPath, exportOptionsContent);
    
    console.log('📦 Archiving with xcodebuild...');
    
    // Step 3: Archive for App Store distribution (FIXED: Use proper destination)
    const archivePath = path.join(flutterProjectPath, 'build', 'Runner.xcarchive');
    await new Promise((resolve, reject) => {
      const archiveCmd = [
        'archive',
        '-workspace', path.join(flutterProjectPath, 'ios', 'Runner.xcworkspace'),
        '-scheme', 'Runner',
        '-archivePath', archivePath,
        '-configuration', 'Release',
        '-destination', 'generic/platform=iOS',  // This is the key fix!
        'CODE_SIGN_STYLE=Automatic'
      ];
      
      console.log('🏗️  Command line invocation:');
      console.log('🏗️ ', '/Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild', archiveCmd.join(' '));
      
      const xcodebuild = spawn('xcodebuild', archiveCmd, {
        stdio: 'pipe'
      });
      
      xcodebuild.stdout.on('data', (data) => {
        const message = data.toString();
        console.log('🏗️ ', message.trim());
      });
      
      xcodebuild.stderr.on('data', (data) => {
        const message = data.toString();
        console.log('⚠️ ', message.trim());
      });
      
      xcodebuild.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Archive created successfully');
          resolve();
        } else {
          console.log('❌ Archive failed with code:', code);
          reject(new Error(`xcodebuild archive failed with code ${code}`));
        }
      });
    });
    
    console.log('📦 Exporting IPA...');
    
    // Step 4: Export archive to IPA
    const ipaDir = path.join(buildDir, 'ipa');
    fs.mkdirSync(ipaDir, { recursive: true });
    
    await new Promise((resolve, reject) => {
      const exportCmd = [
        '-exportArchive',
        '-archivePath', archivePath,
        '-exportPath', ipaDir,
        '-exportOptionsPlist', exportOptionsPath
      ];
      
      const xcodebuildExport = spawn('xcodebuild', exportCmd, {
        stdio: 'pipe'
      });
      
      xcodebuildExport.stdout.on('data', (data) => {
        const message = data.toString();
        console.log('📤', message.trim());
      });
      
      xcodebuildExport.stderr.on('data', (data) => {
        const message = data.toString();
        console.log('⚠️ ', message.trim());
      });
      
      xcodebuildExport.on('close', (code) => {
        if (code === 0) {
          console.log('✅ IPA export completed');
          resolve();
        } else {
          reject(new Error(`xcodebuild export failed with code ${code}`));
        }
      });
    });
    
    // Step 5: Find the generated IPA file
    console.log('🔍 Looking for IPA files in:', ipaDir);
    
    // List all files in the export directory
    const allFiles = fs.readdirSync(ipaDir, { recursive: true });
    console.log('📁 Files found in export directory:', allFiles);
    
    // Look for IPA files (they might be in subdirectories)
    const ipaFiles = allFiles.filter(file => file.toString().endsWith('.ipa'));
    console.log('📱 IPA files found:', ipaFiles);
    
    if (ipaFiles.length === 0) {
      // Try to look in common subdirectories
      const possibleDirs = ['Apps', 'Products', 'DistributionSummary'];
      let foundIPA = null;
      
      for (const subDir of possibleDirs) {
        const subDirPath = path.join(ipaDir, subDir);
        if (fs.existsSync(subDirPath)) {
          console.log('🔍 Checking subdirectory:', subDirPath);
          const subFiles = fs.readdirSync(subDirPath);
          console.log('📁 Files in', subDir, ':', subFiles);
          const subIpaFiles = subFiles.filter(file => file.endsWith('.ipa'));
          if (subIpaFiles.length > 0) {
            foundIPA = path.join(subDirPath, subIpaFiles[0]);
            console.log('✅ Found IPA in subdirectory:', foundIPA);
            break;
          }
        }
      }
      
      if (!foundIPA) {
        throw new Error(`No IPA file found after export. Files found: ${allFiles.join(', ')}`);
      }
      
      console.log(`✅ Real Flutter IPA created: ${foundIPA}`);
      return foundIPA;
    }
    
    const ipaPath = path.join(ipaDir, ipaFiles[0]);
    console.log(`✅ Real Flutter IPA created: ${ipaPath}`);
    
    return ipaPath;
  }
}

module.exports = TestFlightService; 