import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event callbacks
  private onRideRequestCallback: ((data: any) => void) | null = null;
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

      // Emit a driver_location event for testing
      this.sendLocationUpdate({
        latitude: 17.4485835,
        longitude: 78.39080349999999,
        userId: 'user123', // Use a test userId
        rideId: 'ride_001' // Use a test rideId
      });

      // Emit a ride_status_update event for testing
      this.sendRideStatusUpdate({
        rideId: 'ride_001',
        status: 'arrived',
        userId: 'user123',
        message: 'Driver has arrived (test event)'
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Driver disconnected from socket server:', reason);
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
      this.isConnected = false;
      this.onConnectionChangeCallback?.(false);
    });

    // Handle new ride requests
    this.socket.on('new_ride_request', (data) => {
      console.log('🚗 New ride request received:', data);
      this.onRideRequestCallback?.(data);
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

  // Send driver location update
  sendLocationUpdate(data: {
    latitude: number;
    longitude: number;
    userId: string;
    rideId: string;
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

  // Send test event
  sendTestEvent(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('test_event', data);
    }
  }

  // Set callbacks
  onRideRequest(callback: (data: any) => void) {
    this.onRideRequestCallback = callback;
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.onConnectionChangeCallback = callback;
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
export default socketManager; 