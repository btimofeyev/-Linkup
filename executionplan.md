UPDATED Linkup App - Clean EAS Build Setup Execution Plan
After reviewing the current documentation, I need to update several critical sections:

Phase 1: Clean EAS Configuration (20 minutes)
2.1 Remove All Build-Related Files
bashcd linkup
rm -f eas.json
rm -rf .expo/
rm -rf node_modules/
rm -f package-lock.json
rm -f yarn.lock
1.2 Clean app.json - Remove Build Configs
Edit app.json and remove:

 All ios.buildNumber references
 All android.versionCode references
 Any expo-build-properties plugin configs
 Any complex plugin configurations
 Keep only basic app info, name, slug, version

1.3 Reset to Stable Dependencies
CORRECTED VERSIONS based on latest documentation:
json{
  "dependencies": {
    "expo": "~52.0.0",
    "react": "18.3.1",
    "react-native": "0.76.1",
    "@react-navigation/native": "^6.1.7",
    "@react-navigation/bottom-tabs": "^6.5.8",
    "@react-navigation/stack": "^6.3.17",
    "@supabase/supabase-js": "^2.38.0",
    "expo-contacts": "~13.0.5",
    "expo-location": "~18.0.2",
    "expo-status-bar": "~2.0.0",
    "@react-native-async-storage/async-storage": "1.23.1",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "4.0.0-beta.16"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.3.12",
    "typescript": "~5.3.3"
  }
}
Phase 2: Fresh Installation (10 minutes)
2.1 Install Dependencies
bashnpm install
2.2 Verify Local Development Still Works
bashnpx expo start
# Test on device/simulator
# Verify all core features work
2.3 Fix Any Breaking Changes

 Update imports if needed
 Fix any TypeScript errors
 Test authentication flow
 Test core app navigation

Phase 3: EAS Clean Setup (15 minutes)
3.1 Initialize Fresh EAS Config
bashnpx eas build:configure
3.2 Create Minimal eas.json CORRECTED VERSION
json{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
4.3 Update app.json for EAS CORRECTED VERSION
json{
  "expo": {
    "name": "Linkup",
    "slug": "linkup",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/link_logo.png",
      "resizeMode": "contain",
      "backgroundColor": "#FFF8F0"
    },
    "ios": {
      "bundleIdentifier": "com.linkupsocial.app",
      "supportsTablet": true
    },
    "android": {
      "package": "com.linkupsocial.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "plugins": [
      "expo-contacts"
    ],
    "extra": {
      "eas": {
        "projectId": "31f0ed9f-a73c-4faf-94ee-e7b2e08bad7d"
      }
    }
  }
}
Phase 4: Test Builds (30 minutes)
4.1 Android Development Build
bashnpx eas build --platform android --profile development

 Wait for build completion
 Download and test on device
 Verify all features work

4.2 Android Preview Build (APK)
bashnpx eas build --platform android --profile preview

 Test APK installation
 Verify app functionality

4.3 iOS Development Build
bashnpx eas build --platform ios --profile development

 Wait for build completion
 Test on iOS device/simulator

Phase 5: Production Builds (20 minutes)
5.1 Android Production (AAB)
bashnpx eas build --platform android --profile production
5.2 iOS Production
bashnpx eas build --platform ios --profile production
CRITICAL CORRECTIONS

Expo SDK Version: Use 52.0.0 (latest stable) instead of 51.0.0
React Native Version: Use 0.76.1 which is compatible with SDK 52
React Version: Use 18.3.1 instead of 18.2.0
EAS CLI Version: Must be >= 5.0.0 for SDK 52
New Architecture: SDK 52 has New Architecture enabled by default - if issues arise, add "newArchEnabled": false to app.json

IMPORTANT NOTES

SDK 52 Breaking Changes: New Architecture is enabled by default
iOS Deployment Target: Minimum iOS 15.1 (up from 13.4)
Android SDK: compileSdkVersion bumped to 35
Package Compatibility: Many packages have breaking changes between SDK 51 and 52

Troubleshooting Checkpoints
If New Architecture Issues:
Add to app.json:
json{
  "expo": {
    "newArchEnabled": false
  }
}
If Dependency Conflicts:
Use the exclude option in package.json:
json{
  "expo": {
    "install": {
      "exclude": ["react-native", "react"]
    }
  }
}
Success Criteria

 Android AAB builds successfully with SDK 52
 iOS IPA builds successfully with SDK 52
 App installs and runs on devices
 All core features work in built app
 Backend connectivity maintained
 Authentication flow works
 Navigation functions properly


Estimated Total Time: 2 hours
Key Success Factor: SDK 52 is a major update with New Architecture enabled by default. Be prepared for potential breaking changes and have the option to disable New Architecture if needed.