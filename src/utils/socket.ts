import { io, Socket } from 'socket.io-client';
import { Alert } from 'react-native'; // Added for user-friendly alerts

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
  private onConnectionChangeCallback: ((connected: boolean) => void) | null = null;

  connect(driverId: string) {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    try {
      // Connect to the Socket.IO server
      this.socket = io('https://testsocketio-roqet.up.railway.app', {
        query: {
          type: 'driver',
          id: driverId
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to connect to socket server:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔗 Driver connected to socket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.onConnectionChangeCallback?.(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Driver disconnected from socket server:', reason);
      Alert.alert('Disconnected', 'Lost connection to server. Please check your internet.');
      this.isConnected = false;
      this.onConnectionChangeCallback?.(false);
      
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
      Alert.alert('Connection Error', 'Could not connect to server.');
      this.isConnected = false;
      this.onConnectionChangeCallback?.(false);
    });

    // Handle new ride requests
    this.socket.on('new_ride_request', (data) => {
      console.log('🚗 New ride request received:', data);
      this.onRideRequestCallback?.(data);
    });

    // Handle ride taken notifications
    this.socket.on('ride_taken', (data) => {
      console.log('✅ Ride taken by another driver:', data);
      this.onRideTakenCallback?.(data);
    });

    // Handle ride response errors
    this.socket.on('ride_response_error', (data) => {
      console.log('❌ Ride response error:', data);
      Alert.alert('Ride Error', data.message || 'Ride could not be accepted.');
      this.onRideResponseErrorCallback?.(data);
    });

    // Handle ride response confirmations
    this.socket.on('ride_response_confirmed', (data) => {
      console.log('✅ Ride response confirmed:', data);
      this.onRideResponseConfirmedCallback?.(data);
    });

    // Handle ride accepted with details
    this.socket.on('ride_accepted_with_details', (data) => {
      console.log('✅ Ride accepted with details:', data);
      this.onRideAcceptedWithDetailsCallback?.(data);
    });

    // Handle test responses
    this.socket.on('test_response', (data) => {
      console.log('🧪 Test response received:', data);
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
      this.socket.emit('ride_response', {
        rideId: data.rideId,
        response: 'accept',
        driverId: data.driverId,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        estimatedArrival: data.estimatedArrival
      });
      console.log('✅ Accepting ride:', data.rideId);
    } else {
      console.warn('Socket not connected, cannot accept ride');
    }
  }

  // Reject a ride request
  rejectRide(data: {
    rideId: string;
    driverId: string;
  }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('ride_response', {
        rideId: data.rideId,
        response: 'reject',
        driverId: data.driverId
      });
      console.log('❌ Rejecting ride:', data.rideId);
    } else {
      console.warn('Socket not connected, cannot reject ride');
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
    }
  }

  // Send ride status update
  sendRideStatusUpdate(data: {
    rideId: string;
    status: 'accepted' | 'rejected' | 'arrived' | 'started' | 'completed' | 'cancelled';
    userId: string;
    message?: string;
  }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('ride_status_update', data);
    }
  }

  // Send driver status update
  sendDriverStatus(data: {
    driverId: string;
    status: 'online' | 'busy' | 'offline';
  }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('driver_status', data);
    }
  }

  // Send test event
  sendTestEvent(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('test_event', data);
    }
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

  onConnectionChange(callback: (connected: boolean) => void) {
    this.onConnectionChangeCallback = callback;
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // Clear all callbacks
  clearCallbacks() {
    this.onRideRequestCallback = null;
    this.onRideTakenCallback = null;
    this.onRideResponseErrorCallback = null;
    this.onRideResponseConfirmedCallback = null;
    this.onRideAcceptedWithDetailsCallback = null;
    this.onConnectionChangeCallback = null;
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
export default socketManager; 