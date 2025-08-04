import { io, Socket } from 'socket.io-client';
import { getUserIdFromJWT, getUserTypeFromJWT } from './jwtDecoder';
import { Alert } from 'react-native';
import Constants from 'expo-constants';

// Event callback types
export type RideRequestCallback = (data: {
  rideId: string;
  pickup: {
    latitude: number;
    longitude: number;
    address: string;
    name: string;
  };
  drop: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    type: string;
  };
  rideType: string;
  price: number;
  userId: string;
  timestamp: number;
}) => void;

export type RideTakenCallback = (data: {
  rideId: string;
  driverId: string;
}) => void;

export type RideResponseErrorCallback = (data: {
  message: string;
}) => void;

export type RideResponseConfirmedCallback = (data: {
  rideId: string;
  response: string;
}) => void;

export type RideAcceptedWithDetailsCallback = (data: {
  rideId: string;
  userId: string;
  pickup: {
    latitude: number;
    longitude: number;
    address: string;
    name: string;
  };
  drop: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    type: string;
  };
  rideType: string;
  price: number;
  driverId: string;
  driverName: string;
  driverPhone: string;
  estimatedArrival: string;
  status: string;
  createdAt: number;
}) => void;

export type RideStatusUpdateCallback = (data: {
  rideId: string;
  status: string;
  message: string;
  timestamp: number;
}) => void;

export type DriverStatusResetCallback = (data: {
  message: string;
  timestamp: number;
}) => void;

export type DriverCancellationSuccessCallback = (data: {
  message: string;
  cancellationFee: number;
}) => void;

export type DriverCancellationErrorCallback = (data: {
  message: string;
}) => void;

export type DriverLocationUpdateCallback = (data: {
  latitude: number;
  longitude: number;
  timestamp: number;
}) => void;

// Chat event types
export type ChatMessageCallback = (data: {
  id: string;
  rideId: string;
  senderId: string;
  senderType: 'user' | 'driver';
  message: string;
  timestamp: string;
  isRead: boolean;
}) => void;

export type ChatHistoryCallback = (data: {
  rideId: string;
  messages: Array<{
    id: string;
    rideId: string;
    senderId: string;
    senderType: 'user' | 'driver';
    message: string;
    timestamp: string;
    isRead: boolean;
  }>;
  totalMessages: number;
}) => void;

export type TypingIndicatorCallback = (data: {
  rideId: string;
  isTyping: boolean;
  senderId: string;
  senderType: 'user' | 'driver';
}) => void;

export type MessagesReadCallback = (data: {
  rideId: string;
  readBy: string;
  readByType: 'user' | 'driver';
  timestamp: number;
}) => void;

// Configuration for socket connection
const SOCKET_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_SOCKET_URL || process.env.EXPO_PUBLIC_SOCKET_URL || 'https://testsocketio-roqet.up.railway.app';

console.log('🔧 Driver Socket URL configured:', SOCKET_URL, 'DEV mode:', __DEV__);
console.log('🔧 Constants.expoConfig?.extra?.EXPO_PUBLIC_SOCKET_URL:', Constants.expoConfig?.extra?.EXPO_PUBLIC_SOCKET_URL);
console.log('🔧 process.env.EXPO_PUBLIC_SOCKET_URL:', process.env.EXPO_PUBLIC_SOCKET_URL);

// Validate socket URL
if (!SOCKET_URL || SOCKET_URL === 'undefined') {
  console.error('❌ CRITICAL: Socket URL is not configured properly!');
  console.error('❌ Constants.expoConfig?.extra?.EXPO_PUBLIC_SOCKET_URL:', Constants.expoConfig?.extra?.EXPO_PUBLIC_SOCKET_URL);
  console.error('❌ process.env.EXPO_PUBLIC_SOCKET_URL:', process.env.EXPO_PUBLIC_SOCKET_URL);
  console.error('❌ Using fallback URL:', 'https://testsocketio-roqet.up.railway.app');
}

