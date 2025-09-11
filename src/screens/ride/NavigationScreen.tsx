import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Alert, Dimensions, Linking, StatusBar } from 'react-native';
import MapView, { Marker, Polyline as MapPolyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import Polyline from '@mapbox/polyline';
import { RideRequest, stopAllNotificationSounds } from '../../components/RideRequestScreen';
import socketManager from '../../utils/socket';
import LocationTrackingService from '../../services/locationTrackingService';
import CancelRideButton from '../../components/CancelRideButton';

const { width } = Dimensions.get('window');

// Helper: Geocode address to lat/lng
async function geocodeAddress(address: string, apiKey: string) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results[0]) {
      return data.results[0].geometry.location;
    }
    throw new Error('No geocoding results found');
  } catch (error) {
    throw new Error('Geocoding failed');
  }
}

// Helper: Fetch directions and decode polyline
async function fetchRoute(from: any, to: any, apiKey: string) {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      const points = Polyline.decode(data.routes[0].overview_polyline.points);
      return points.map(([latitude, longitude]: [number, number]) => ({ latitude, longitude }));
    }
    throw new Error('No routes found');
  } catch (error) {
    throw new Error('Directions fetch failed');
  }
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyDHN3SH_ODlqnHcU9Blvv2pLpnDNkg03lU';
const getFallbackCoordinates = (address: string) => ({ lat: 17.4375, lng: 78.4483 });

interface NavigationScreenProps {
  route: any;
  navigation: any;
}

