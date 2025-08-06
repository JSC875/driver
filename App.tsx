import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import AppNavigator from './src/navigation/AppNavigator';
import { OnlineStatusProvider } from './src/store/OnlineStatusContext';
import { RideHistoryProvider } from './src/store/RideHistoryContext';
import { ChatProvider } from './src/store/ChatContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (error) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (error) {
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
  );
}

// Component to handle socket initialization
function SocketInitializer() {
  const { getToken } = useAuth();

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        console.log('🚀 App: Initializing socket connection on startup...');
        
        // Wait a bit for the app to fully load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Initialize socket connection
        const { socketManager } = require('./src/utils/socket');
        await socketManager.initializeAPKConnection(getToken);
        
        console.log('✅ App: Socket connection initialized successfully');
      } catch (error) {
        console.error('❌ App: Failed to initialize socket connection:', error);
        // Don't show error to user, let individual screens handle connection
      }
    };

    initializeSocket();
  }, [getToken]);

  return null;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RideHistoryProvider>
        <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
          <SafeAreaProvider>
            <OnlineStatusProvider>
              <StatusBar style="dark" backgroundColor="#ffffff" />
              <SocketInitializer />
              <ChatProvider>
                <AppNavigator />
              </ChatProvider>
            </OnlineStatusProvider>
          </SafeAreaProvider>
        </ClerkProvider>
      </RideHistoryProvider>
    </GestureHandlerRootView>
  );
}