class SocketManager {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event callbacks
  private onRideRequestCallback: RideRequestCallback | null = null;
  private onRideTakenCallback: RideTakenCallback | null = null;
  private onRideResponseErrorCallback: RideResponseErrorCallback | null = null;
  private onRideResponseConfirmedCallback: RideResponseConfirmedCallback | null = null;
  private onRideAcceptedWithDetailsCallback: RideAcceptedWithDetailsCallback | null = null;
  private onRideStatusUpdateCallback: RideStatusUpdateCallback | null = null;
  private onDriverStatusResetCallback: DriverStatusResetCallback | null = null;
  private onDriverCancellationSuccessCallback: DriverCancellationSuccessCallback | null = null;
  private onDriverCancellationErrorCallback: DriverCancellationErrorCallback | null = null;
  private onDriverLocationUpdateCallback: DriverLocationUpdateCallback | null = null;
  private onConnectionChangeCallback: ((connected: boolean) => void) | null = null;
  
  // Chat event callbacks
  private onChatMessageCallback: ChatMessageCallback | null = null;
  private onChatHistoryCallback: ChatHistoryCallback | null = null;
  private onTypingIndicatorCallback: TypingIndicatorCallback | null = null;
  private onMessagesReadCallback: MessagesReadCallback | null = null;

  connect(driverId: string) {
    if (this.socket && this.isConnected) {
      console.log('🔗 Socket already connected');
      return;
    }

    // Disconnect any existing socket first
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }

    try {
      console.log('🔧 Driver Socket URL configured:', SOCKET_URL, 'DEV mode:', __DEV__);
      
      // Validate socket URL before attempting connection
      if (!SOCKET_URL || SOCKET_URL === 'undefined' || SOCKET_URL === 'null') {
        console.error('❌ Cannot connect: Socket URL is invalid');
        console.error('❌ SOCKET_URL:', SOCKET_URL);
        console.error('❌ EXPO_PUBLIC_SOCKET_URL:', Constants.expoConfig?.extra?.EXPO_PUBLIC_SOCKET_URL || process.env.EXPO_PUBLIC_SOCKET_URL);
        throw new Error('Socket URL is not configured. Please check environment variables.');
      }
      
      // Adjust configuration based on environment
      const isProduction = !__DEV__;
      const userAgent = isProduction ? 'ReactNative-APK' : 'ReactNative';
      
      // Enhanced socket configuration for better APK compatibility
      const socketConfig = {
        transports: ["websocket"], // Force WebSocket only for better reliability
        query: {
          type: 'driver',
          id: driverId,
          platform: isProduction ? 'android-apk' : 'react-native',
          version: '1.0.0'
        },
        reconnection: true,
        reconnectionAttempts: isProduction ? 25 : 15, // More retries in production
        reconnectionDelay: isProduction ? 1500 : 1000, // Shorter delay in production
        reconnectionDelayMax: isProduction ? 8000 : 5000, // Shorter max delay in production
        timeout: isProduction ? 25000 : 20000, // Longer timeout in production
        forceNew: true,
        upgrade: false, // Disable upgrade to prevent transport switching issues
        rememberUpgrade: false,
        autoConnect: true,
        path: "/socket.io/",
        extraHeaders: {
          "Access-Control-Allow-Origin": "*",
          "User-Agent": userAgent,
          "X-Platform": "Android",
          "X-Environment": isProduction ? "production" : "development",
          "X-App-Version": "1.0.0"
        },
        // Additional options for better Android compatibility
        withCredentials: false,
        rejectUnauthorized: false,
        // APK-specific settings
        ...(isProduction && {
          pingTimeout: 60000,
          pingInterval: 25000,
          maxReconnectionAttempts: 25,
          reconnectionAttempts: 25
        })
      };

      console.log('🔧 Socket configuration:', socketConfig);
      
      // Connect to the Socket.IO server
      this.socket = io(SOCKET_URL, socketConfig);

      this.setupEventListeners();
    } catch (error) {
      console.error('❌ Failed to connect to socket server:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🟢 Driver connected to socket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.onConnectionChangeCallback?.(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Driver disconnected from socket server:', reason);
      this.isConnected = false;
      this.onConnectionChangeCallback?.(false);
      
      // Only show alert for unexpected disconnections
      if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
        Alert.alert('Disconnected', 'Lost connection to server. Please check your internet.');
      }
      
