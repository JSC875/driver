import React, { createContext, useContext, useState, useEffect } from 'react';
import socketManager from '../utils/socket';

interface RideRequest {
  rideId: string;
  pickup: string;
  drop: string;
  rideType: string;
  price: number;
  userId: string;
}

const OnlineStatusContext = createContext<{
  isOnline: boolean;
  setIsOnline: (v: boolean) => void;
  isSocketConnected: boolean;
  currentRideRequest: RideRequest | null;
  acceptRide: (rideRequest: RideRequest) => void;
  rejectRide: (rideRequest: RideRequest) => void;
  sendLocationUpdate: (data: { latitude: number; longitude: number; userId: string; rideId: string }) => void;
  sendRideStatusUpdate: (data: { rideId: string; status: 'accepted' | 'rejected' | 'arrived' | 'started' | 'completed' | 'cancelled'; userId: string; message?: string }) => void;
}>({
  isOnline: false,
  setIsOnline: () => {},
  isSocketConnected: false,
  currentRideRequest: null,
  acceptRide: () => {},
  rejectRide: () => {},
  sendLocationUpdate: () => {},
  sendRideStatusUpdate: () => {},
});

export const OnlineStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [currentRideRequest, setCurrentRideRequest] = useState<RideRequest | null>(null);

  useEffect(() => {
    // Set up socket connection when online status changes
    if (isOnline) {
      // Connect to socket with a driver ID (you can make this dynamic)
      const driverId = 'driver_001'; // This should come from user authentication
      socketManager.connect(driverId);
      
      // Set up socket event listeners
      socketManager.onConnectionChange((connected) => {
        console.log('Socket connection status:', connected);
        setIsSocketConnected(connected);
      });

      socketManager.onRideRequest((data) => {
        console.log('New ride request received in context:', data);
        setCurrentRideRequest(data);
      });
    } else {
      // Disconnect from socket when going offline
      socketManager.disconnect();
      setIsSocketConnected(false);
      setCurrentRideRequest(null);
    }
  }, [isOnline]);

  const acceptRide = (rideRequest: RideRequest) => {
    console.log('Accepting ride:', rideRequest);
    socketManager.sendRideStatusUpdate({
      rideId: rideRequest.rideId,
      status: 'accepted',
      userId: rideRequest.userId,
      message: 'Driver accepted the ride'
    });
    setCurrentRideRequest(null);
  };

  const rejectRide = (rideRequest: RideRequest) => {
    console.log('Rejecting ride:', rideRequest);
    socketManager.sendRideStatusUpdate({
      rideId: rideRequest.rideId,
      status: 'rejected',
      userId: rideRequest.userId,
      message: 'Driver rejected the ride'
    });
    setCurrentRideRequest(null);
  };

  const sendLocationUpdate = (data: { latitude: number; longitude: number; userId: string; rideId: string }) => {
    socketManager.sendLocationUpdate(data);
  };

  const sendRideStatusUpdate = (data: { rideId: string; status: 'accepted' | 'rejected' | 'arrived' | 'started' | 'completed' | 'cancelled'; userId: string; message?: string }) => {
    socketManager.sendRideStatusUpdate(data);
  };

  return (
    <OnlineStatusContext.Provider value={{ 
      isOnline, 
      setIsOnline, 
      isSocketConnected, 
      currentRideRequest,
      acceptRide,
      rejectRide,
      sendLocationUpdate,
      sendRideStatusUpdate
    }}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

export const useOnlineStatus = () => useContext(OnlineStatusContext); 