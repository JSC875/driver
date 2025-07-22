# Driver App Configuration Setup

This document outlines the configuration changes made to align the driver app with the testinguser app for successful APK builds.

## Environment Variables

The following environment variables have been configured in both `app.json` and `eas.json`:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk authentication key
- `EXPO_PUBLIC_SOCKET_URL`: Socket.IO server URL
- `EXPO_PUBLIC_API_URL`: Backend API URL
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API key

## Configuration Files Updated

### 1. app.json
- Added environment variables in the `extra` section
- Added Google Maps API key configuration for Android
- Added EAS project ID

### 2. eas.json (New)
- Created EAS build configuration
- Configured environment variables for preview and production builds
- Set APK build type for preview builds

### 3. package.json
- Added missing dependencies:
  - `expo-dev-client`
  - `uuid` and `@types/uuid`
  - `react-native-dotenv`
  - `babel-plugin-module-resolver`

### 4. babel.config.js
- Added module resolver plugin for better import management
- Configured path aliases for cleaner imports

### 5. src/utils/socket.ts
- Updated to use environment variables from Constants
- Added APK-specific connection handling
- Enhanced socket configuration for production builds
- Added new methods: `connectWithJWT`, `ensureSocketConnected`, `forceReconnect`, `initializeAPKConnection`

### 6. src/utils/jwtDecoder.ts
- Updated to match testinguser implementation
- Added proper JWT decoding utilities

### 7. App.tsx
- Added socket initialization on app startup
- Added GestureHandlerRootView wrapper
- Added SocketInitializer component

## Building the APK

To build the driver app APK:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the APK:
   ```bash
   eas build --platform android --profile preview
   ```

3. For production build:
   ```bash
   eas build --platform android --profile production
   ```

## Socket Connection

The socket connection is now configured to:
- Use environment variables for URLs
- Handle APK-specific connection issues
- Implement aggressive reconnection for production builds
- Use WebSocket transport for better reliability
- Include proper error handling and logging

## Key Differences from User App

1. **User Type**: Driver app uses 'driver' as user type instead of 'customer'
2. **Socket Events**: Driver app listens for different events (ride requests, driver status updates)
3. **Package Name**: Different Android package name (`com.roqet.driverapp`)
4. **App Name**: "Roqet Driver" instead of "Roqet-app"

## Troubleshooting

If you encounter connection issues:
1. Check that all environment variables are properly set
2. Verify the socket URL is accessible
3. Check the console logs for connection status
4. Use the `debugSocketConnection()` method to diagnose issues

## Notes

- The driver app now uses the same socket server and API endpoints as the user app
- All environment variables are configured for both development and production
- The APK build process is optimized for Android compatibility
- Socket connection includes APK-specific handling for better reliability 