export default function NavigationScreen({ route, navigation }: NavigationScreenProps) {
  const { ride } = route.params;
  
  console.log('🚗 NavigationScreen received ride data:', ride);
  console.log('🚗 rideId:', ride?.rideId);
  console.log('🚗 driverId:', ride?.driverId);
  const anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [routeCoords, setRouteCoords] = useState<Array<{latitude: number, longitude: number}>>([]);
  const [pickupCoord, setPickupCoord] = useState<{lat: number, lng: number} | null>(null);
  const [dropoffCoord, setDropoffCoord] = useState<{lat: number, lng: number} | null>(null);
  const [driverLocation, setDriverLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isLocationReady, setIsLocationReady] = useState(false);
  const mapRef = useRef<MapView>(null);
  const pickupPulse = useRef(new Animated.Value(1)).current;
  const pickupBgOpacity = useRef(new Animated.Value(0.5)).current;
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setIsLocationReady(true);
          return;
        }
        const initialLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setDriverLocation({
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
        });
        setIsLocationReady(true);
        locationSubscription.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
          (location) => {
            setDriverLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        );
      } catch (error) {
        setIsLocationReady(true);
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
        let pickup;
        if (ride.pickupDetails && typeof ride.pickupDetails.latitude === 'number' && typeof ride.pickupDetails.longitude === 'number') {
          pickup = { lat: ride.pickupDetails.latitude, lng: ride.pickupDetails.longitude };
        } else {
          pickup = await geocodeAddress(ride.pickupAddress, GOOGLE_MAPS_API_KEY);
        }
        let dropoff;
        if (ride.dropoffDetails && typeof ride.dropoffDetails.latitude === 'number' && typeof ride.dropoffDetails.longitude === 'number') {
          dropoff = { lat: ride.dropoffDetails.latitude, lng: ride.dropoffDetails.longitude };
        } else {
          dropoff = await geocodeAddress(ride.dropoffAddress, GOOGLE_MAPS_API_KEY);
        }
        setPickupCoord(pickup);
        setDropoffCoord(dropoff);
        if (isLocationReady && driverLocation) {
          const route = await fetchRoute(
            { lat: driverLocation.latitude, lng: driverLocation.longitude },
            pickup,
            GOOGLE_MAPS_API_KEY
          );
          setRouteCoords(route);
        } else if (pickup && dropoff) {
          const route = await fetchRoute(pickup, dropoff, GOOGLE_MAPS_API_KEY);
          setRouteCoords(route);
        }
      } catch (e) {
        const fallbackPickup = getFallbackCoordinates(ride.pickupAddress);
        const fallbackDropoff = getFallbackCoordinates(ride.dropoffAddress);
        setPickupCoord(fallbackPickup);
        setDropoffCoord(fallbackDropoff);
        Alert.alert('Map Loading Error', 'Unable to load route details, but ride acceptance was successful. You can still navigate manually.', [{ text: 'OK' }]);
      }
    })();
  }, [ride.pickupAddress, ride.dropoffAddress, ride.pickupDetails, ride.dropoffDetails, driverLocation, isLocationReady]);

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

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  // Function to open Google Maps with navigation
  const openGoogleMapsNavigation = (destination: { latitude: number; longitude: number }, label: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving&dir_action=navigate`;
    
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Google Maps is not installed on this device');
      }
    }).catch((err) => {
      console.error('Error opening Google Maps:', err);
      Alert.alert('Error', 'Could not open Google Maps');
    });
  };

  // Function to open Google Maps with pickup location
  const openGoogleMapsToPickup = () => {
    if (pickupCoord) {
      openGoogleMapsNavigation(
        { latitude: pickupCoord.lat, longitude: pickupCoord.lng },
        'Pickup Location'
      );
    } else {
      Alert.alert('Error', 'Pickup location not available');
    }
  };

  // Function to open Google Maps with dropoff location
  const openGoogleMapsToDropoff = () => {
    if (dropoffCoord) {
      openGoogleMapsNavigation(
        { latitude: dropoffCoord.lat, longitude: dropoffCoord.lng },
        'Dropoff Location'
      );
    } else {
      Alert.alert('Error', 'Dropoff location not available');
    }
  };

  // Function to open Google Maps with full route (pickup to dropoff)
  const openGoogleMapsFullRoute = () => {
    if (pickupCoord && dropoffCoord) {
      const url = `https://www.google.com/maps/dir/${pickupCoord.lat},${pickupCoord.lng}/${dropoffCoord.lat},${dropoffCoord.lng}/?travelmode=driving&dir_action=navigate`;
      
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Google Maps is not installed on this device');
        }
      }).catch((err) => {
        console.error('Error opening Google Maps:', err);
        Alert.alert('Error', 'Could not open Google Maps');
      });
    } else {
      Alert.alert('Error', 'Route locations not available');
    }
  };

  // Function to cancel the ride
  const handleCancelRide = async () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride? This action cannot be undone.',
      [
        { text: 'Keep Ride', style: 'cancel' },
        { 
          text: 'Cancel Ride', 
          style: 'destructive',
          onPress: async () => {
            console.log('🚫 Driver cancelling ride during pickup:', {
              rideId: ride.rideId,
              driverId: ride.driverId,
              reason: 'Driver cancelled during pickup'
            });
            
            // Stop notification sounds when cancelling ride
            await stopAllNotificationSounds();
            
            // Send cancellation to server
            socketManager.cancelRide({
              rideId: ride.rideId,
              driverId: ride.driverId,
              reason: 'Driver cancelled during pickup'
            });
            
            // Note: Navigation will be handled by the driver_cancellation_success event
          }
        }
      ]
    );
  };

  // Listen for driver cancellation success
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (socket) {
      const handleDriverCancellationSuccess = (data: any) => {
        console.log('✅ Driver cancellation success received in NavigationScreen:', data);
        // Navigate to home screen after successful cancellation
        // Use replace instead of navigate to prevent going back to this screen
        navigation.replace('Home');
      };

      const handleRideCancelled = (data: any) => {
        console.log('❌ Ride cancelled event received in NavigationScreen:', data);
        // Also handle the general ride_cancelled event
        navigation.replace('Home');
      };

      socket.on('driver_cancellation_success', handleDriverCancellationSuccess);
      socket.on('ride_cancelled', handleRideCancelled);

      return () => {
        socket.off('driver_cancellation_success', handleDriverCancellationSuccess);
        socket.off('ride_cancelled', handleRideCancelled);
      };
    }
  }, [navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Full Screen Map */}
      <MapView
        ref={mapRef}
        provider="google"
        style={{ flex: 1 }}
        initialRegion={{
          latitude: pickupCoord?.lat || 17.4375,
          longitude: pickupCoord?.lng || 78.4483,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
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

      {/* Enhanced Top Card with Route Info & Pickup/Dropoff */}
      <View style={{
        position: 'absolute',
        top: insets.top + 12,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
        backdropFilter: 'blur(10px)',
      }}>
        {/* Header with ETA and Cancel */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginBottom: 16,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0,0,0,0.08)'
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '700', 
              color: '#1a1a1a',
              letterSpacing: -0.5
            }}>
              Navigate to Pickup
            </Text>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginTop: 4 
            }}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={{ 
                fontSize: 13, 
                color: '#666', 
                marginLeft: 4,
                fontWeight: '500'
              }}>
                ETA: {ride.pickup}
              </Text>
            </View>
          </View>
          <CancelRideButton
            rideId={ride.rideId}
            driverId={ride.driverId}
            rideDetails={{
              pickupAddress: ride.pickupAddress,
              dropoffAddress: ride.dropoffAddress,
              price: ride.price,
            }}
            onSuccess={() => navigation.navigate('Home')}
            style={{ 
              backgroundColor: '#ff4757', 
              borderRadius: 20, 
              paddingHorizontal: 16, 
              paddingVertical: 8,
              shadowColor: '#ff4757',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4
            }}
            showIcon={false}
          />

        </View>

        {/* Route Points */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Animated.View style={{ flex: 1, opacity: pickupBgOpacity }}>
            <Animated.View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 230, 118, 0.1)',
              borderRadius: 20,
              marginRight: 12,
              padding: 12,
              transform: [{ scale: pickupPulse }],
              borderWidth: 1,
              borderColor: 'rgba(0, 230, 118, 0.2)',
            }}>
              <View style={{ 
                backgroundColor: '#00C853', 
                borderRadius: 20, 
                width: 36, 
                height: 36, 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginRight: 12,
                shadowColor: '#00C853',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4
              }}>
                <Ionicons name="location" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 15, 
                  fontWeight: '600', 
                  color: '#1a1a1a', 
                  marginBottom: 2 
                }}>
                  Pickup
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#666', 
                  lineHeight: 16 
                }} numberOfLines={2}>
                  {ride.pickupAddress}
                </Text>
              </View>
            </Animated.View>
          </Animated.View>
          
          <View style={{ 
            marginHorizontal: 8,
            backgroundColor: '#1877f2',
            borderRadius: 12,
            width: 24,
            height: 24,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </View>
          
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ 
              backgroundColor: '#FF6B35', 
              borderRadius: 20, 
              width: 36, 
              height: 36, 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginRight: 12,
              shadowColor: '#FF6B35',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4
            }}>
              <Ionicons name="flag" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 15, 
                fontWeight: '600', 
                color: '#1a1a1a', 
                marginBottom: 2 
              }}>
                Dropoff
              </Text>
              <Text style={{ 
                fontSize: 12, 
                color: '#666', 
                lineHeight: 16 
              }} numberOfLines={2}>
                {ride.dropoffAddress}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Enhanced Bottom Action Buttons */}
      <View style={{ 
        position: 'absolute', 
        left: 0, 
        right: 0, 
        bottom: 0, 
        paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 24, 
        zIndex: 10000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 12,
        backdropFilter: 'blur(10px)',
      }}>
        <View style={{ 
          gap: 8, 
          paddingHorizontal: 16,
          paddingTop: 16
        }}>
          {/* Primary Action - Navigate to Pickup */}
          <TouchableOpacity
            style={{ 
              backgroundColor: '#1877f2', 
              borderRadius: 16, 
              paddingVertical: 14, 
              paddingHorizontal: 20, 
              width: '100%', 
              alignItems: 'center', 
              flexDirection: 'row', 
              justifyContent: 'center', 
              shadowColor: '#1877f2', 
              shadowOffset: { width: 0, height: 4 }, 
              shadowOpacity: 0.3, 
              shadowRadius: 8, 
              elevation: 8 
            }}
            onPress={openGoogleMapsToPickup}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ 
              color: '#fff', 
              fontWeight: '600', 
              fontSize: 16,
              letterSpacing: 0.3
            }}>
              Navigate to Pickup
            </Text>
          </TouchableOpacity>

          {/* Secondary Actions Row */}
          <View style={{ 
            flexDirection: 'row', 
            gap: 8,
            marginTop: 4
          }}>
            {/* Location Emission */}
            <TouchableOpacity
              style={{ 
                flex: 1,
                backgroundColor: '#FF9800', 
                borderRadius: 12, 
                paddingVertical: 12, 
                paddingHorizontal: 16, 
                alignItems: 'center', 
                flexDirection: 'row', 
                justifyContent: 'center', 
                shadowColor: '#FF9800', 
                shadowOffset: { width: 0, height: 2 }, 
                shadowOpacity: 0.2, 
                shadowRadius: 4, 
                elevation: 4 
              }}
              onPress={() => {
                const locationService = LocationTrackingService.getInstance();
                locationService.startContinuousLocationEmission();
                Alert.alert('Location Emission Started', 'Driver location will now be continuously sent to customer app every 5 seconds.');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="location" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ 
                color: '#fff', 
                fontWeight: '600', 
                fontSize: 13 
              }}>
                Start Location
              </Text>
            </TouchableOpacity>

            {/* Chat with Customer */}
            <TouchableOpacity
              style={{ 
                flex: 1,
                backgroundColor: '#007AFF', 
                borderRadius: 12, 
                paddingVertical: 12, 
                paddingHorizontal: 16, 
                alignItems: 'center', 
                flexDirection: 'row', 
                justifyContent: 'center', 
                shadowColor: '#007AFF', 
                shadowOffset: { width: 0, height: 2 }, 
                shadowOpacity: 0.2, 
                shadowRadius: 4, 
                elevation: 4 
              }}
              onPress={() => {
                console.log('🔗 Navigating to Chat with data:', {
                  ride: { rideId: ride.rideId },
                  user: { name: ride.customerName || 'Customer' },
                  driverId: ride.driverId || 'driver123'
                });
                navigation.navigate('Chat', {
                  ride: { rideId: ride.rideId },
                  user: { name: ride.customerName || 'Customer' },
                  driverId: ride.driverId || 'driver123'
                });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ 
                color: '#fff', 
                fontWeight: '600', 
                fontSize: 13 
              }}>
                Chat
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tertiary Actions Row */}
          <View style={{ 
            flexDirection: 'row', 
            gap: 8,
            marginTop: 4
          }}>
            {/* Full Route */}
            <TouchableOpacity
              style={{ 
                flex: 1,
                backgroundColor: '#9C27B0', 
                borderRadius: 12, 
                paddingVertical: 12, 
                paddingHorizontal: 16, 
                alignItems: 'center', 
                flexDirection: 'row', 
                justifyContent: 'center', 
                shadowColor: '#9C27B0', 
                shadowOffset: { width: 0, height: 2 }, 
                shadowOpacity: 0.2, 
                shadowRadius: 4, 
                elevation: 4 
              }}
              onPress={openGoogleMapsFullRoute}
              activeOpacity={0.8}
            >
              <Ionicons name="map" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ 
                color: '#fff', 
                fontWeight: '600', 
                fontSize: 13 
              }}>
                Full Route
              </Text>
            </TouchableOpacity>

            {/* Arrived at Pickup */}
            <TouchableOpacity
              style={{ 
                flex: 1,
                backgroundColor: '#00C853', 
                borderRadius: 12, 
                paddingVertical: 12, 
                paddingHorizontal: 16, 
                alignItems: 'center', 
                flexDirection: 'row', 
                justifyContent: 'center', 
                shadowColor: '#00C853', 
                shadowOffset: { width: 0, height: 2 }, 
                shadowOpacity: 0.2, 
                shadowRadius: 4, 
                elevation: 4 
              }}
              onPress={() => {
                // Send driver_arrived event to server
                socketManager.driverArrived({
                  rideId: ride.rideId,
                  driverId: ride.driverId
                });
                
                // Navigate to OTP screen
                navigation.navigate('OtpScreen', { ride });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ 
                color: '#fff', 
                fontWeight: '600', 
                fontSize: 13 
              }}>
                Arrived
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
} 