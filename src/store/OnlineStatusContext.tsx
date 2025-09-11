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
import LocationTrackingService from '../services/locationTrackingService';
import * as Location from 'expo-location';
import { stopAllNotificationSounds } from '../components/RideRequestScreen';

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
  // Fields provided by Socket.IO server with original backend ride ID
  backendRideId?: string;
  originalRideId?: string;
  // Additional fields that might contain the original backend ride ID
  estimatedFare?: number;
  status?: string;
  [key: string]: any; // Allow additional fields
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
  // Backend driver ID for location tracking
  backendDriverId?: string;
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
  
  // Location tracking service instance
  const locationTrackingService = LocationTrackingService.getInstance();

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

        // Initialize location tracking service
        await locationTrackingService.initialize(newDriverId);
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
      
      // Start location tracking when going online
      console.log('📍 Starting location tracking for driver:', driverId);
      locationTrackingService.startTracking({
        isOnline: true,
        timeInterval: 5000, // 5 seconds
        distanceInterval: 10, // 10 meters
        accuracy: Location.Accuracy.High,
      });
      
      // Log the current tracking status
      const trackingStatus = locationTrackingService.getTrackingStatus();
      console.log('📍 Location tracking status after starting:', trackingStatus);
    } else {
      // Stop location tracking when going offline
      console.log('📍 Stopping location tracking');
      locationTrackingService.stopTracking();
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
      console.log('🔍 Ride request rideId:', data.rideId);
      console.log('🔍 Full ride request data:', JSON.stringify(data, null, 2));
      console.log('🔍 All available fields:', Object.keys(data));
      console.log('🔍 Field values:', Object.values(data));
      
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
      
      // Stop notification sounds when ride is taken by another driver
      stopAllNotificationSounds();
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
        
        // Stop notification sounds when resetting due to busy error
        stopAllNotificationSounds();
        
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
      
      // Stop notification sounds when ride response is confirmed
      stopAllNotificationSounds();
    });

    socketManager.onRideAcceptedWithDetails((data) => {
      console.log('✅ Ride accepted with details:', data);
      
      // Extract backend driver ID from the API response
      // The backend driver ID is typically in the format: 943742b3-259e-45a3-801e-f5d98637cda6
      // We need to get this from the backend API response when the ride is accepted
      
      // For now, we'll use a placeholder that will be updated when we get the API response
      const rideRequestWithDriverId = {
        ...data,
        driverId: driverId, // Clerk user ID
        backendDriverId: '943742b3-259e-45a3-801e-f5d98637cda6', // Use known backend driver ID for now
        userId: data.userId || data.customerId // Ensure user ID is present
      };
      
      console.log('📍 Setting ride request with driver IDs:', {
        rideId: rideRequestWithDriverId.rideId,
        driverId: rideRequestWithDriverId.driverId, // Clerk user ID
        backendDriverId: rideRequestWithDriverId.backendDriverId, // Backend driver ID
        userId: rideRequestWithDriverId.userId
      });
      
      // Set the accepted ride details
      setAcceptedRideDetails(rideRequestWithDriverId);
      // Remove the ride request from the list
      setCurrentRideRequests((prev) => prev.filter(r => r.rideId !== data.rideId));
      
      // Stop notification sounds when ride is accepted with details
      stopAllNotificationSounds();
      
      // Set current ride request in location tracking service
      locationTrackingService.setCurrentRideRequest(rideRequestWithDriverId);
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
      
      // Don't automatically set driver status to online after cancellation
      // Let the driver manually choose when to go online
      console.log('🚫 Driver status not automatically reset after cancellation - manual action required');
      
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
    console.log('🔍 Ride ID from Socket.IO:', rideRequest.rideId);
    console.log('🔍 Full ride request data:', JSON.stringify(rideRequest, null, 2));
    
    // Try to extract the original backend ride ID
    let backendRideId = rideRequest.rideId;
    
    // Check if the rideId is in Socket.IO format (ride_timestamp_random)
    if (rideRequest.rideId.startsWith('ride_')) {
      console.log('⚠️ Detected Socket.IO ride ID format, attempting to extract original backend ride ID...');
      
      // Look for the original backend ride ID in the backendRideId field (provided by Socket.IO server)
      if (rideRequest.backendRideId && !rideRequest.backendRideId.startsWith('ride_')) {
        console.log('✅ Found original backend ride ID in backendRideId field:', rideRequest.backendRideId);
        backendRideId = rideRequest.backendRideId;
      } else if (rideRequest.originalRideId && !rideRequest.originalRideId.startsWith('ride_')) {
        console.log('✅ Found original backend ride ID in originalRideId field:', rideRequest.originalRideId);
        backendRideId = rideRequest.originalRideId;
      } else {
        console.log('❌ Could not find original backend ride ID');
        console.log('🔍 Available fields:', Object.keys(rideRequest));
        console.log('🔍 All field values:', Object.values(rideRequest));
        console.log('🔍 backendRideId:', rideRequest.backendRideId);
        console.log('🔍 originalRideId:', rideRequest.originalRideId);
      }
    } else {
      console.log('✅ Using ride ID as-is (appears to be backend format):', backendRideId);
    }
    
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
      let clerkDriverId = await AsyncStorage.getItem('clerkDriverId');
      if (!clerkDriverId) {
        console.error('[acceptRide] No clerkDriverId found in AsyncStorage');
        console.log('[acceptRide] Using driverId from JWT as fallback:', driverId);
        clerkDriverId = driverId; // Use driverId from JWT as fallback
      }
      
      if (clerkDriverId) {
        const url = `https://bike-taxi-production.up.railway.app/api/rides/${backendRideId}/accept`;
        console.log('[acceptRide] Hitting backend endpoint:', url);
        console.log('[acceptRide] Using ride ID:', backendRideId);
        console.log('[acceptRide] Expected backend ride ID format: UUID (e.g., dd75ffcd-5cb7-4721-a68e-89ee4485c4dd)');
        console.log('[acceptRide] Actual ride ID being used:', backendRideId);
        
        // Get the Bearer token using the correct template
        const token = await getToken({ template: 'driver_app_token' });
        if (!token) {
          console.error('[acceptRide] No auth token found.');
        } else {
          const response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'X-App-Version': '1.0.0',
              'X-Platform': 'ReactNative',
              'X-Environment': 'development',
            },
            body: JSON.stringify({
              driverId: clerkDriverId,
              driverName: 'Driver Name', // This should come from user data
              driverPhone: '+1234567890',
              estimatedArrival: '5 minutes'
            }),
          });
          console.log('[acceptRide] Backend response status:', response.status);
          const data = await response.json().catch(() => null);
          console.log('[acceptRide] Backend response data:', data);
          
          if (response.ok) {
            console.log('✅ Ride accepted successfully via backend API');
            
            // Extract the backend driver ID from the response
            let backendDriverId = null;
            if (data && data.driver && data.driver.id) {
              backendDriverId = data.driver.id;
              console.log('✅ Backend driver ID extracted from API response:', backendDriverId);
            } else {
              // Fallback to known backend driver ID for testing
              backendDriverId = '943742b3-259e-45a3-801e-f5d98637cda6';
              console.log('⚠️ Using fallback backend driver ID:', backendDriverId);
            }
            
            // Create a complete ride request object with all required fields
            const completeRideRequest = {
              rideId: backendRideId,
              userId: rideRequest.userId,
              pickup: rideRequest.pickup,
              drop: rideRequest.drop,
              rideType: rideRequest.rideType,
              price: rideRequest.price,
              driverId: driverId, // Clerk user ID
              backendDriverId: backendDriverId, // Backend driver ID
              driverName: 'Driver Name',
              driverPhone: '+1234567890',
              estimatedArrival: '5 minutes',
              status: 'accepted',
              createdAt: Date.now()
            };
            
            // Update the accepted ride details state
            setAcceptedRideDetails(completeRideRequest);
            
            // Update the location tracking service with the complete ride request
            locationTrackingService.setCurrentRideRequest(completeRideRequest);
            
            console.log('📍 Updated location tracking service with complete ride request:', {
              rideId: completeRideRequest.rideId,
              driverId: completeRideRequest.driverId,
              backendDriverId: completeRideRequest.backendDriverId,
              userId: completeRideRequest.userId
            });
            
            // Now call the start endpoint
            try {
              const startUrl = `https://bike-taxi-production.up.railway.app/api/rides/${backendRideId}/start`;
              console.log('[acceptRide] Hitting start endpoint:', startUrl);
              
              const startResponse = await fetch(startUrl, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  'X-App-Version': '1.0.0',
                  'X-Platform': 'ReactNative',
                  'X-Environment': 'development',
                },
              });
              
              console.log('[acceptRide] Start endpoint response status:', startResponse.status);
              const startData = await startResponse.json().catch(() => null);
              console.log('[acceptRide] Start endpoint response data:', startData);
              
              if (startResponse.ok) {
                console.log('✅ Ride started successfully via backend API');
              } else {
                console.error('❌ Failed to start ride via backend API:', startResponse.status);
                console.error('❌ Start response data:', startData);
              }
            } catch (startErr) {
              console.error('[acceptRide] Error calling backend start endpoint:', startErr);
            }
          } else {
            console.error('❌ Failed to accept ride via backend API:', response.status);
            console.error('❌ Response data:', data);
          }
        }
      } else {
        console.error('[acceptRide] No clerkDriverId available for API call');
      }
    } catch (err) {
      console.error('[acceptRide] Error calling backend accept endpoint:', err);
    }
    
    setCurrentRideRequests((prev) => prev.filter(r => r.rideId !== rideRequest.rideId));
    
    // Stop notification sounds when ride is accepted
    stopAllNotificationSounds();
    
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
    
    // Stop notification sounds when ride is rejected
    stopAllNotificationSounds();
  };

  const sendLocationUpdate = (data: { latitude: number; longitude: number; userId: string; driverId: string }) => {
    // Use the real driver ID from JWT
    const locationData = {
      ...data,
      driverId: driverId
    };
    socketManager.sendLocationUpdate(locationData);
    
    // Also update the location tracking service with current ride request
    if (acceptedRideDetails) {
      locationTrackingService.setCurrentRideRequest(acceptedRideDetails);
    }
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
    
    // Clear current ride request from location tracking service
    locationTrackingService.setCurrentRideRequest(null);
    
    // Stop notification sounds when resetting driver status
    stopAllNotificationSounds();
    
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