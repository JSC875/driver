import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Easing, Image, ScrollView, Linking, Alert, Modal, Pressable, PanResponder, TextInput, Vibration, Platform } from 'react-native';
import MapView, { Marker, Polyline as MapPolyline, MapViewProps } from 'react-native-maps';
import { MaterialIcons, Ionicons, FontAwesome, Entypo, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import RideRequestScreen, { RideRequest } from '../../components/RideRequestScreen';
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

const { width, height } = Dimensions.get('window');

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
    throw new Error('Geocoding failed: ' + error.message);
  }
}

// Helper: Fetch directions and decode polyline
async function fetchRoute(from: {lat: number, lng: number}, to: {lat: number, lng: number}, apiKey: string) {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    // Log the response for debugging
    console.log('Directions response:', data);
    
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
      return points.map(([latitude, longitude]: [number, number]) => ({ latitude, longitude }));
    }
    
    console.error('No routes found');
    throw new Error('No routes found');
  } catch (error) {
    console.error('Directions fetch error:', error);
    throw new Error('Directions fetch failed: ' + error.message);
  }
}

// Add a fallback for when geocoding fails
const GOOGLE_MAPS_API_KEY = 'AIzaSyDHN3SH_ODlqnHcU9Blvv2pLpnDNkg03lU';

// Add a fallback function for when geocoding fails
const getFallbackCoordinates = (address: string) => {
  // Return default coordinates for Hyderabad if geocoding fails
  return { lat: 17.4375, lng: 78.4483 };
};

