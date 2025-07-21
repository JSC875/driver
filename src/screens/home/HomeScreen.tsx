import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Easing, Image, ScrollView, Linking, Alert, Modal, Pressable, PanResponder, TextInput, Vibration, Platform } from 'react-native';
import MapView, { Marker, Polyline as MapPolyline, MapViewProps } from 'react-native-maps';
import { MaterialIcons, Ionicons, FontAwesome, Entypo, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import RideRequestScreen, { RideRequest, stopAllNotificationSounds } from '../../components/RideRequestScreen';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import Polyline from '@mapbox/polyline';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useAssignUserType } from '../../utils/helpers';
import { useOnlineStatus } from '../../store/OnlineStatusContext';
import socketManager from '../../utils/socket';
import * as Location from 'expo-location';
import { useRideHistory } from '../../store/RideHistoryContext';
import { useUserFromJWT } from '../../utils/jwtDecoder';
import { RideRequest as BackendRideRequest } from '../../store/OnlineStatusContext';

const { width, height } = Dimensions.get('window');

// Add at the top, after imports
function goToHome(navigation: any) {
  navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
}

function CancelRideModal({ visible, onClose, onConfirm }: { visible: boolean; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const cancelReasons = [
    'Passenger not found at pickup location',
    'Passenger requested cancellation',
    'Vehicle breakdown',
    'Traffic/road conditions',
    'Personal emergency',
    'Unsafe pickup location',
    'Other'
  ];

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason);
      setSelectedReason('');
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)'] }),
      justifyContent: 'center',
      alignItems: 'center',
      opacity: anim,
      zIndex: 10000,
    }}>
      <Animated.View style={{
        width: width - 40,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
      }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#222', marginBottom: 16, textAlign: 'center' }}>
          Cancel Ride
        </Text>
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 20, textAlign: 'center' }}>
          Please select a reason for cancelling this ride
        </Text>
        
        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
          {cancelReasons.map((reason, index) => (
            <TouchableOpacity
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: selectedReason === reason ? '#e3f2fd' : '#f8f9fa',
                marginBottom: 8,
                borderWidth: 2,
                borderColor: selectedReason === reason ? '#1877f2' : 'transparent',
              }}
              onPress={() => setSelectedReason(reason)}
              activeOpacity={0.7}
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: selectedReason === reason ? '#1877f2' : '#ccc',
                backgroundColor: selectedReason === reason ? '#1877f2' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                {selectedReason === reason && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
              </View>
              <Text style={{
                fontSize: 15,
                color: selectedReason === reason ? '#1877f2' : '#333',
                fontWeight: selectedReason === reason ? '600' : '400',
                flex: 1,
              }}>
                {reason}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#f8f9fa',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#e0e0e0',
            }}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#666', fontWeight: '600', fontSize: 16 }}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: selectedReason ? '#ff4444' : '#ccc',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
            }}
            onPress={handleConfirm}
            disabled={!selectedReason}
            activeOpacity={selectedReason ? 0.7 : 1}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Cancel Ride</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function SOSModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center', width: 320, elevation: 12 }}>
          <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#222', textAlign: 'center', flex: 1 }}>Call</Text>
            <Pressable onPress={onClose} style={{ marginLeft: 10 }}>
              <Ionicons name="close-circle" size={32} color="#222" />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 }}>
            <TouchableOpacity
              style={{ alignItems: 'center' }}
              onPress={() => Linking.openURL('tel:108')}
            >
              <View style={{ backgroundColor: '#3EC6FF', borderRadius: 50, width: 90, height: 90, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <FontAwesome5 name="ambulance" size={48} color="#fff" />
              </View>
              <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#222' }}>AMBULANCE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ alignItems: 'center' }}
              onPress={() => Linking.openURL('tel:100')}
            >
              <View style={{ backgroundColor: '#FF3B30', borderRadius: 50, width: 90, height: 90, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <FontAwesome5 name="user-shield" size={48} color="#fff" />
              </View>
              <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#222' }}>POLICE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Helper: Geocode address to lat/lng
async function geocodeAddress(address: string, apiKey: string) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    // Log the response for debugging
    console.log('Geocoding response:', data);
    
    if (data.status === 'REQUEST_DENIED') {
      console.error('Google Maps API key error:', data.error_message);
      throw new Error('API key error: ' + data.error_message);
    }
    
    if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('Google Maps API quota exceeded');
      throw new Error('API quota exceeded');
    }
    
    if (data.results && data.results[0]) {
      return data.results[0].geometry.location;
    }
    
    console.error('No geocoding results for address:', address);
    throw new Error('No geocoding results found');
  } catch (error) {
    console.error('Geocoding error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error('Geocoding failed: ' + errorMessage);
  }
}

// Helper: Fetch directions and decode polyline
async function fetchRoute(from: {lat: number, lng: number}, to: {lat: number, lng: number}, apiKey: string) {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    // Log the response for debugging
    console.log('Directions API response:', data);
    
    if (data.status === 'REQUEST_DENIED') {
      console.error('Google Maps API key error:', data.error_message);
      throw new Error('API key error: ' + data.error_message);
    }
    
    if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('Google Maps API quota exceeded');
      throw new Error('API quota exceeded');
    }
    
    if (data.routes && data.routes[0]) {
      const points = Polyline.decode(data.routes[0].overview_polyline.points);
      const polyline = points.map(([latitude, longitude]: [number, number]) => ({ latitude, longitude }));
      const leg = data.routes[0].legs[0];
      const distance = leg?.distance?.text || '';
      const duration = leg?.duration?.text || '';
      return { polyline, distance, duration };
    }
    
    console.error('No routes found');
    throw new Error('No routes found');
  } catch (error) {
    console.error('Directions fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error('Directions fetch failed: ' + errorMessage);
  }
}

// Add a fallback for when geocoding fails
const GOOGLE_MAPS_API_KEY = 'AIzaSyDHN3SH_ODlqnHcU9Blvv2pLpnDNkg03lU';

// Add a fallback function for when geocoding fails
const getFallbackCoordinates = (address: string) => {
  // Return default coordinates for Hyderabad if geocoding fails
  return { lat: 17.4375, lng: 78.4483 };
};

const MenuModal = ({ visible, onClose, onNavigate, halfScreen, onLogout }: { visible: boolean; onClose: () => void; onNavigate: (screen: string) => void; halfScreen?: boolean; onLogout: () => void }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Animated.View style={{
          backgroundColor: '#fff',
          borderTopRightRadius: 24,
          borderBottomRightRadius: 24,
          padding: 28,
          width: Math.round(width * 0.7),
          height: '100%',
          elevation: 16,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 15 },
          alignItems: 'stretch',
          justifyContent: 'flex-start',
        }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 18, textAlign: 'center' }}>Menu</Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => { onNavigate('Home'); onClose(); }}>
            <Ionicons name="home" size={24} color="#1877f2" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#222' }}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => { onNavigate('Refer'); onClose(); }}>
            <Ionicons name="gift" size={26} color="#1877f2" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#222' }}>Refer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => { onNavigate('RideHistory'); onClose(); }}>
            <Ionicons name="time" size={24} color="#1877f2" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#222' }}>Ride History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => { onNavigate('Wallet'); onClose(); }}>
            <Ionicons name="wallet" size={24} color="#1877f2" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#222' }}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => { onNavigate('Settings'); onClose(); }}>
            <Ionicons name="settings" size={24} color="#1877f2" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#222' }}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => { onNavigate('HelpSupport'); onClose(); }}>
            <Ionicons name="help-circle" size={24} color="#1877f2" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#222' }}>Support</Text>
          </TouchableOpacity>
          <View style={{ borderTopWidth: 1, borderTopColor: '#eee', marginVertical: 16 }} />
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={onLogout}>
            <Ionicons name="log-out" size={24} color="#FF3B30" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FF3B30' }}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
        {/* Always render the overlay for closing */}
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={onClose} activeOpacity={1} />
      </View>
    </Modal>
  );
};

