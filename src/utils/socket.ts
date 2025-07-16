import { io, Socket } from 'socket.io-client';
import { Alert } from 'react-native';

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
  private onConnectionChangeCallback: ((connected: boolean) => void) | null = null;

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
      // Configuration for socket connection
      const SOCKET_URL = "https://testsocketio-roqet.up.railway.app"; // Production
      
      console.log('🔧 Driver Socket URL configured:', SOCKET_URL, 'DEV mode:', __DEV__);
      
      // Connect to the Socket.IO server
      this.socket = io(SOCKET_URL, {
        query: {
          type: 'driver',
          id: driverId
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

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
      Alert.alert('Ride Cancelled', data.message || 'Ride cancelled successfully');
    });

    this.socket.on('driver_cancellation_error', (data) => {
      console.log('❌ Driver cancellation failed:', data);
      Alert.alert('Cancellation Error', data.message || 'Failed to cancel ride');
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

  onConnectionChange(callback: (connected: boolean) => void) {
    this.onConnectionChangeCallback = callback;
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
    this.onConnectionChangeCallback = null;
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
export default socketManager; 