function NavigationScreen({ ride, onNavigate, onArrived, onClose }: { ride: RideRequest, onNavigate: () => void, onArrived: () => void, onClose: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [routeCoords, setRouteCoords] = useState<Array<{latitude: number, longitude: number}>>([]);
  const [pickupCoord, setPickupCoord] = useState<{lat: number, lng: number} | null>(null);
  const [dropoffCoord, setDropoffCoord] = useState<{lat: number, lng: number} | null>(null);
  const [driverLocation, setDriverLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isLocationReady, setIsLocationReady] = useState(false);
  const mapRef = useRef<MapView>(null); // Typed ref for MapView
  const pickupPulse = useRef(new Animated.Value(1)).current;
  const pickupBgOpacity = useRef(new Animated.Value(0.5)).current;
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Start location tracking
  useEffect(() => {
    const startLocationTracking = async () => {
      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          setIsLocationReady(true); // Mark as ready even if denied
          return;
        }

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setDriverLocation({
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
        });
        setIsLocationReady(true);

        // Start watching location
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Update every 10 meters
          },
          (location) => {
            setDriverLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        );
      } catch (error) {
        console.error('Error starting location tracking:', error);
        setIsLocationReady(true); // Mark as ready even if error
      }
    };

    startLocationTracking();

    // Cleanup location subscription
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const pickup = await geocodeAddress(ride.pickupAddress, GOOGLE_MAPS_API_KEY);
        const dropoff = await geocodeAddress(ride.dropoffAddress, GOOGLE_MAPS_API_KEY);
        setPickupCoord(pickup);
        setDropoffCoord(dropoff);
        
        // Wait for location to be ready before calculating route
        if (isLocationReady) {
          // Always prioritize driver location to pickup route
          if (driverLocation) {
            const route = await fetchRoute(
              { lat: driverLocation.latitude, lng: driverLocation.longitude },
              pickup,
              GOOGLE_MAPS_API_KEY
            );
            setRouteCoords(route);
          } else {
            // Only fallback to pickup-to-dropoff if no driver location at all
            const route = await fetchRoute(pickup, dropoff, GOOGLE_MAPS_API_KEY);
            setRouteCoords(route);
          }
        }
      } catch (e) {
        console.error('Error fetching route:', e);
        // Use fallback coordinates when geocoding fails
        const fallbackPickup = getFallbackCoordinates(ride.pickupAddress);
        const fallbackDropoff = getFallbackCoordinates(ride.dropoffAddress);
        
        setPickupCoord(fallbackPickup);
        setDropoffCoord(fallbackDropoff);
        
        console.log('Using fallback coordinates due to geocoding error');
        // Don't let geocoding errors prevent the ride acceptance
        // Just show a basic map without route
        Alert.alert(
          'Map Loading Error', 
          'Unable to load route details, but ride acceptance was successful. You can still navigate manually.',
          [{ text: 'OK' }]
        );
      }
    })();
  }, [ride.pickupAddress, ride.dropoffAddress, driverLocation, isLocationReady]);

  useEffect(() => {
    if (routeCoords.length > 1 && mapRef.current) {
      mapRef.current.fitToCoordinates(routeCoords, { edgePadding: { top: 100, right: 100, bottom: 100, left: 100 }, animated: true });
    }
  }, [routeCoords]);

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pickupPulse, { toValue: 1.04, duration: 600, useNativeDriver: true }),
          Animated.timing(pickupPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pickupBgOpacity, { toValue: 1, duration: 600, useNativeDriver: false }),
          Animated.timing(pickupBgOpacity, { toValue: 0.5, duration: 600, useNativeDriver: false }),
        ]),
      ])
    ).start();
  }, []);

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#fff',
      opacity: anim,
      zIndex: 9999,
    }}>
      {/* Full Screen Map */}
      <MapView
        ref={mapRef}
        provider="google"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
        }}
        initialRegion={{
          latitude: pickupCoord?.lat || 17.4375,
          longitude: pickupCoord?.lng || 78.4483,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      >
        {pickupCoord && (
          <Marker 
            coordinate={{ latitude: pickupCoord.lat, longitude: pickupCoord.lng }} 
            title="Pickup"
            pinColor="#00C853"
          />
        )}
        {dropoffCoord && (
          <Marker 
            coordinate={{ latitude: dropoffCoord.lat, longitude: dropoffCoord.lng }} 
            title="Dropoff"
            pinColor="#FF6B35"
          />
        )}
        {routeCoords.length > 1 && (
          <MapPolyline 
            coordinates={routeCoords} 
            strokeWidth={4} 
            strokeColor="#1877f2"
            zIndex={1}
          />
        )}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="You"
            pinColor="#1877f2"
          />
        )}
      </MapView>
      
      {/* Highlighted Route Info & Pickup/Dropoff Card */}
      <View style={{
        position: 'absolute',
        top: insets.top + 16,
        left: 16,
        right: 16,
        // Use a soft blue-green background for the whole card
        backgroundColor: '#e0f7fa', // light blue-green (cyan)
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}>
        {/* Top Bar with Route Info - No Close Icon */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}>
          {/* Remove the close button here */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#222' }}>Navigate to Pickup</Text>
            <Text style={{ fontSize: 13, color: '#666', marginTop: 2 }}>ETA: {ride.pickup}</Text>
          </View>
          {/* Small Cancel Button */}
        <TouchableOpacity
          style={{ 
              backgroundColor: '#ff4444',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
          }}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 13, color: '#fff', fontWeight: '600' }}>Cancel</Text>
        </TouchableOpacity>
          </View>
        {/* Animated Pickup/Dropoff Cards - blend into card, no separate backgrounds */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Pickup (Animated) */}
          <Animated.View style={{ flex: 1, opacity: pickupBgOpacity }}>
            <Animated.View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#00e676', // static, bright green
              borderRadius: 16,
              marginRight: 12,
              padding: 8,
              transform: [{ scale: pickupPulse }],
            }}>
              <View style={{ backgroundColor: '#00C853', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="location" size={16} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 2 }}>Pickup</Text>
                <Text style={{ fontSize: 13, color: '#666', lineHeight: 16 }} numberOfLines={2}>{ride.pickupAddress}</Text>
              </View>
            </Animated.View>
          </Animated.View>
          {/* Arrow */}
          <View style={{ marginHorizontal: 12 }}>
            <Ionicons name="arrow-forward" size={20} color="#1877f2" />
          </View>
          {/* Dropoff (Static) */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#FF6B35', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Ionicons name="flag" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 2 }}>Dropoff</Text>
              <Text style={{ fontSize: 13, color: '#666', lineHeight: 16 }} numberOfLines={2}>{ride.dropoffAddress}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Action Buttons */}
      <SafeAreaView style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 32, zIndex: 10000 }} edges={['bottom']}>
        <View style={{ gap: 12, paddingHorizontal: 20 }}>
          <TouchableOpacity
            style={{ 
              backgroundColor: '#1877f2', 
              borderRadius: 16, 
              paddingVertical: 18, 
              paddingHorizontal: 32, 
              width: '100%', 
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              shadowColor: '#1877f2',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
        onPress={onNavigate}
            activeOpacity={0.8}
      >
            <Ionicons name="navigate" size={24} color="#fff" style={{ marginRight: 12 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Navigate to Dropoff</Text>
      </TouchableOpacity>
      <TouchableOpacity
            style={{ 
              backgroundColor: '#00C853', 
              borderRadius: 16, 
              paddingVertical: 18, 
              paddingHorizontal: 32, 
              width: '100%', 
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              shadowColor: '#00C853',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
        onPress={onArrived}
            activeOpacity={0.8}
      >
            <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginRight: 12 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Arrived at Pickup</Text>
      </TouchableOpacity>
    </View>
      </SafeAreaView>
    </Animated.View>
  );
}

function OtpScreen({ onSubmit, onClose }: { onSubmit: (otp: string) => void, onClose: () => void }) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const anim = React.useRef(new Animated.Value(0)).current;
  const checkAnim = React.useRef(new Animated.Value(0)).current;
  const inputRefs = useRef<Array<TextInput | null>>([]);

  React.useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleChange = (val: string, idx: number) => {
    if (!/^[0-9]?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 3) {
      inputRefs.current[idx + 1]?.focus();
      setFocusedIndex(idx + 1);
    }
    if (!val && idx > 0) {
      setFocusedIndex(idx - 1);
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
      setFocusedIndex(idx - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    Animated.sequence([
      Animated.timing(checkAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(600),
    ]).start(() => {
      onSubmit(otp.join(''));
      setSubmitted(false);
      checkAnim.setValue(0);
    });
  };

  return (
    <Animated.View style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.35)'] }),
      opacity: anim,
      zIndex: 9999,
    }}>
      <Animated.View style={{
        width: width - 32,
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderRadius: 28,
        padding: 36,
        elevation: 24,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 15 },
        alignItems: 'center',
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }],
      }}>
        <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 18, right: 18, zIndex: 10, backgroundColor: '#f6f6f6', borderRadius: 18, padding: 6 }}>
          <Ionicons name="close" size={26} color="#888" />
        </TouchableOpacity>
        <Text style={{ fontSize: 30, fontWeight: 'bold', marginBottom: 10, color: '#1877f2', letterSpacing: 1 }}>Enter OTP</Text>
        <Text style={{ fontSize: 17, marginBottom: 28, color: '#444', textAlign: 'center' }}>Enter the 4-digit code to start your ride</Text>
        <View style={{ flexDirection: 'row', marginBottom: 32, gap: 8 }}>
          {otp.map((digit, idx) => (
        <TextInput
              key={idx}
              ref={(ref) => { inputRefs.current[idx] = ref; }}
              style={{
                width: 44,
                height: 54,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: focusedIndex === idx ? '#1877f2' : '#e0e0e0',
                backgroundColor: '#f7faff',
                fontSize: 28,
                color: '#222',
                textAlign: 'center',
                marginHorizontal: 2,
                shadowColor: focusedIndex === idx ? '#1877f2' : 'transparent',
                shadowOpacity: focusedIndex === idx ? 0.15 : 0,
                shadowRadius: 6,
                elevation: focusedIndex === idx ? 4 : 0,
              }}
          keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onFocus={() => setFocusedIndex(idx)}
              onChangeText={val => handleChange(val, idx)}
              onKeyPress={e => handleKeyPress(e, idx)}
              returnKeyType="done"
              autoFocus={idx === 0}
        />
          ))}
      </View>
      <TouchableOpacity
          style={{ backgroundColor: otp.every(d => d) ? '#1877f2' : '#b0b0b0', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 8 }}
          onPress={handleSubmit}
          disabled={!otp.every(d => d)}
          activeOpacity={otp.every(d => d) ? 0.8 : 1}
      >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, letterSpacing: 1 }}>Submit OTP</Text>
      </TouchableOpacity>
        {submitted && (
          <Animated.View style={{ marginTop: 18, opacity: checkAnim, transform: [{ scale: checkAnim }] }}>
            <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  );
}



