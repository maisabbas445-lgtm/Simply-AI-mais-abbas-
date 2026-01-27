{
  "expo": {
    "name": "Simply AI",
    "slug": "simply-ai-2026",
    "version": "3.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "cover",
      "backgroundColor": "#667eea"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.maisabbas.simplyai",
      "buildNumber": "3.0.0",
      "infoPlist": {
        "NSCameraUsageDescription": "We need access to your camera for image analysis",
        "NSMicrophoneUsageDescription": "We need access to your microphone for voice recognition",
        "LSApplicationQueriesSchemes": ["whatsapp", "telegram", "instagram"]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#667eea"
      },
      "package": "com.maisabbas.simplyai",
      "versionCode": 300,
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-speech",
      "expo-print",
      "expo-sharing",
      "expo-image-picker",
      "expo-haptics",
      "expo-localization",
      "expo-web-browser"
    ]
  }
}