export default function HomeScreen() {
  const { user, isLoaded } = useUser();
  const { getToken, signOut } = useAuth();
  const navigation = useNavigation<NavigationProp<any>>();
  const { getUserInfo } = useUserFromJWT();
  const { 
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
  } = useOnlineStatus();
  const [isSOSVisible, setSOSVisible] = useState(false);
  const [showOfflineScreen, setShowOfflineScreen] = useState(false);
  const swipeX = useRef(new Animated.Value(0)).current;
  const offlineSwipeX = useRef(new Animated.Value(0)).current;
  const SWIPE_WIDTH = width - 48;
  const SWIPE_THRESHOLD = SWIPE_WIDTH * 0.6;
  const lastHaptic = useRef(Date.now());
  const [rideRequest, setRideRequest] = useState<RideRequest | null>(null);
  const sosAnim = useRef(new Animated.Value(1)).current;
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [currentRideToCancel, setCurrentRideToCancel] = useState<RideRequest | null>(null);
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const [isSwiping, setIsSwiping] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null); // Typed ref for MapView
  const [isLocating, setIsLocating] = useState(false);
  const { addRide } = useRideHistory();
  const [currentRideRequests, setCurrentRideRequests] = useState<BackendRideRequest[]>([]); // local mirror if needed

  // Helper functions for driver status display
  const getDriverStatusColor = () => {
    if (!isSocketConnected) return '#FF3B30'; // Red for disconnected
    if (acceptedRideDetails) return '#FF9500'; // Orange for busy/on ride
    if (currentRideRequest) return '#007AFF'; // Blue for considering ride
    return '#00C853'; // Green for available
  };

  const getDriverStatusText = () => {
    if (!isSocketConnected) return 'OFFLINE';
    if (acceptedRideDetails) return 'ON RIDE';
    if (currentRideRequest) return 'CONSIDERING';
    return 'AVAILABLE';
  };

  useEffect(() => {
    if (!isLoaded) return;
    // Check for required documents - removed navigation reset to prevent errors
    const meta = user?.unsafeMetadata || {};
    if (!meta.bikeFrontPhoto || !meta.bikeBackPhoto || !meta.licensePhoto || !meta.rcPhoto || !meta.aadharPhoto || !meta.panPhoto) {
      console.log('Missing documents detected, but navigation reset removed to prevent errors');
    }
  }, [isLoaded, user]);

  useAssignUserType('driver');

  // PanResponder for swipe to go online gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isOnline,
      onMoveShouldSetPanResponder: (_, gesture) => !isOnline && Math.abs(gesture.dx) > 5,
      onPanResponderGrant: () => {
        if (Platform.OS === 'android') {
          Vibration.vibrate([0, 2000], true);
        }
      },
      onPanResponderMove: (e, gestureState) => {
        if (isOnline) return;
        let newX = gestureState.dx;
        if (newX < 0) newX = 0;
        if (newX > SWIPE_WIDTH - 56) newX = SWIPE_WIDTH - 56;
        swipeX.setValue(newX);
        // Throttle haptic feedback
        const now = Date.now();
        if (now - lastHaptic.current > 60) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          lastHaptic.current = now;
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (Platform.OS === 'android') {
          Vibration.cancel();
        }
        if (isOnline) return;
        if (gestureState.dx > SWIPE_THRESHOLD) {
          Animated.timing(swipeX, {
            toValue: SWIPE_WIDTH - 56,
            duration: 120,
            useNativeDriver: false,
          }).start(async () => {
            setIsOnline(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Fetch JWT token when going online
            if (user?.unsafeMetadata?.type === 'driver') {
              try {
                const onlineToken = await getToken({ template: 'driver_app_token' });
                console.log('Custom Clerk JWT (online):', onlineToken);
                // Call backend to get user by Clerk ID
                if (user.id && onlineToken) {
                  try {
                    const response = await fetch(`https://roqet-production.up.railway.app/users/getUserByClerkUserId/${user.id}`, {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${onlineToken}`,
                        'Content-Type': 'application/json',
                      },
                    });
                    const text = await response.text();
                    console.log('Backend response status:', response.status);
                    console.log('Backend response text:', text);
                    let data = null;
                    try {
                      data = text ? JSON.parse(text) : null;
                    } catch (e) {
                      console.error('Failed to parse backend response as JSON:', e);
                    }
                    console.log('Backend user response:', data);
                  } catch (err) {
                    console.error('Failed to fetch user from backend:', err);
                  }
                }
              } catch (err) {
                console.error('Failed to fetch custom JWT on go online:', err);
              }
            }
          });
        } else {
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (Platform.OS === 'android') {
          Vibration.cancel();
        }
        Animated.spring(swipeX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  // PanResponder for swipe to go offline gesture
  const offlineSwipeWidth = width * 0.9; // 90% width to match modal
  const offlineSwipeThreshold = offlineSwipeWidth * 0.6;
  
  // Create PanResponder function that always uses current state values
  const createOfflinePanResponder = () => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => {
        return isOnline && showOfflineScreen;
      },
      onMoveShouldSetPanResponder: (_, gesture) => {
        return isOnline && showOfflineScreen && Math.abs(gesture.dx) > 5;
      },
      onPanResponderGrant: () => {
        if (Platform.OS === 'android') {
          Vibration.vibrate([0, 2000], true);
        }
      },
      onPanResponderMove: (e, gestureState) => {
        if (!isOnline || !showOfflineScreen) return;
        let newX = gestureState.dx;
        if (newX < 0) newX = 0;
        if (newX > offlineSwipeWidth - 56) newX = offlineSwipeWidth - 56;
        offlineSwipeX.setValue(newX);
        // Throttle haptic feedback
        const now = Date.now();
        if (now - lastHaptic.current > 60) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          lastHaptic.current = now;
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (Platform.OS === 'android') {
          Vibration.cancel();
        }
        if (!isOnline || !showOfflineScreen) return;
        if (gestureState.dx > offlineSwipeThreshold) {
          Animated.timing(offlineSwipeX, {
            toValue: offlineSwipeWidth - 56,
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            setIsOnline(false);
            setShowOfflineScreen(false);
            // Reset the main swipe bar to its default position
            Animated.spring(swipeX, {
              toValue: 0,
              useNativeDriver: false,
            }).start();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            goToHome(navigation);
          });
        } else {
          Animated.spring(offlineSwipeX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (Platform.OS === 'android') {
          Vibration.cancel();
        }
        Animated.spring(offlineSwipeX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      },
    });
  };
  
  // Create PanResponder instance
  const offlinePanResponder = createOfflinePanResponder();

  const resetOnline = () => {
    setIsOnline(false);
    Animated.spring(swipeX, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  };

  const goOffline = () => {
    setShowOfflineScreen(true);
    Animated.spring(offlineSwipeX, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  };

  const cancelOffline = () => {
    setShowOfflineScreen(false);
    Animated.spring(offlineSwipeX, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  };

  function mapBackendRideRequestToUI(backendRide: BackendRideRequest) {
    return {
      id: backendRide.rideId,
      price: `₹${backendRide.price}`,
      type: backendRide.rideType || 'Mini',
      tag: 'Hyderabad',
      rating: '4.95',
      verified: true,
      pickup: backendRide.pickup.address || backendRide.pickup.name || 'Pickup Location',
      pickupAddress: backendRide.pickup.address || backendRide.pickup.name || 'Pickup Location',
      dropoff: backendRide.drop.address || backendRide.drop.name || 'Drop Location',
      dropoffAddress: backendRide.drop.address || backendRide.drop.name || 'Drop Location',
      pickupDetails: backendRide.pickup,
      dropoffDetails: backendRide.drop,
    };
  }

  const handleAcceptRide = (ride: BackendRideRequest) => {
    acceptRide(ride);
  };

  const handleRejectRide = (ride: BackendRideRequest) => {
    rejectRide(ride);
  };

  const handleCancelRide = (ride: RideRequest) => {
    setCurrentRideToCancel(ride);
    setCancelModalVisible(true);
  };

  const handleConfirmCancelRide = (reason: string) => {
    if (currentRideToCancel) {
      // Get the current ride details from acceptedRideDetails or rideRequest
      const rideToCancel = acceptedRideDetails || currentRideRequest;
      
      if (rideToCancel) {
        // Cancel ride via socket
        socketManager.cancelRide({
          rideId: rideToCancel.rideId,
          driverId: user?.id || 'driver123',
          reason: reason
        });
        
        console.log('🚫 Driver cancelling ride:', {
          rideId: rideToCancel.rideId,
          reason: reason
        });
      }

      // Add to ride history with cancellation reason
      addRide({
        id: currentRideToCancel.id + '-' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        from: currentRideToCancel.pickupAddress || '',
        to: currentRideToCancel.dropoffAddress || '',
        driver: user?.fullName || 'You',
        fare: Number(String(currentRideToCancel.price).replace(/[^\d.]/g, '')) || 0,
        distance: 0,
        duration: 0,
        status: 'cancelled',
        cancellationReason: reason,
      });

      // Close modals and reset state
      setCancelModalVisible(false);
      setCurrentRideToCancel(null);
      
      // Note: Navigation will be handled by the driver_cancellation_success event
      // in the OnlineStatusContext
    }
  };

  const handleRideCompleted = (rideId: string) => {
    // Complete the ride on the server
    completeRide(rideId);
    
    // Reset driver status when ride is completed
    resetDriverStatus();
    console.log('✅ Ride completed, driver status reset to available');
  };

  const isRideActive = !!(rideRequest);

  // Play haptic feedback on ride request
  useEffect(() => {
    if (rideRequest) {
      // Play haptic feedback immediately
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [rideRequest]);

  // Type guard for address object
  function hasAddress(obj: any): obj is { address: string } {
    return obj && typeof obj === 'object' && typeof obj.address === 'string';
  }

  // Handle incoming ride requests from socket
  useEffect(() => {
    let isMounted = true;
    async function setRideWithRoute() {
      if (currentRideRequest && isOnline) {
        // Log pickup and dropoff details for debugging
        console.log('✅ New ride request received:', currentRideRequest.rideId);
        console.log('Pickup details received:', currentRideRequest.pickup);
        console.log('Dropoff details received:', currentRideRequest.drop);
        // Get coordinates
        const pickupCoords = currentRideRequest.pickup;
        const dropoffCoords = currentRideRequest.drop;
        let pickup = '...';
        let dropoff = '...';
        try {
          if (pickupCoords && dropoffCoords && pickupCoords.latitude && pickupCoords.longitude && dropoffCoords.latitude && dropoffCoords.longitude) {
            const route = await fetchRoute(
              { lat: pickupCoords.latitude, lng: pickupCoords.longitude },
              { lat: dropoffCoords.latitude, lng: dropoffCoords.longitude },
              GOOGLE_MAPS_API_KEY
            );
            pickup = `${route.duration} (${route.distance}) away`;
            dropoff = `${route.duration} (${route.distance}) trip`;
          } else {
            pickup = currentRideRequest.pickup.address || currentRideRequest.pickup.name || 'Pickup Location';
            dropoff = currentRideRequest.drop.address || currentRideRequest.drop.name || 'Drop Location';
          }
        } catch (e) {
          console.error('Failed to fetch real route info:', e);
          pickup = currentRideRequest.pickup.address || currentRideRequest.pickup.name || 'Pickup Location';
          dropoff = currentRideRequest.drop.address || currentRideRequest.drop.name || 'Drop Location';
        }
        // Convert socket ride request to local format
        const localRideRequest: RideRequest = {
          id: currentRideRequest.rideId,
          price: `₹${currentRideRequest.price}`,
          type: currentRideRequest.rideType || 'Mini',
          tag: 'Hyderabad',
          rating: '4.95',
          verified: true,
          pickup,
          pickupAddress: currentRideRequest.pickup.address || currentRideRequest.pickup.name || 'Pickup Location',
          dropoff,
          dropoffAddress: currentRideRequest.drop.address || currentRideRequest.drop.name || 'Drop Location',
          // Store detailed location information for navigation
          pickupDetails: currentRideRequest.pickup,
          dropoffDetails: currentRideRequest.drop,
        };
        // Log what will be used for the map
        console.log('pickupDetails for map:', localRideRequest.pickupDetails);
        console.log('dropoffDetails for map:', localRideRequest.dropoffDetails);
        if (isMounted) {
          setRideRequest(localRideRequest);
          // Play haptic feedback for new ride request
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    }
    setRideWithRoute();
    return () => { isMounted = false; };
  }, [currentRideRequest, isOnline]);





  // Add logout handler
  const handleLogout = async () => {
    await signOut();
    goToHome(navigation);
  };



  useEffect(() => {
    if (acceptedRideDetails) {
      // Convert acceptedRideDetails to local RideRequest format
      const localRideRequest: RideRequest = {
        id: acceptedRideDetails.rideId,
        price: `₹${acceptedRideDetails.price}`,
        type: acceptedRideDetails.rideType || 'Mini',
        tag: 'Hyderabad',
        rating: '4.95',
        verified: true,
        pickup: '5 min (2.1 km) away',
        pickupAddress: acceptedRideDetails.pickup.address || acceptedRideDetails.pickup.name || 'Pickup Location',
        dropoff: '25 min (12.3 km) trip',
        dropoffAddress: acceptedRideDetails.drop.address || acceptedRideDetails.drop.name || 'Drop Location',
        pickupDetails: acceptedRideDetails.pickup,
        dropoffDetails: acceptedRideDetails.drop,
      };
      setRideRequest(localRideRequest);
      
      // Navigate to NavigationScreen with the correct ride data including rideId and driverId
      const navigationRide = {
        ...localRideRequest,
        rideId: acceptedRideDetails.rideId,
        driverId: acceptedRideDetails.driverId,
        userId: acceptedRideDetails.userId,
      };
      
      console.log('🚗 Navigating to NavigationScreen with ride data:', navigationRide);
      navigation.navigate('NavigationScreen', { ride: navigationRide });
    }
  }, [acceptedRideDetails, navigation]);

  // Listen for driver cancellation success
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (socket) {
      const handleDriverCancellationSuccess = (data: any) => {
        console.log('✅ Driver cancellation success received in HomeScreen:', data);
        // Navigate to home screen after successful cancellation
        navigation.navigate('Home');
      };

      socket.on('driver_cancellation_success', handleDriverCancellationSuccess);

      return () => {
        socket.off('driver_cancellation_success', handleDriverCancellationSuccess);
      };
    }
  }, [navigation]);

  // Request location permission on mount or when going online
  useEffect(() => {
    async function requestLocationPermission() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission is required to receive ride requests.');
      }
    }
    requestLocationPermission();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom', 'left', 'right']}>
      {/* StatusBar background fix for edge-to-edge */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: '#fff', zIndex: 10000 }} />
      <StatusBar barStyle="dark-content" translucent />
      {/* Map */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 17.4375, // Example: Hyderabad
          longitude: 78.4483,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        scrollEnabled={isOnline}
        zoomEnabled={isOnline}
        rotateEnabled={isOnline}
        pitchEnabled={isOnline}
      />
      {/* Overall Offline Overlay */}
      {!isOnline && !isRideActive && !showOfflineScreen && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1000,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Offline Icon */}
          <View
            style={{
              backgroundColor: '#B0B3B8',
              borderRadius: 50,
              width: 80,
              height: 80,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              shadowColor: '#B0B3B8',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Ionicons name="wifi-outline" size={40} color="#222" />
            {/* Diagonal slash overlay */}
            <View
              style={{
                position: 'absolute',
                width: 60,
                height: 6,
                backgroundColor: '#333333',
                borderRadius: 3,
                top: 37,
                left: 10,
                transform: [{ rotate: '-25deg' }],
                opacity: 0.95,
              }}
            />
          </View>
          
          {/* Offline Text */}
          <Text
            style={{
              fontSize: 34,
              fontWeight: '900',
              color: '#222',
              textAlign: 'center',
              textShadowColor: 'rgba(255,255,255,0.7)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 6,
              letterSpacing: 0.5,
              marginTop: 4,
            }}
          >
            You're Offline
          </Text>
        </View>
      )}

      {/* Go Offline Confirmation Modal */}
      <Modal
        visible={showOfflineScreen && isOnline}
        animationType="slide"
        transparent={false}
        onRequestClose={cancelOffline}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: '#fff',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            paddingTop: insets.top + 24,
            paddingHorizontal: 0,
          }}
          pointerEvents="box-none"
        >
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginLeft: 24, marginBottom: 24, color: '#111' }}>Recommended for you</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 24, marginBottom: 16 }}>
            <Ionicons name="compass-outline" size={22} color="#111" style={{ marginRight: 8 }} />
            <TouchableOpacity onPress={() => Alert.alert('Driving Time', 'Driving time feature coming soon!')}>
              <Text style={{ fontSize: 16, color: '#111' }}>See driving time</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={{ marginLeft: 24, marginBottom: 32 }} onPress={() => Alert.alert('Waybill', 'Waybill feature coming soon!')}>
            <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '500' }}>Waybill</Text>
          </TouchableOpacity>

          {/* Swipe to Go Offline Bar (modal, 90% width, bottom, working like online swipe) */}
          <View
            style={{
              position: 'absolute',
              left: '5%',
              right: '5%',
              bottom: insets.bottom > 0 ? insets.bottom + 16 : 32,
              width: '90%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
            }}
            pointerEvents="box-none"
          >
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'green',
                borderRadius: 36,
                paddingVertical: 20,
                paddingHorizontal: 28,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 12,
                elevation: 10,
              }}
              {...offlinePanResponder.panHandlers}
            >
              <Animated.View
                style={{
                position: 'absolute',
                left: offlineSwipeX,
                top: 0,
                bottom: 0,
                  width: 66,
                  height: 66,
                  borderRadius: 32,
                  backgroundColor: '#26304A',
                alignItems: 'center',
                justifyContent: 'center',
                  shadowColor: '#26304A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 8,
                elevation: 8,
                zIndex: 2,
                }}
              >
                <Ionicons name="arrow-forward" size={36} color="#fff" />
              </Animated.View>
              <Text
                style={{
                color: '#fff',
                fontWeight: 'bold',
                  fontSize: 18,
                  marginLeft: 80,
                letterSpacing: 0.5,
                zIndex: 1,
                }}
              >
                Swipe to go offline
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Top Bar Overlay */}
      <Animated.View
        style={[
          styles.topBar,
          {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 10,
            backgroundColor: 'rgba(255,255,255,0.96)',
            borderRadius: 18,
            margin: 16,
            paddingHorizontal: 16,
            paddingVertical: 8,
            alignSelf: 'center',
            width: '92%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 2000, // Ensure always above overlays
          },
        ]}
      >
        {/* Hamburger/Menu Button */}
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Entypo name="menu" size={28} color="#222" />
          <View style={styles.badge}><Text style={styles.badgeText}>1</Text></View>
        </TouchableOpacity>
        <View style={styles.speedPill}>
          <Text style={styles.speedZero}>0</Text>
          <Text style={styles.speedZero}> | </Text>
          <Text style={styles.speedLimit}>80</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Driver Status Indicator */}
          {isOnline && (
            <View style={{
              backgroundColor: getDriverStatusColor(),
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              marginRight: 8,
            }}>
              <Text style={{
                color: '#fff',
                fontSize: 10,
                fontWeight: 'bold',
              }}>
                {getDriverStatusText()}
              </Text>
              <Text style={{
                color: '#fff',
                fontSize: 8,
                fontWeight: 'bold',
                marginTop: 2,
              }}>
                {isSocketConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle" size={32} color="#222" />
          </TouchableOpacity>
        </View>
      </Animated.View>
      {/* Floating location icon - now outside the top bar, truly floating at right mid-screen */}
      {isOnline && (
        <TouchableOpacity
          disabled={isLocating}
        style={{
          position: 'absolute',
            right: 20,
            top: '50%',
            transform: [{ translateY: -32 }],
          backgroundColor: '#fff',
            borderRadius: 32,
            padding: 16,
            elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
            zIndex: 2100,
            opacity: isLocating ? 0.6 : 1,
          }}
          onPress={async () => {
            setIsLocating(true);
            try {
              // Try to get last known position instantly
              let location = await Location.getLastKnownPositionAsync();
              if (location && mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }, 1000);
              }
              // Now fetch a fresh position in the background (Balanced accuracy)
              let freshLocation = null;
              try {
                freshLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
              } catch (err1) {
                // If Balanced fails, try Highest
                try {
                  freshLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
                } catch (err2) {
                  console.log('Balanced accuracy also failed:', err2);
                  const errMsg = (err2 && typeof err2 === 'object' && 'message' in err2) ? (err2 as Error).message : '';
                  Alert.alert('Error', `Failed to fetch current location. Try going outdoors or enabling location services. ${errMsg}`);
                  setTimeout(() => setIsLocating(false), 2000);
                  return;
                }
              }
              if (freshLocation && mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: freshLocation.coords.latitude,
                  longitude: freshLocation.coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }, 1000);
                
                // Send location update to socket server if online
                if (isOnline && isSocketConnected && location && currentRideRequest) {
                  sendLocationUpdate({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    userId: currentRideRequest.userId, // Use actual user ID from active ride
                    driverId: 'driver_001'
                  });
                }
              }
            } catch (error) {
              console.log('Location error:', error);
              const errMsg = (error && typeof error === 'object' && 'message' in error) ? (error as Error).message : '';
              Alert.alert('Error', `Failed to fetch current location. ${errMsg}`);
            } finally {
              setTimeout(() => setIsLocating(false), 2000); // debounce for 2 seconds
            }
          }}
        >
          <Ionicons name="navigate" size={32} color="#1877f2" />
        </TouchableOpacity>
      )}
      {/* Bottom Online/Offline Bar */}
      <SafeAreaView style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'transparent', paddingBottom: insets.bottom > 0 ? insets.bottom : 16, zIndex: 10000 }} edges={['bottom']}>
        {isOnline && !isRideActive && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 10 }}>
            <View style={{
              width: '94%',
              marginBottom: -30,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fff',
              borderRadius: 32,
              paddingVertical: 16,
              paddingHorizontal: 18,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.10,
              shadowRadius: 8,
              elevation: 8,
              alignSelf: 'center',
              
            }}>
              {/* Center Text */}
              <Text style={{
                color: '#00C853',
                fontWeight: 'bold',
                fontSize: 30,
                letterSpacing: 0.5,
                textAlign: 'center',
                flex: 1,
              }}>
                You're online
              </Text>
              {/* Hamburger Icon (right) */}
              <TouchableOpacity 
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  elevation: 2,
                }}
                onPress={goOffline}
                activeOpacity={0.8}
              >
                <Entypo name="menu" size={28} color="#222" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
      {/* Swipe to Go Online Bar (show only if offline and not in ride) */}
      {!isOnline && !isRideActive && (
        <SafeAreaView style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom > 0 ? insets.bottom + 16 : 32, zIndex: 10000 }} edges={['bottom']}>
          <View style={{
            width: '90%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '5%',
          }}>
            {/* Safety Toolkit Icon - left of swipe bar */}

            {/* Swipe Bar */}
            <View style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#1A2233',
              borderRadius: 32,
              paddingVertical: 20,
              paddingHorizontal: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 12,
              elevation: 10,
              overflow: 'hidden',
            }}
              {...panResponder.panHandlers}
            >
              {/* Gradient Progress Bar Background */}
              <Animated.View style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: swipeX.interpolate({
                  inputRange: [0, SWIPE_WIDTH - 56],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
                zIndex: 1,
              }}>
                <LinearGradient
                  colors={['#B9F6CA', '#00C853', '#009624']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1, borderRadius: 32 }}
                />
                {/* Ripple shimmer effect */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    left: rippleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (SWIPE_WIDTH - 56) * 0.7],
                    }),
                    top: 0,
                    bottom: 0,
                    width: 60,
                    opacity: 0.35,
                    zIndex: 2,
                  }}
                  pointerEvents="none"
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.2)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, borderRadius: 32 }}
                  />
                </Animated.View>
              </Animated.View>
              <Animated.View style={{
                position: 'absolute',
                left: swipeX,
                top: 0,
                bottom: 0,
                width: 66,
                height: 66,
                borderRadius: 28,
                backgroundColor: 'green',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#26304A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 8,
                elevation: 8,
                zIndex: 3,
              }}>
                <Ionicons name="arrow-forward" size={32} color="#fff" />
            </Animated.View>
              <Text style={{
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 20,
                marginLeft: 70,
                letterSpacing: 0.5,
                zIndex: 4,
              }}>
                Swipe to go online
              </Text>
          </View>
      </View>
        </SafeAreaView>
      )}
      {/* SOS Button (show only when online) */}
      {isOnline && (
        <Animated.View style={{
          position: 'absolute',
          top: '35%',
          right: 7,
          zIndex: 1000,
          shadowColor: '#FF3B30',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 12,
        }}>
        <TouchableOpacity
            style={{
              backgroundColor: '#FF3B30',
              borderRadius: 32,
              width: 64,
              height: 64,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#FF3B30',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 12,
            }}
        onPress={() => setSOSVisible(true)}
            activeOpacity={0.85}
        >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, letterSpacing: 1 }}>SOS</Text>
        </TouchableOpacity>
        </Animated.View>
      )}
      {/* SOS Modal */}
      <SOSModal visible={isSOSVisible} onClose={() => setSOSVisible(false)} />
      {/* Ride Request Modal */}
      {rideRequest && (
        <RideRequestScreen
          ride={rideRequest}
          onClose={async () => {
            await stopAllNotificationSounds(); // Safety net
            setRideRequest(null);
          }}
          onAccept={handleAcceptRide}
          onReject={handleRejectRide}
          playSound={!acceptedRideDetails} // Only play sound for new requests
        />
      )}
      {/* Dual notification card UI */}
      {isOnline && currentRideRequests && currentRideRequests.length > 0 && (
        <View
          style={{
            position: 'absolute',
            top: '18%',
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 9999,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          {currentRideRequests.slice(0, 2).map((ride, idx) => {
            const uiRide = mapBackendRideRequestToUI(ride);
            return (
              <View
                key={uiRide.id}
                style={{
                  width: currentRideRequests.length === 1 ? '90%' : '44%',
                  marginRight: idx === 0 && currentRideRequests.length === 2 ? 16 : 0,
                  shadowColor: idx === 0 ? '#007AFF' : '#FF9500',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                  elevation: 16,
                  borderRadius: 24,
                  overflow: 'visible',
                  backgroundColor: '#fff',
                }}
              >
                <RideRequestScreen
                  ride={uiRide}
                  onClose={() => handleRejectRide(ride)}
                  onAccept={() => handleAcceptRide(ride)}
                  onReject={() => handleRejectRide(ride)}
                />
              </View>
            );
          })}
        </View>
      )}
      <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={(screen) => {
          setMenuVisible(false);
            navigation.navigate(screen as never);
        }}
        halfScreen={false}
        onLogout={handleLogout}
      />
      {/* Safety Toolkit Modal */}
      <Modal
        visible={safetyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSafetyModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.25)' }}>
          <View style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 16,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 32,
            paddingHorizontal: 0,
            minHeight: 420,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 20,
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 8 }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#222' }}>Safety Toolkit</Text>
              <TouchableOpacity onPress={() => setSafetyModalVisible(false)}>
                <Ionicons name="close" size={28} color="#222" />
              </TouchableOpacity>
    </View>
            {/* List */}
            <ScrollView style={{ paddingHorizontal: 8 }} showsVerticalScrollIndicator={false}>
              {/* Emergency Contacts */}
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 16 }}>
                <Ionicons name="alert-circle" size={28} color="#FF3B30" style={{ marginRight: 18 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#222' }}>Emergency Contacts</Text>
                  <Text style={{ color: '#666', fontSize: 14 }}>Contact emergency services.</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#bbb" />
              </TouchableOpacity>
              {/* Record Audio */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 16 }}>
                <Ionicons name="mic" size={26} color="#222" style={{ marginRight: 18 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#222' }}>Record audio</Text>
                  <Text style={{ color: '#666', fontSize: 14 }}>Record audio during your trips.</Text>
                </View>
                <TouchableOpacity style={{ backgroundColor: '#eee', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6 }}>
                  <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 14 }}>Set up</Text>
                </TouchableOpacity>
              </View>
              {/* Follow my ride */}
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 16 }}>
                <Ionicons name="radio-outline" size={26} color="#222" style={{ marginRight: 18 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#222' }}>Follow my ride</Text>
                  <Text style={{ color: '#666', fontSize: 14 }}>Share your location and trip status.</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#bbb" />
              </TouchableOpacity>
              {/* Proof of trip status */}
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 16 }}>
                <Ionicons name="image-outline" size={26} color="#222" style={{ marginRight: 18 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#222' }}>Proof of trip status</Text>
                  <Text style={{ color: '#666', fontSize: 14 }}>Show law enforcement your current status.</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#bbb" />
              </TouchableOpacity>
              {/* Safety Hub */}
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 16 }}>
                <Ionicons name="shield-outline" size={26} color="#222" style={{ marginRight: 18 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#222' }}>Safety Hub</Text>
                  <Text style={{ color: '#666', fontSize: 14 }}>View your safety settings and resources.</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#bbb" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Cancel Ride Modal */}
      <CancelRideModal
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        onConfirm={handleConfirmCancelRide}
      />
      {/* Overlay to close menu when tapping outside */}
      {menuVisible && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 3000,
          }}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    zIndex: 10,
  },
  menuButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  speedPill: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 60,
    justifyContent: 'center',
  },
  speedZero: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 4,
  },
  speedLimit: {
    color: '#00C853',
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconCircle: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
});
