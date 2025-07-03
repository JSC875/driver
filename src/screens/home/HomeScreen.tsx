import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { mockLocations } from '../../data/mockData';
import { getGreeting, useAssignUserType } from '../../utils/helpers';
import MapView, { Marker } from 'react-native-maps';
import { useEffect } from 'react';
import * as Location from 'expo-location';
import { useLocationStore } from '../../store/useLocationStore';

const { width, height } = Dimensions.get('window');

const DRIVER_LOCATION = {
  latitude: 28.6139, // Placeholder: New Delhi
  longitude: 77.2090,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function HomeScreen({ navigation }: any) {
  const { user } = useUser();
  const {
    pickupLocation,
    setPickupLocation,
    currentLocation,
    setCurrentLocation,
    dropoffLocation,
    setDropoffLocation,
  } = useLocationStore();
  const { getToken } = useAuth();

  const [region, setRegion] = useState({
    latitude: 28.6139, // Default: New Delhi
    longitude: 77.2090,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [isOnline, setIsOnline] = useState(true);
  const [ridesToday, setRidesToday] = useState(5); // Placeholder
  const [earningsToday, setEarningsToday] = useState(1200); // Placeholder
  const [swipeAnim] = useState(new Animated.Value(isOnline ? 1 : 0));

  useAssignUserType('user');

  // On mount, get current location and set as pickup if not set
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address: 'Current Location',
      };
      setCurrentLocation(coords);
      if (!pickupLocation) {
        setPickupLocation(coords);
      }
      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When pickup or dropoff location changes, update map region
  useEffect(() => {
    if (dropoffLocation) {
      setRegion((prev) => ({
        ...prev,
        latitude: dropoffLocation.latitude,
        longitude: dropoffLocation.longitude,
      }));
    } else if (pickupLocation) {
      setRegion((prev) => ({
        ...prev,
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
      }));
    }
  }, [pickupLocation, dropoffLocation]);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      console.log('Clerk JWT token:', token);
    })();
  }, [getToken]);

  const handleLocationSearch = (type: 'pickup' | 'destination') => {
    navigation.navigate('LocationSearch', { type });
  };

  const handleQuickLocation = (location: any) => {
    navigation.navigate('RideEstimate', { destination: location });
  };

  const handleRideHistory = () => {
    // Navigate to the History tab
    navigation.navigate('History');
  };

  const handleSupport = () => {
    navigation.navigate('HelpSupport');
  };

  const getUserName = () => {
    if (user?.firstName) {
      return user.firstName;
    } else if (user?.fullName) {
      return user.fullName.split(' ')[0];
    }
    return 'User';
  };

  // Animate swipe toggle
  const handleToggleOnline = () => {
    setIsOnline((prev) => !prev);
    Animated.timing(swipeAnim, {
      toValue: isOnline ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map View */}
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={DRIVER_LOCATION}
        region={DRIVER_LOCATION}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <Marker coordinate={DRIVER_LOCATION} title="You (Driver)" />
      </MapView>

      {/* Top Header (minimal, Uber-style) */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.openDrawer && navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('NotificationsScreen')}>
          <Ionicons name="options" size={24} color={Colors.text} />
          </TouchableOpacity>
      </View>

      {/* Bottom Card (online/offline state) */}
      <View style={[styles.bottomCard, isOnline ? styles.onlineCard : styles.offlineCard]}>  
        <Text style={[styles.bottomCardTitle, isOnline ? styles.onlineText : styles.offlineText]}>
          {isOnline ? "You're online" : "You're offline"}
        </Text>
        <Text style={styles.bottomCardSubtitle}>
          {isOnline ? 'Waiting for ride requests...' : 'Go online to start receiving rides.'}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="car" size={20} color={isOnline ? Colors.primary : Colors.gray400} />
            <Text style={styles.statValue}>{ridesToday}</Text>
            <Text style={styles.statLabel}>Rides</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="cash" size={20} color={isOnline ? Colors.primary : Colors.gray400} />
            <Text style={styles.statValue}>₹{earningsToday}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>
      </View>

      {/* Go Online/Go Offline Button (full width, bottom) */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[styles.bottomButton, isOnline ? styles.goOfflineBtn : styles.goOnlineBtn]}
          onPress={handleToggleOnline}
        >
          <Text style={[styles.bottomButtonText, isOnline ? styles.goOfflineText : styles.goOnlineText]}>
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    position: 'absolute',
    top: Layout.spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    zIndex: 10,
  },
  headerIcon: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerSpacer: {
    flex: 1,
  },
  bottomCard: {
    position: 'absolute',
    left: Layout.spacing.lg,
    right: Layout.spacing.lg,
    bottom: 80,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  onlineCard: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  offlineCard: {
    borderColor: Colors.gray300,
    borderWidth: 1.5,
    backgroundColor: Colors.gray50,
  },
  bottomCardTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  onlineText: {
    color: Colors.primary,
  },
  offlineText: {
    color: Colors.gray400,
  },
  bottomCardSubtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Layout.spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  bottomButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    padding: Layout.spacing.md,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  bottomButton: {
    width: '100%',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goOnlineBtn: {
    backgroundColor: Colors.primary,
  },
  goOfflineBtn: {
    backgroundColor: Colors.gray400,
  },
  bottomButtonText: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
  },
  goOnlineText: {
    color: Colors.white,
  },
  goOfflineText: {
    color: Colors.white,
  },
});
