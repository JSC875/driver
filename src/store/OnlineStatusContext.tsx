import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import socketManager, { 
  RideRequestCallback, 
  RideTakenCallback, 
  RideResponseErrorCallback,
  RideResponseConfirmedCallback,
  RideAcceptedWithDetailsCallback
} from '../utils/socket';
import { getUserIdFromJWT, getUserTypeFromJWT } from '../utils/jwtDecoder';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RideRequest {
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
  currentRideRequests: RideRequest[];
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
  currentRideRequests: [],
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
  const [currentRideRequests, setCurrentRideRequests] = useState<RideRequest[]>([]);
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
          getUserIdFromJWT(getToken),
          getUserTypeFromJWT(getToken)
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
    }
  }, [isOnline, driverId]);

  // Set up socket event listeners once when component mounts
  useEffect(() => {
    // Set up socket event listeners
    socketManager.onConnectionChange((connected) => {
      console.log('🔗 Socket connection status changed:', connected);
      console.log('📊 Previous connection status:', isSocketConnected);
      setIsSocketConnected(connected);
      setConnectionStatus(connected ? 'Connected' : 'Disconnected');
      console.log('✅ Connection status updated to:', connected ? 'Connected' : 'Disconnected');
    });

    // Check initial connection status
    const initialConnectionStatus = socketManager.getConnectionStatus();
    console.log('🔍 Initial socket connection status:', initialConnectionStatus);
    if (initialConnectionStatus) {
      setIsSocketConnected(true);
      setConnectionStatus('Connected');
      console.log('✅ Initial connection status set to Connected');
    }

    socketManager.onRideRequest((data) => {
      console.log('🚗 New ride request received in context:', data);
      
      // Check if we're currently accepting a ride
      if (acceptingRideId) {
        console.log('🚫 Currently accepting another ride, ignoring new request:', data.rideId);
        return;
      }
      
      // Only add new ride request if we have less than 2 and it's not a duplicate
      setCurrentRideRequests((prev) => {
        if (prev.length >= 2 || prev.some(r => r.rideId === data.rideId)) {
          console.log('🚫 Already have 2 ride requests or duplicate, ignoring new one');
          return prev;
        }
        return [...prev, data];
      });
    });

    socketManager.onRideTaken((data) => {
      console.log('✅ Ride taken by another driver:', data);
      setCurrentRideRequests((prev) => prev.filter(r => r.rideId !== data.rideId));
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
        setCurrentRideRequests([]); // Clear all ride requests on busy error
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
      // Remove the ride request from the list
      setCurrentRideRequests((prev) => prev.filter(r => r.rideId !== data.rideId));
      // Reset accepting state
      setAcceptingRideId(null);
    });

    socketManager.onRideAcceptedWithDetails((data) => {
      console.log('✅ Ride accepted with details:', data);
      // Set the accepted ride details
      setAcceptedRideDetails(data);
      // Remove the ride request from the list
      setCurrentRideRequests((prev) => prev.filter(r => r.rideId !== data.rideId));
      // Reset accepting state
      setAcceptingRideId(null);
      // Add to processed rides
      setProcessedRideIds(prev => new Set([...prev, data.rideId]));
    });

    // Cleanup function
    return () => {
      socketManager.clearCallbacks();
    };
  }, [driverId, acceptingRideId, isSocketConnected]); // Add dependencies

  // Listen for driver status reset events
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.on('driver_status_reset', (data: any) => {
        console.log('🔄 Driver status reset event received:', data);
        // Reset all driver state
        setAcceptedRideDetails(null);
        setCurrentRideRequests([]); // Clear all ride requests on status reset
        setAcceptingRideId(null);
        setProcessedRideIds(new Set());
        
        // Send driver status as online
        socketManager.sendDriverStatus({
          driverId,
          status: 'online'
        });
      });
    }
  }, [driverId]);

  // Listen for driver cancellation success
  useEffect(() => {
    socketManager.onDriverCancellationSuccess((data) => {
      console.log('✅ Driver cancellation successful:', data);
      // Reset all driver state
      setAcceptedRideDetails(null);
      setCurrentRideRequests([]); // Clear all ride requests on cancellation success
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
  }, [driverId]);

  // Listen for driver cancellation error
  useEffect(() => {
    socketManager.onDriverCancellationError((data) => {
      console.log('❌ Driver cancellation failed:', data);
      Alert.alert('Cancellation Error', data.message || 'Failed to cancel ride');
    });
  }, [driverId]);

  // Send driver status when going online
  useEffect(() => {
    socketManager.sendDriverStatus({
      driverId,
      status: 'online'
    });
  }, [driverId]);

  const acceptRide = async (rideRequest: RideRequest) => {
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
    
    // Call backend endpoint to accept ride
    try {
      const clerkDriverId = await AsyncStorage.getItem('clerkDriverId');
      if (!clerkDriverId) {
        console.error('[acceptRide] No clerkDriverId found in AsyncStorage');
      } else {
        const url = `https://roqet-production.up.railway.app/rides/accept?rideId=${rideRequest.rideId}&clerkDriverId=${clerkDriverId}`;
        console.log('[acceptRide] Hitting backend endpoint:', url);
        // Get the Bearer token using the correct template
        const token = await getToken({ template: 'driver_app_token' });
        if (!token) {
          console.error('[acceptRide] No auth token found.');
        } else {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          console.log('[acceptRide] Backend response status:', response.status);
          const data = await response.json().catch(() => null);
          console.log('[acceptRide] Backend response data:', data);
        }
      }
    } catch (err) {
      console.error('[acceptRide] Error calling backend accept endpoint:', err);
    }
    
    setCurrentRideRequests((prev) => prev.filter(r => r.rideId !== rideRequest.rideId));
    
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
    
    setCurrentRideRequests((prev) => prev.filter(r => r.rideId !== rideRequest.rideId));
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
    setCurrentRideRequests([]); // Clear all ride requests on status reset
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
      currentRideRequests,
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