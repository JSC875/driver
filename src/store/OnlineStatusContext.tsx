import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
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
}

interface AcceptedRideDetails {
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
  completeRide: (rideId: string) => void;
  resetDriverStatus: () => void;
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
  completeRide: () => {},
  resetDriverStatus: () => {},
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
  const [processedRideIds, setProcessedRideIds] = useState<Set<string>>(new Set());
  const [acceptingRideId, setAcceptingRideId] = useState<string | null>(null);
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
        
        // Check if we're currently accepting a ride
        if (acceptingRideId) {
          console.log('🚫 Currently accepting another ride, ignoring new request:', data.rideId);
          return;
        }
        
        // Only set current ride request if we don't have one already
        if (!currentRideRequest) {
          setCurrentRideRequest(data);
        } else {
          console.log('🚫 Already have a ride request, ignoring new one');
        }
      });

      socketManager.onRideTaken((data) => {
        console.log('✅ Ride taken by another driver:', data);
        if (currentRideRequest?.rideId === data.rideId) {
          setCurrentRideRequest(null);
        }
        // Remove from processed rides so it can be requested again if needed
        setProcessedRideIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.rideId);
          return newSet;
        });
      });

      socketManager.onRideResponseError((data) => {
        console.log('❌ Ride response error:', data);
        // Reset accepting state on error
        setAcceptingRideId(null);
        
        // If the error is about being busy, reset the driver status
        if (data.message && data.message.includes('already busy')) {
          console.log('🔄 Resetting driver status due to busy error');
          setAcceptedRideDetails(null);
          setCurrentRideRequest(null);
          setProcessedRideIds(new Set());
          
          // Send driver status as online
          socketManager.sendDriverStatus({
            driverId,
            status: 'online'
          });
        }
        
        // If the error is about already accepting another ride, reset the accepting state
        if (data.message && data.message.includes('already accepted another ride')) {
          console.log('🔄 Resetting accepting state due to already accepted error');
          setAcceptingRideId(null);
        }
        
        // Could show an alert or notification here
      });

      socketManager.onRideResponseConfirmed((data) => {
        console.log('✅ Ride response confirmed:', data);
        if (data.response === 'rejected') {
          setCurrentRideRequest(null);
          // Add to processed rides after successful rejection
          setProcessedRideIds(prev => new Set([...prev, data.rideId]));
        }
      });

      socketManager.onRideAcceptedWithDetails((data) => {
        console.log('✅ Ride accepted with details:', data);
        setAcceptedRideDetails(data);
        setCurrentRideRequest(null);
        setAcceptingRideId(null); // Reset accepting state
        // Add to processed rides after successful acceptance
        setProcessedRideIds(prev => new Set([...prev, data.rideId]));
      });

      // Listen for driver status reset events
      const socket = socketManager.getSocket();
      if (socket) {
        socket.on('driver_status_reset', (data: any) => {
          console.log('🔄 Driver status reset event received:', data);
          // Reset all driver state
          setAcceptedRideDetails(null);
          setCurrentRideRequest(null);
          setAcceptingRideId(null);
          setProcessedRideIds(new Set());
          
          // Send driver status as online
          socketManager.sendDriverStatus({
            driverId,
            status: 'online'
          });
        });
      }

      // Listen for driver cancellation success
      socketManager.onDriverCancellationSuccess((data) => {
        console.log('✅ Driver cancellation successful:', data);
        // Reset all driver state
        setAcceptedRideDetails(null);
        setCurrentRideRequest(null);
        setAcceptingRideId(null);
        setProcessedRideIds(new Set());
        
        // Send driver status as online
        socketManager.sendDriverStatus({
          driverId,
          status: 'online'
        });
        
        // Show success message
        Alert.alert('Ride Cancelled', data.message || 'Ride cancelled successfully');
      });

      // Listen for driver cancellation error
      socketManager.onDriverCancellationError((data) => {
        console.log('❌ Driver cancellation failed:', data);
        Alert.alert('Cancellation Error', data.message || 'Failed to cancel ride');
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
      setProcessedRideIds(new Set());
      setAcceptingRideId(null); // Reset accepting state
    }
  }, [isOnline, driverId]);

  const acceptRide = (rideRequest: RideRequest) => {
    console.log('✅ Accepting ride:', rideRequest);
    
    // Check if we're already accepting a ride
    if (acceptingRideId) {
      console.log('🚫 Already accepting a ride, ignoring duplicate request');
      return;
    }
    
    // Check if we already have accepted ride details (already on a ride)
    if (acceptedRideDetails) {
      console.log('🚫 Already on a ride, cannot accept another ride');
      return;
    }
    
    // Set the accepting ride ID to prevent duplicates
    setAcceptingRideId(rideRequest.rideId);
    
    // Send driver status as busy before accepting ride
    socketManager.sendDriverStatus({
      driverId,
      status: 'busy'
    });
    
    socketManager.acceptRide({
      rideId: rideRequest.rideId,
      driverId: driverId, // Use real driver ID from JWT
      driverName: 'Driver Name', // This should come from user data
      driverPhone: '+1234567890',
      estimatedArrival: '5 minutes'
    });
    
    setCurrentRideRequest(null);
    
    // Set a timeout to reset accepting state if no response is received
    setTimeout(() => {
      setAcceptingRideId(null);
    }, 10000); // 10 seconds timeout
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

  const completeRide = (rideId: string) => {
    console.log('✅ Completing ride:', rideId);
    socketManager.completeRide({
      rideId,
      driverId
    });
  };

  // Function to reset driver status when ride is completed
  const resetDriverStatus = () => {
    console.log('🔄 Resetting driver status to online');
    setAcceptedRideDetails(null);
    setCurrentRideRequest(null);
    setAcceptingRideId(null);
    setProcessedRideIds(new Set());
    
    // Send driver status as online
    socketManager.sendDriverStatus({
      driverId,
      status: 'online'
    });
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
      completeRide,
      resetDriverStatus,
      connectionStatus,
      driverId,
      userType
    }}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

export const useOnlineStatus = () => useContext(OnlineStatusContext); 