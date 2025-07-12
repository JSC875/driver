import React, { createContext, useContext, useState, useEffect } from 'react';
import socketManager, { 
  RideRequestCallback, 
  RideTakenCallback, 
  RideResponseErrorCallback,
  RideResponseConfirmedCallback,
  RideAcceptedWithDetailsCallback
} from '../utils/socket';
import { getDriverId, getUserType } from '../utils/jwtDecoder';
import { useAuth } from '@clerk/clerk-expo';

interface RideRequest {
  rideId: string;
  pickup: string;
  drop: string;
  rideType: string;
  price: number;
  userId: string;
  timestamp?: number;
}

interface AcceptedRideDetails {
  rideId: string;
  userId: string;
  pickup: string;
  drop: string;
  rideType: string;
  price: number;
  driverId: string;
  driverName: string;
  driverPhone: string;
  estimatedArrival: string;
  status: string;
  createdAt: number;
}

const OnlineStatusContext = createContext<{
  isOnline: boolean;
  setIsOnline: (v: boolean) => void;
  isSocketConnected: boolean;
  currentRideRequest: RideRequest | null;
  acceptedRideDetails: AcceptedRideDetails | null;
  acceptRide: (rideRequest: RideRequest) => void;
  rejectRide: (rideRequest: RideRequest) => void;
  sendLocationUpdate: (data: { latitude: number; longitude: number; userId: string; driverId: string }) => void;
  sendRideStatusUpdate: (data: { rideId: string; status: 'accepted' | 'rejected' | 'arrived' | 'started' | 'completed' | 'cancelled'; userId: string; message?: string }) => void;
  sendDriverStatus: (data: { driverId: string; status: 'online' | 'busy' | 'offline' }) => void;
  connectionStatus: string;
  driverId: string;
  userType: string;
}>({
  isOnline: false,
  setIsOnline: () => {},
  isSocketConnected: false,
  currentRideRequest: null,
  acceptedRideDetails: null,
  acceptRide: () => {},
  rejectRide: () => {},
  sendLocationUpdate: () => {},
  sendRideStatusUpdate: () => {},
  sendDriverStatus: () => {},
  connectionStatus: 'Disconnected',
  driverId: 'driver_001',
  userType: 'driver',
});

export const OnlineStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [currentRideRequest, setCurrentRideRequest] = useState<RideRequest | null>(null);
  const [acceptedRideDetails, setAcceptedRideDetails] = useState<AcceptedRideDetails | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [driverId, setDriverId] = useState('driver_001');
  const [userType, setUserType] = useState('driver');
  const { getToken } = useAuth();

  // Get driver ID and user type from JWT when component mounts
  useEffect(() => {
    const initializeUserInfo = async () => {
      try {
        const [newDriverId, newUserType] = await Promise.all([
          getDriverId(getToken),
          getUserType(getToken)
        ]);
        
        setDriverId(newDriverId);
        setUserType(newUserType);
        
        console.log('✅ User info initialized from JWT:', {
          driverId: newDriverId,
          userType: newUserType
        });
      } catch (error) {
        console.error('❌ Error initializing user info from JWT:', error);
      }
    };

    initializeUserInfo();
  }, [getToken]);

  useEffect(() => {
    // Set up socket connection when online status changes
    if (isOnline) {
      // Connect to socket with the real driver ID from JWT
      console.log('🔗 Connecting to socket with driver ID:', driverId);
      socketManager.connect(driverId);
      
      // Set up socket event listeners
      socketManager.onConnectionChange((connected) => {
        console.log('Socket connection status:', connected);
        setIsSocketConnected(connected);
        setConnectionStatus(connected ? 'Connected' : 'Disconnected');
      });

      socketManager.onRideRequest((data) => {
        console.log('🚗 New ride request received in context:', data);
        setCurrentRideRequest(data);
      });

      socketManager.onRideTaken((data) => {
        console.log('✅ Ride taken by another driver:', data);
        if (currentRideRequest?.rideId === data.rideId) {
          setCurrentRideRequest(null);
        }
      });

      socketManager.onRideResponseError((data) => {
        console.log('❌ Ride response error:', data);
        // Could show an alert or notification here
      });

      socketManager.onRideResponseConfirmed((data) => {
        console.log('✅ Ride response confirmed:', data);
        if (data.response === 'rejected') {
          setCurrentRideRequest(null);
        }
      });

      socketManager.onRideAcceptedWithDetails((data) => {
        console.log('✅ Ride accepted with details:', data);
        setAcceptedRideDetails(data);
        setCurrentRideRequest(null);
      });

      // Send driver status when going online
      socketManager.sendDriverStatus({
        driverId,
        status: 'online'
      });
    } else {
      // Disconnect from socket when going offline
      socketManager.sendDriverStatus({
        driverId,
        status: 'offline'
      });
      socketManager.disconnect();
      setIsSocketConnected(false);
      setConnectionStatus('Disconnected');
      setCurrentRideRequest(null);
    }
  }, [isOnline, driverId]);

  const acceptRide = (rideRequest: RideRequest) => {
    console.log('✅ Accepting ride:', rideRequest);
    
    socketManager.acceptRide({
      rideId: rideRequest.rideId,
      driverId: driverId, // Use real driver ID from JWT
      driverName: 'Driver Name', // This should come from user data
      driverPhone: '+1234567890',
      estimatedArrival: '5 minutes'
    });
    
    setCurrentRideRequest(null);
  };

  const rejectRide = (rideRequest: RideRequest) => {
    console.log('❌ Rejecting ride:', rideRequest);
    
    socketManager.rejectRide({
      rideId: rideRequest.rideId,
      driverId: driverId // Use real driver ID from JWT
    });
    
    setCurrentRideRequest(null);
  };

  const sendLocationUpdate = (data: { latitude: number; longitude: number; userId: string; driverId: string }) => {
    // Use the real driver ID from JWT
    const locationData = {
      ...data,
      driverId: driverId
    };
    socketManager.sendLocationUpdate(locationData);
  };

  const sendRideStatusUpdate = (data: { rideId: string; status: 'accepted' | 'rejected' | 'arrived' | 'started' | 'completed' | 'cancelled'; userId: string; message?: string }) => {
    socketManager.sendRideStatusUpdate(data);
  };

  const sendDriverStatus = (data: { driverId: string; status: 'online' | 'busy' | 'offline' }) => {
    // Use the real driver ID from JWT
    const statusData = {
      ...data,
      driverId: driverId
    };
    socketManager.sendDriverStatus(statusData);
  };

  return (
    <OnlineStatusContext.Provider value={{ 
      isOnline, 
      setIsOnline, 
      isSocketConnected, 
      currentRideRequest,
      acceptedRideDetails,
      acceptRide,
      rejectRide,
      sendLocationUpdate,
      sendRideStatusUpdate,
      sendDriverStatus,
      connectionStatus,
      driverId,
      userType
    }}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

export const useOnlineStatus = () => useContext(OnlineStatusContext); 