function RideInProgressScreen({ ride, onNavigate, onEnd, onClose, navigation }: { ride: RideRequest, onNavigate: () => void, onEnd: () => void, onClose: () => void, navigation: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [routeCoords, setRouteCoords] = useState<Array<{latitude: number, longitude: number}>>([]);
  const [pickupCoord, setPickupCoord] = useState<{lat: number, lng: number} | null>(null);
  const [dropoffCoord, setDropoffCoord] = useState<{lat: number, lng: number} | null>(null);
  const mapRef = useRef<MapView>(null); // Typed ref for MapView
  const dropoffPulse = useRef(new Animated.Value(1)).current;
  const dropoffBgOpacity = useRef(new Animated.Value(0.5)).current;
  const [driverLocation, setDriverLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Start location tracking
  useEffect(() => {
    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setDriverLocation({
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
        });
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            setDriverLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        );
      } catch (error) {
        console.error('Error starting location tracking:', error);
      }
    };
    startLocationTracking();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const pickup = await geocodeAddress(ride.pickupAddress, GOOGLE_MAPS_API_KEY);
        const dropoff = await geocodeAddress(ride.dropoffAddress, GOOGLE_MAPS_API_KEY);
        setPickupCoord(pickup);
        setDropoffCoord(dropoff);
        // Route from driver location to dropoff
        if (driverLocation) {
          const route = await fetchRoute(
            { lat: driverLocation.latitude, lng: driverLocation.longitude },
            dropoff,
            GOOGLE_MAPS_API_KEY
          );
          setRouteCoords(route);
        } else {
          // Fallback to pickup to dropoff
          const route = await fetchRoute(pickup, dropoff, GOOGLE_MAPS_API_KEY);
          setRouteCoords(route);
        }
      } catch (e) {
        console.error('Error fetching route:', e);
      }
    })();
  }, [ride.pickupAddress, ride.dropoffAddress, driverLocation]);

  useEffect(() => {
    if (routeCoords.length > 1 && mapRef.current) {
      mapRef.current.fitToCoordinates(routeCoords, { edgePadding: { top: 100, right: 100, bottom: 100, left: 100 }, animated: true });
    }
  }, [routeCoords]);

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(dropoffPulse, { toValue: 1.04, duration: 600, useNativeDriver: true }),
          Animated.timing(dropoffPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dropoffBgOpacity, { toValue: 1, duration: 600, useNativeDriver: false }),
          Animated.timing(dropoffBgOpacity, { toValue: 0.5, duration: 600, useNativeDriver: false }),
        ]),
      ])
    ).start();
  }, []);

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#fff',
      opacity: anim,
      zIndex: 9999,
    }}>
      {/* Full Screen Map */}
      <MapView
        ref={mapRef}
        provider="google"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
        }}
        initialRegion={{
          latitude: pickupCoord?.lat || 17.4375,
          longitude: pickupCoord?.lng || 78.4483,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      >
        {pickupCoord && (
          <Marker 
            coordinate={{ latitude: pickupCoord.lat, longitude: pickupCoord.lng }} 
            title="Pickup"
            pinColor="#00C853"
          />
        )}
        {dropoffCoord && (
          <Marker 
            coordinate={{ latitude: dropoffCoord.lat, longitude: dropoffCoord.lng }} 
            title="Dropoff"
            pinColor="#FF6B35"
          />
        )}
        {routeCoords.length > 1 && (
          <MapPolyline 
            coordinates={routeCoords} 
            strokeWidth={4} 
            strokeColor="#1877f2"
            zIndex={1}
          />
        )}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="You"
            pinColor="#1877f2"
          />
        )}
      </MapView>
      
      {/* Top Card with Route Info & Pickup/Dropoff */}
      <View style={{
        position: 'absolute',
        top: 56,
        left: 16,
        right: 16,
        backgroundColor: '#e0f7fa', // match NavigationScreen
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}>
        {/* Route Header */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#222', textAlign: 'center' }}>Ride in Progress</Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginTop: 4 }}>Trip: {ride.dropoff}</Text>
        </View>
        {/* Route Information */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Pickup (plain, not highlighted) */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 12, backgroundColor: 'transparent', borderRadius: 16, padding: 8 }}>
            <View style={{ backgroundColor: '#e0e0e0', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 2 }}>Pickup Complete</Text>
              <Text style={{ fontSize: 13, color: '#666', lineHeight: 16 }} numberOfLines={2}>{ride.pickupAddress}</Text>
            </View>
          </View>
          {/* Arrow */}
          <View style={{ marginHorizontal: 12 }}>
            <Ionicons name="arrow-forward" size={20} color="#1877f2" />
          </View>
          {/* Dropoff (Animated, lighter highlight) */}
          <Animated.View style={{ flex: 1, opacity: dropoffBgOpacity }}>
            <Animated.View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#ffe0b2', // lighter orange
              borderRadius: 16,
              padding: 8,
              transform: [{ scale: dropoffPulse }],
              shadowColor: '#FF6B35',
              shadowOpacity: 0.5,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 8,
            }}>
              <View style={{ backgroundColor: '#ffb74d', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="flag" size={16} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 2 }}>Dropoff</Text>
                <Text style={{ fontSize: 13, color: '#222', lineHeight: 16 }} numberOfLines={2}>{ride.dropoffAddress}</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </View>

      {/* Bottom Action Buttons */}
      <SafeAreaView style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 32, zIndex: 10000 }} edges={['bottom']}>
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            style={{ 
              backgroundColor: '#1877f2', 
              borderRadius: 16, 
              paddingVertical: 18, 
              paddingHorizontal: 32, 
              width: '100%', 
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              shadowColor: '#1877f2',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
        onPress={onNavigate}
            activeOpacity={0.8}
      >
            <Ionicons name="navigate" size={24} color="#fff" style={{ marginRight: 12 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Navigate to Dropoff</Text>
      </TouchableOpacity>
          
      <TouchableOpacity
            style={{ 
              backgroundColor: '#FF3B30', 
              borderRadius: 16, 
              paddingVertical: 18, 
              paddingHorizontal: 32, 
              width: '100%', 
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              shadowColor: '#FF3B30',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
        onPress={() => navigation.navigate('EndRide', { ride })}
            activeOpacity={0.8}
      >
            <Ionicons name="stop-circle" size={24} color="#fff" style={{ marginRight: 12 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>End Ride</Text>
      </TouchableOpacity>
    </View>
      </SafeAreaView>

    </Animated.View>
  );
}

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
        {halfScreen && (
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={onClose} activeOpacity={1} />
        )}
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
    acceptRide, 
    rejectRide,
    sendLocationUpdate,
    sendRideStatusUpdate,
    sendDriverStatus,
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
  const [navigationRide, setNavigationRide] = useState<RideRequest | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [rideInProgress, setRideInProgress] = useState<RideRequest | null>(null);
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
            navigation.navigate('Home');
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

  const handleTestRideRequest = () => {
    setRideRequest({
      id: '1',
      price: '₹120.00',
      type: 'Mini',
      tag: 'Hyderabad',
      rating: '4.95',
      verified: true,
      pickup: '5 min (2.1 km) away',
      pickupAddress: 'Hitech City, Hyderabad, Telangana',
      dropoff: '25 min (12.3 km) trip',
      dropoffAddress: 'Charminar, Hyderabad, Telangana',
    });
  };

  const handleAcceptRide = () => {
    if (rideRequest) {
      // Save to ride history as accepted
      addRide({
        id: rideRequest.id + '-' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        from: rideRequest.pickupAddress || '',
        to: rideRequest.dropoffAddress || '',
        driver: user?.fullName || 'You',
        fare: Number(String(rideRequest.price).replace(/[^\d.]/g, '')) || 0,
        distance: 0,
        duration: 0,
        status: 'accepted',
        rating: 0,
      });
      
      // Send acceptance to socket server using new enhanced method
      if (currentRideRequest) {
        console.log('✅ Accepting ride via socket:', currentRideRequest);
        acceptRide(currentRideRequest);
        
        // Send driver status as busy
        sendDriverStatus({
          driverId: 'driver_001',
          status: 'busy'
        });
      }
      
      setNavigationRide(rideRequest);
      setRideRequest(null);
    }
  };

  const handleRejectRide = () => {
    if (currentRideRequest) {
      addRide({
        id: currentRideRequest.rideId + '-' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        from: currentRideRequest.pickup,
        to: currentRideRequest.drop,
        driver: user?.fullName || 'You',
        fare: Number(String(currentRideRequest.price).replace(/[^\d.]/g, '')) || 0,
        distance: 0,
        duration: 0,
        status: 'cancelled',
        rating: 0,
      });
      
      console.log('❌ Rejecting ride via socket:', currentRideRequest);
      rejectRide(currentRideRequest);
    }
    setRideRequest(null);
  };

  const handleNavigate = () => {
    if (navigationRide) {
      const address = encodeURIComponent(navigationRide.pickupAddress);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
      Linking.openURL(url);
    }
  };

  const handleArrived = () => {
    // Send arrived status to socket server
    if (navigationRide) {
      sendRideStatusUpdate({
        rideId: navigationRide.id,
        status: 'arrived',
        userId: 'user123', // This should come from the ride data
        message: 'Driver has arrived at pickup location'
      });
    }
    setShowOtp(true);
  };

  const handleOtpSubmit = (otp: string) => {
    setShowOtp(false);
    setRideInProgress(navigationRide);
    setNavigationRide(null);
    
    // Send ride started status to socket server
    if (navigationRide) {
      sendRideStatusUpdate({
        rideId: navigationRide.id,
        status: 'started',
        userId: 'user123', // This should come from the ride data
        message: 'Ride has started'
      });
    }
    
    Alert.alert('OTP Verified', 'You can now start the ride!');
  };

  const handleNavigateToDropoff = () => {
    if (rideInProgress) {
      const address = encodeURIComponent(rideInProgress.dropoffAddress);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
      Linking.openURL(url);
    }
  };

  const handleEndRide = () => {
    if (rideInProgress) {
      addRide({
        id: rideInProgress.id + '-' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        from: rideInProgress.pickupAddress || '',
        to: rideInProgress.dropoffAddress || '',
        driver: user?.fullName || 'You',
        fare: Number(String(rideInProgress.price).replace(/[^\d.]/g, '')) || 0,
        distance: 0,
        duration: 0,
        status: 'completed',
        rating: 5,
      });
      
      // Send ride completion to socket server
      sendRideStatusUpdate({
        rideId: rideInProgress.id,
        status: 'completed',
        userId: 'user123', // This should come from the ride data
        message: 'Ride completed successfully'
      });
      
      // Send driver status back to online
      sendDriverStatus({
        driverId: 'driver_001',
        status: 'online'
      });
      
      navigation.navigate('EndRide', { ride: rideInProgress });
    }
  };

  const handleCancelRide = (ride: RideRequest) => {
    setCurrentRideToCancel(ride);
    setCancelModalVisible(true);
  };

  const handleConfirmCancelRide = (reason: string) => {
    if (currentRideToCancel) {
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
      
      // Close navigation screen if it's open
      if (navigationRide?.id === currentRideToCancel.id) {
        setNavigationRide(null);
      }
      
      // Close ride in progress if it's open
      if (rideInProgress?.id === currentRideToCancel.id) {
        setRideInProgress(null);
      }
    }
  };

  const isRideActive = !!(rideRequest || navigationRide || showOtp || rideInProgress);

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
    if (currentRideRequest && isOnline) {
      console.log('🚗 New ride request received from socket:', currentRideRequest);
      
      // Convert socket ride request to local format
      const localRideRequest: RideRequest = {
        id: currentRideRequest.rideId,
        price: `₹${currentRideRequest.price}`,
        type: currentRideRequest.rideType || 'Mini',
        tag: 'Hyderabad',
        rating: '4.95',
        verified: true,
        pickup: '5 min (2.1 km) away',
        pickupAddress: hasAddress(currentRideRequest.pickup) ? currentRideRequest.pickup.address : currentRideRequest.pickup,
        dropoff: '25 min (12.3 km) trip',
        dropoffAddress: hasAddress(currentRideRequest.drop) ? currentRideRequest.drop.address : currentRideRequest.drop,
      };
      
      setRideRequest(localRideRequest);
      
      // Play haptic feedback for new ride request
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [currentRideRequest, isOnline]);

  // Fetch custom Clerk JWT after login
  useEffect(() => {
    if (user?.unsafeMetadata?.type !== 'driver') return;
    const fetchCustomJWT = async () => {
      try {
        const customToken = await getToken({ template: 'driver_app_token' });
        console.log('Custom Clerk JWT:', customToken);
        // Optionally: send to backend or store in state
      } catch (err) {
        console.error('Failed to fetch custom JWT:', err);
      }
    };
    fetchCustomJWT();
  }, [getToken, user]);

  // Button handler to fetch and log the custom JWT manually
  const handleFetchCustomJWT = async () => {
    if (user?.unsafeMetadata?.type !== 'driver') {
      Alert.alert('Error', 'User type is not set to driver.');
      return;
    }
    try {
      const manualToken = await getToken({ template: 'driver_app_token' });
      console.log('Custom Clerk JWT:', manualToken);
      Alert.alert('Custom Clerk JWT', manualToken ? 'Token fetched and logged to console.' : 'No token received.');
    } catch (err) {
      console.error('Failed to fetch custom JWT:', err);
      Alert.alert('Error', 'Failed to fetch custom JWT.');
    }
  };

  // Add logout handler
  const handleLogout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  // Function to display JWT user information
  const handleDisplayJWTInfo = async () => {
    try {
      const userInfo = await getUserInfo();
      if (userInfo) {
        Alert.alert(
          'JWT User Information',
          `User ID: ${userInfo.userId}\nUser Type: ${userInfo.userType}\nEmail: ${userInfo.email || 'N/A'}\nName: ${userInfo.name || 'N/A'}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Could not retrieve user information from JWT');
      }
    } catch (error) {
      console.error('Error displaying JWT info:', error);
      Alert.alert('Error', 'Failed to get user information from JWT');
    }
  };

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
                  fontSize: 22,
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
      {/* Test Buttons (show only when online and no ride in progress) */}
      {isOnline && !isRideActive && (
        <View style={{
          position: 'absolute',
          bottom: 170,
          right: 24,
          flexDirection: 'column',
          gap: 12,
          zIndex: 100,
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#1877f2',
              borderRadius: 32,
              paddingVertical: 16,
              paddingHorizontal: 28,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
            }}
            onPress={handleTestRideRequest}
            activeOpacity={0.7}
          >
            <Animated.Text
              style={{
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 18,
              }}
            >
              Test Ride Request
            </Animated.Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              backgroundColor: '#00C853',
              borderRadius: 32,
              paddingVertical: 12,
              paddingHorizontal: 24,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
            }}
            onPress={() => {
              socketManager.sendTestEvent({ 
                message: 'Hello from driver app!',
                timestamp: new Date().toISOString(),
                driverId: 'driver_001'
              });
            }}
            activeOpacity={0.7}
          >
            <Animated.Text
              style={{
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 14,
              }}
            >
              Test Socket
            </Animated.Text>
          </TouchableOpacity>
        </View>
      )}
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
          {/* Socket Connection Status */}
          {isOnline && (
            <View style={{
              backgroundColor: isSocketConnected ? '#00C853' : '#FF3B30',
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
                {connectionStatus}
              </Text>
              <Text style={{
                color: '#fff',
                fontSize: 8,
                fontWeight: 'bold',
                marginTop: 2,
              }}>
                ID: {driverId}
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
                if (isOnline && isSocketConnected) {
                  sendLocationUpdate({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    userId: 'user123', // This should come from active ride data
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
        {isOnline && !isRideActive && !navigationRide && !rideRequest && !showOtp && !rideInProgress && (
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
          onClose={() => setRideRequest(null)}
          onAccept={() => {
            // Accept logic here
            if (currentRideRequest) {
              acceptRide(currentRideRequest);
              sendDriverStatus({ driverId: 'driver_001', status: 'busy' });
            }
            setRideRequest(null);
          }}
          onReject={() => {
            if (currentRideRequest) {
              rejectRide(currentRideRequest);
            }
            setRideRequest(null);
          }}
        />
      )}
      {/* Navigation Screen */}
      {navigationRide && !showOtp && (
        <>
        <NavigationScreen
          ride={navigationRide}
          onNavigate={handleNavigate}
          onArrived={handleArrived}
            onClose={() => handleCancelRide(navigationRide)}
        />
        </>
      )}
      {/* OTP Screen */}
      {navigationRide && showOtp && (
        <OtpScreen onSubmit={handleOtpSubmit} onClose={() => setShowOtp(false)} />
      )}
      {/* Ride In Progress Screen */}
      {rideInProgress && (
        <RideInProgressScreen
          ride={rideInProgress}
          onNavigate={handleNavigateToDropoff}
          onEnd={handleEndRide}
          onClose={() => setRideInProgress(null)}
          navigation={navigation}
        />
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