      // Attempt to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          this.socket?.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.isConnected = false;
      this.onConnectionChangeCallback?.(false);
      Alert.alert('Connection Error', 'Could not connect to server.');
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.onConnectionChangeCallback?.(true);
    });

    // Handle new ride requests
    this.socket.on('new_ride_request', (data) => {
      console.log('🚗 New ride request received:', data);
      this.onRideRequestCallback?.(data);
    });

    // Handle active ride requests when driver connects
    this.socket.on('active_ride_requests', (data) => {
      console.log('📋 Active ride requests received:', data);
      // Process each active ride request
      if (Array.isArray(data)) {
        data.forEach(rideRequest => {
          console.log('🚗 Processing active ride request:', rideRequest.rideId);
          this.onRideRequestCallback?.(rideRequest);
        });
      }
    });

    // Handle driver status reset
    this.socket.on('driver_status_reset', (data) => {
      console.log('🔄 Driver status reset received:', data);
      this.onDriverStatusResetCallback?.(data);
    });

    // Handle ride taken notifications
    this.socket.on('ride_taken', (data) => {
      console.log('✅ Ride taken by another driver:', data);
      this.onRideTakenCallback?.(data);
    });

    // Handle ride response errors
    this.socket.on('ride_accept_error', (data) => {
      console.log('❌ Ride accept error:', data);
      Alert.alert('Ride Error', data.message || 'Ride could not be accepted.');
      this.onRideResponseErrorCallback?.(data);
    });

    // Legacy event for backward compatibility
    this.socket.on('ride_response_error', (data) => {
      console.log('❌ Ride response error (legacy):', data);
      Alert.alert('Ride Error', data.message || 'Ride could not be accepted.');
      this.onRideResponseErrorCallback?.(data);
    });

    // Handle ride reject confirmations
    this.socket.on('ride_reject_confirmed', (data) => {
      console.log('✅ Ride reject confirmed:', data);
      this.onRideResponseConfirmedCallback?.(data);
    });

    // Legacy event for backward compatibility
    this.socket.on('ride_response_confirmed', (data) => {
      console.log('✅ Ride response confirmed (legacy):', data);
      this.onRideResponseConfirmedCallback?.(data);
    });

    // Handle ride accepted with details
    this.socket.on('ride_accepted_with_details', (data) => {
      console.log('✅ Ride accepted with details:', data);
      this.onRideAcceptedWithDetailsCallback?.(data);
    });

    // Handle ride status updates
    this.socket.on('ride_status_updated', (data) => {
      console.log('🔄 Ride status updated:', data);
      this.onRideStatusUpdateCallback?.(data);
    });

    // Handle ride cancelled
    this.socket.on('ride_cancelled', (data) => {
      console.log('❌ Ride cancelled:', data);
      this.onRideStatusUpdateCallback?.(data);
    });

    // Legacy event for backward compatibility
    this.socket.on('ride_status_update', (data) => {
      console.log('🔄 Ride status update received (legacy):', data);
      this.onRideStatusUpdateCallback?.(data);
    });

    // Handle OTP responses
    this.socket.on('otp_sent', (data) => {
      console.log('✅ OTP sent successfully:', data);
    });

    this.socket.on('otp_error', (data) => {
      console.error('❌ OTP error:', data);
      Alert.alert('OTP Error', data.message || 'Failed to send OTP');
    });

    this.socket.on('mpin_verified', (data) => {
      console.log('✅ MPIN verified by customer:', data);
    });

    // Handle test responses
    this.socket.on('test_response', (data) => {
      console.log('🧪 Test response received:', data);
    });

    // Handle driver cancellation responses
    this.socket.on('driver_cancellation_success', (data) => {
      console.log('✅ Driver cancellation successful:', data);
      this.onDriverCancellationSuccessCallback?.(data);
    });

    this.socket.on('driver_cancellation_error', (data) => {
      console.log('❌ Driver cancellation failed:', data);
      this.onDriverCancellationErrorCallback?.(data);
    });

    // Handle driver location updates
    this.socket.on('driver_location_update', (data) => {
      console.log('📍 Driver location update received:', data);
      this.onDriverLocationUpdateCallback?.(data);
    });

    // Chat event listeners
    this.socket.on('receive_chat_message', (data) => {
      console.log('💬 Received chat message:', data);
      this.onChatMessageCallback?.(data);
    });

    this.socket.on('chat_history', (data) => {
      console.log('📚 Received chat history:', data);
      this.onChatHistoryCallback?.(data);
    });

    this.socket.on('typing_indicator', (data) => {
      console.log('⌨️ Typing indicator:', data);
      this.onTypingIndicatorCallback?.(data);
    });

    this.socket.on('messages_read', (data) => {
      console.log('👁️ Messages read:', data);
      this.onMessagesReadCallback?.(data);
    });

    this.socket.on('chat_message_sent', (data) => {
      console.log('✅ Chat message sent successfully:', data);
    });

    this.socket.on('chat_message_error', (data) => {
      console.log('❌ Chat message error:', data);
      Alert.alert('Chat Error', data.message || 'Failed to send message.');
    });

    this.socket.on('chat_history_error', (data) => {
      console.log('❌ Chat history error:', data);
      Alert.alert('Chat Error', data.message || 'Failed to load chat history.');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Accept a ride request
  acceptRide(data: {
    rideId: string;
    driverId: string;
    driverName: string;
    driverPhone: string;
    estimatedArrival: string;
  }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('accept_ride', {
        rideId: data.rideId,
        driverId: data.driverId,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        estimatedArrival: data.estimatedArrival
      });
      console.log('✅ Accepting ride:', data.rideId);
    } else {
      console.warn('⚠️ Socket not connected, cannot accept ride');
    }
  }

  // Reject a ride request
  rejectRide(data: {
    rideId: string;
    driverId: string;
  }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('reject_ride', {
        rideId: data.rideId,
        driverId: data.driverId
      });
      console.log('❌ Rejecting ride:', data.rideId);
    } else {
      console.warn('⚠️ Socket not connected, cannot reject ride');
    }
  }

  // Send driver location update
  sendLocationUpdate(data: {
    latitude: number;
    longitude: number;
    userId: string;
    driverId: string;
  }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('driver_location', data);
      console.log('📍 Sending location update:', data);
    } else {
      console.warn('⚠️ Socket not connected, cannot send location update');
    }
  }

  // Driver arrives at pickup location
  driverArrived(data: { rideId: string; driverId: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('driver_arrived', data);
      console.log('🚗 Driver arrived at pickup:', data);
    } else {
      console.warn('⚠️ Socket not connected, cannot send arrival update');
    }
  }

  // Start the ride (driver picks up passenger)
  startRide(data: { rideId: string; driverId: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('start_ride', data);
      console.log('🚀 Starting ride:', data);
    } else {
      console.warn('⚠️ Socket not connected, cannot start ride');
    }
  }

  // Send ride status update (legacy method)
  sendRideStatusUpdate(data: {
    rideId: string;
    status: 'accepted' | 'rejected' | 'arrived' | 'started' | 'completed' | 'cancelled';
    userId: string;
    message?: string;
  }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('ride_status_update', data);
      console.log('🔄 Sending ride status update:', data);
    } else {
      console.warn('⚠️ Socket not connected, cannot send ride status update');
    }
  }

  // Send driver status update
  sendDriverStatus(data: {
    driverId: string;
    status: 'online' | 'busy' | 'offline';
  }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('driver_status', data);
      console.log('🚗 Sending driver status update:', data);
    } else {
      console.warn('⚠️ Socket not connected, cannot send driver status update');
    }
  }

  // Complete a ride
  completeRide(data: { rideId: string; driverId: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('complete_ride', data);
      console.log('✅ Completing ride:', data);
    } else {
      console.warn('⚠️ Socket not connected, cannot complete ride');
    }
  }

  // Cancel a ride (driver-initiated)
  cancelRide(data: { rideId: string; driverId: string; reason: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('driver_cancel_ride', data);
      console.log('🚫 Driver cancelling ride:', data);
    } else {
      console.warn('⚠️ Socket not connected, cannot cancel ride');
    }
  }

  // Send OTP for verification
  sendOtp(data: { rideId: string; driverId: string; otp: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_otp', data);
      console.log('🔐 Sending OTP for verification:', data);
    } else {
      console.warn('⚠️ Socket not connected, cannot send OTP');
    }
  }

  // Send test event
  sendTestEvent(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('test_event', data);
      console.log('🧪 Sending test event:', data);
    } else {
      console.warn('⚠️ Socket not connected, cannot send test event');
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // Set callbacks
  onRideRequest(callback: RideRequestCallback) {
    this.onRideRequestCallback = callback;
  }

  onRideTaken(callback: RideTakenCallback) {
    this.onRideTakenCallback = callback;
  }

  onRideResponseError(callback: RideResponseErrorCallback) {
    this.onRideResponseErrorCallback = callback;
  }

  onRideResponseConfirmed(callback: RideResponseConfirmedCallback) {
    this.onRideResponseConfirmedCallback = callback;
  }

  onRideAcceptedWithDetails(callback: RideAcceptedWithDetailsCallback) {
    this.onRideAcceptedWithDetailsCallback = callback;
  }

  onRideStatusUpdate(callback: RideStatusUpdateCallback) {
    this.onRideStatusUpdateCallback = callback;
  }

  onDriverStatusReset(callback: DriverStatusResetCallback) {
    this.onDriverStatusResetCallback = callback;
  }

  onDriverCancellationSuccess(callback: DriverCancellationSuccessCallback) {
    this.onDriverCancellationSuccessCallback = callback;
  }

  onDriverCancellationError(callback: DriverCancellationErrorCallback) {
    this.onDriverCancellationErrorCallback = callback;
  }

  onDriverLocationUpdate(callback: DriverLocationUpdateCallback) {
    this.onDriverLocationUpdateCallback = callback;
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.onConnectionChangeCallback = callback;
  }

  // Chat callback setters
  onChatMessage(callback: ChatMessageCallback) {
    this.onChatMessageCallback = callback;
  }

  onChatHistory(callback: ChatHistoryCallback) {
    this.onChatHistoryCallback = callback;
  }

  onTypingIndicator(callback: TypingIndicatorCallback) {
    this.onTypingIndicatorCallback = callback;
  }

  onMessagesRead(callback: MessagesReadCallback) {
    this.onMessagesReadCallback = callback;
  }

  // Chat methods
  sendChatMessage(data: {
    rideId: string;
    senderId: string;
    senderType: 'user' | 'driver';
    message: string;
  }) {
    if (this.socket && this.isConnected) {
      console.log("💬 Sending chat message:", data);
      this.socket.emit("send_chat_message", data);
    } else {
      console.error("❌ Cannot send chat message: Socket not connected");
    }
  }

  getChatHistory(data: {
    rideId: string;
    requesterId: string;
    requesterType: 'user' | 'driver';
  }) {
    if (this.socket && this.isConnected) {
      console.log("📚 Requesting chat history:", data);
      this.socket.emit("get_chat_history", data);
    } else {
      console.error("❌ Cannot get chat history: Socket not connected");
    }
  }

  markMessagesAsRead(data: {
    rideId: string;
    readerId: string;
    readerType: 'user' | 'driver';
  }) {
    if (this.socket && this.isConnected) {
      console.log("👁️ Marking messages as read:", data);
      this.socket.emit("mark_messages_read", data);
    } else {
      console.error("❌ Cannot mark messages as read: Socket not connected");
    }
  }

  sendTypingStart(data: {
    rideId: string;
    senderId: string;
    senderType: 'user' | 'driver';
  }) {
    if (this.socket && this.isConnected) {
      this.socket.emit("typing_start", data);
    }
  }

  sendTypingStop(data: {
    rideId: string;
    senderId: string;
    senderType: 'user' | 'driver';
  }) {
    if (this.socket && this.isConnected) {
      this.socket.emit("typing_stop", data);
    }
  }

  // Clear all callbacks
  clearCallbacks() {
    this.onRideRequestCallback = null;
    this.onRideTakenCallback = null;
    this.onRideResponseErrorCallback = null;
    this.onRideResponseConfirmedCallback = null;
    this.onRideAcceptedWithDetailsCallback = null;
    this.onRideStatusUpdateCallback = null;
    this.onDriverStatusResetCallback = null;
    this.onDriverCancellationSuccessCallback = null;
    this.onDriverCancellationErrorCallback = null;
    this.onDriverLocationUpdateCallback = null;
    this.onConnectionChangeCallback = null;
    
    // Clear chat callbacks
    this.onChatMessageCallback = null;
    this.onChatHistoryCallback = null;
    this.onTypingIndicatorCallback = null;
    this.onMessagesReadCallback = null;
  }

  // New methods for APK compatibility
  connectWithJWT = async (getToken: any) => {
    const userId = await getUserIdFromJWT(getToken);
    const userType = await getUserTypeFromJWT(getToken);
    return this.connect(userId);
  };

  ensureSocketConnected = async (getToken: any) => {
    console.log('🔍 Ensuring socket connection...');
    
    if (this.socket && this.isConnected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }
    
    console.log('🔌 Socket not connected, attempting to connect...');
    try {
      await this.connectWithJWT(getToken);
      
      // Wait a bit to ensure connection is stable
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify connection is still active
      if (this.socket && this.isConnected) {
        console.log('✅ Socket connection verified and stable');
        return this.socket;
      } else {
        console.log('⚠️ Socket connection not stable, attempting retry...');
        // Try one more time
        await this.connectWithJWT(getToken);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.socket;
      }
    } catch (error) {
      console.error('❌ Failed to connect socket:', error);
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
  };

  forceReconnect = async (getToken: any) => {
    console.log('🔄 Force reconnecting socket...');
    
    // Disconnect existing socket
    if (this.socket) {
      console.log('🔄 Disconnecting existing socket...');
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
    
    // Wait a moment before reconnecting
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Reconnect with APK-specific handling
    try {
      await this.connectWithJWT(getToken);
      
      // Wait longer for APK builds to ensure connection is fully established
      const waitTime = !__DEV__ ? 3000 : 2000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Verify connection
      if (this.socket && this.isConnected) {
        console.log('✅ Force reconnect verified - socket is connected');
      } else {
        console.log('⚠️ Force reconnect completed but socket not verified as connected');
        
        // For APK builds, try one more time
        if (!__DEV__) {
          console.log('🔄 APK: Attempting one more reconnection...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          await this.connectWithJWT(getToken);
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          if (this.socket && this.isConnected) {
            console.log('✅ APK: Second reconnection attempt successful');
          }
        }
      }
      
      return this.socket;
    } catch (error) {
      console.error('❌ Force reconnect failed:', error);
      throw error;
    }
  };

  initializeAPKConnection = async (getToken: any) => {
    console.log("🚀 Initializing APK connection...");
    
    if (!__DEV__) {
      console.log("🏗️ APK initialization mode");
      
      // Clear any existing connection
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      
      this.isConnected = false;
      this.reconnectAttempts = 0;
      
      // Initial delay for APK
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        // First connection attempt
        console.log("🔄 APK: First connection attempt...");
        await this.connectWithJWT(getToken);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        if (this.socket && this.isConnected) {
          console.log("✅ APK: First connection successful");
          return this.socket;
        }
        
        // Second attempt with different strategy
        console.log("🔄 APK: Second connection attempt...");
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.connectWithJWT(getToken);
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        if (this.socket && this.isConnected) {
          console.log("✅ APK: Second connection successful");
          return this.socket;
        }
        
        // Final attempt with force reconnect
        console.log("🔄 APK: Final connection attempt with force reconnect...");
        await this.forceReconnect(getToken);
        
        return this.socket;
        
      } catch (error) {
        console.error("❌ APK initialization failed:", error);
        throw error;
      }
    } else {
      // For development, use normal connection
      return await this.ensureSocketConnected(getToken);
    }
  };

  debugSocketConnection = () => {
    console.log("🔍 Socket Debug Information:");
    console.log("🌐 Socket URL:", SOCKET_URL);
    console.log("📊 Connection State:", this.isConnected ? 'Connected' : 'Disconnected');
    console.log("🔄 Reconnect Attempts:", this.reconnectAttempts);
    console.log("🏗️ Environment:", __DEV__ ? 'Development' : 'Production');
    
    if (this.socket) {
      console.log("🔗 Socket Details:");
      console.log("- Exists: true");
      console.log("- Connected:", this.socket.connected);
      console.log("- ID:", this.socket.id || 'None');
      console.log("- Transport:", this.socket.io?.engine?.transport?.name || 'Unknown');
    } else {
      console.log("🔗 Socket: null");
    }
  };
}

// Export singleton instance
export const socketManager = new SocketManager();
export default socketManager; 