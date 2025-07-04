import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Easing, Image, ScrollView, Linking, Alert, Modal, Pressable, PanResponder, TextInput } from 'react-native';
import MapView from 'react-native-maps';
import { MaterialIcons, Ionicons, FontAwesome, Entypo, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import RideRequestScreen, { RideRequest } from '../../components/RideRequestScreen';
const { width, height } = Dimensions.get('window');

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

function NavigationScreen({ ride, onNavigate, onArrived }: { ride: RideRequest, onNavigate: () => void, onArrived: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>Directions to User</Text>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>Pickup: {ride.pickupAddress}</Text>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>Dropoff: {ride.dropoffAddress}</Text>
      <Text style={{ fontSize: 18, marginBottom: 24 }}>ETA: {ride.pickup}</Text>
      <TouchableOpacity
        style={{ backgroundColor: '#1877f2', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 18 }}
        onPress={onNavigate}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>Navigate in Google Maps</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ backgroundColor: '#00C853', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32 }}
        onPress={onArrived}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>Arrived at Pickup</Text>
      </TouchableOpacity>
    </View>
  );
}

function OtpScreen({ onSubmit }: { onSubmit: (otp: string) => void }) {
  const [otp, setOtp] = useState('');
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>Enter OTP</Text>
      <Text style={{ fontSize: 18, marginBottom: 24 }}>Ask the user for their OTP to start the ride.</Text>
      <View style={{ flexDirection: 'row', marginBottom: 24 }}>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, fontSize: 24, padding: 12, width: 120, textAlign: 'center' }}
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
        />
      </View>
      <TouchableOpacity
        style={{ backgroundColor: '#1877f2', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32 }}
        onPress={() => onSubmit(otp)}
        disabled={otp.length < 4}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>Submit OTP</Text>
      </TouchableOpacity>
    </View>
  );
}

function RideInProgressScreen({ ride, onNavigate, onEnd }: { ride: RideRequest, onNavigate: () => void, onEnd: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>Ride In Progress</Text>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>From: {ride.pickupAddress}</Text>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>To: {ride.dropoffAddress}</Text>
      <TouchableOpacity
        style={{ backgroundColor: '#1877f2', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 18 }}
        onPress={onNavigate}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>Navigate to Dropoff</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ backgroundColor: '#FF3B30', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32 }}
        onPress={onEnd}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>End Ride</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const [isSOSVisible, setSOSVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const swipeX = useRef(new Animated.Value(0)).current;
  const SWIPE_WIDTH = width - 48;
  const SWIPE_THRESHOLD = SWIPE_WIDTH * 0.6;
  const lastHaptic = useRef(Date.now());
  const [rideRequest, setRideRequest] = useState<RideRequest | null>(null);
  const [navigationRide, setNavigationRide] = useState<RideRequest | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [rideInProgress, setRideInProgress] = useState<RideRequest | null>(null);

  // PanResponder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isOnline,
      onMoveShouldSetPanResponder: () => !isOnline,
      onPanResponderMove: (e, gestureState) => {
        if (isOnline) return;
        let newX = gestureState.dx;
        if (newX < 0) newX = 0;
        if (newX > SWIPE_WIDTH - 56) newX = SWIPE_WIDTH - 56;
        swipeX.setValue(newX);
        // Throttle haptic feedback
        const now = Date.now();
        if (now - lastHaptic.current > 60) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          lastHaptic.current = now;
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (isOnline) return;
        if (gestureState.dx > SWIPE_THRESHOLD) {
          Animated.timing(swipeX, {
            toValue: SWIPE_WIDTH - 56,
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            setIsOnline(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          });
        } else {
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
    }
      },
    })
  ).current;

  const resetOnline = () => {
    setIsOnline(false);
    Animated.spring(swipeX, {
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
      setNavigationRide(rideRequest);
      setRideRequest(null);
    }
  };

  const handleRejectRide = () => {
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
    setShowOtp(true);
  };

  const handleOtpSubmit = (otp: string) => {
    setShowOtp(false);
    setRideInProgress(navigationRide);
    setNavigationRide(null);
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
    setRideInProgress(null);
  };

  const isRideActive = !!(rideRequest || navigationRide || showOtp || rideInProgress);

  return (
    <View style={{ flex: 1 }}>
      {/* Map */}
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 17.4375, // Example: Hyderabad
          longitude: 78.4483,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      />
      {/* Test Ride Request Button (hide if ride in progress) */}
      {!isRideActive && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 170,
            right: 24,
            backgroundColor: '#1877f2',
            borderRadius: 32,
            paddingVertical: 16,
            paddingHorizontal: 28,
            elevation: 6,
            zIndex: 100,
          }}
          onPress={handleTestRideRequest}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Test Ride Request</Text>
        </TouchableOpacity>
      )}
      {/* Top Bar Overlay */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.menuButton} onPress={() => {}}>
            <Entypo name="menu" size={28} color="#222" />
            <View style={styles.badge}><Text style={styles.badgeText}>1</Text></View>
          </TouchableOpacity>
        </View>
        <View style={styles.speedPill}>
          <Text style={styles.speedZero}>0</Text>
          <Text style={styles.speedZero}> | </Text>
          <Text style={styles.speedLimit}>80</Text>
        </View>
        <TouchableOpacity style={styles.iconCircle}>
          <Ionicons name="search" size={24} color="#222" />
          </TouchableOpacity>
      </View>
      {/* Center Marker */}
      <View style={styles.centerMarker}>
        <MaterialIcons name="navigation" size={32} color="#222" style={{ transform: [{ rotate: '0deg' }] }} />
          </View>
      {/* Bottom Swipe Button Overlay */}
      <View style={styles.swipeBarContainer}>
        <View style={[styles.swipeBarBg, isOnline && { backgroundColor: '#00C853' }]}/>
        {!isOnline ? (
          <View style={styles.swipeBarContent}>
            <Text style={styles.swipeBarText}>Swipe to go online</Text>
            <Animated.View
              {...panResponder.panHandlers}
              style={[styles.swipeCircle, { transform: [{ translateX: swipeX }] }]}
            >
              <Ionicons name="arrow-forward" size={28} color="#00C853" />
            </Animated.View>
          </View>
        ) : (
          <TouchableOpacity style={styles.onlineBarContent} onPress={resetOnline}>
            <Text style={styles.onlineBarText}>You're online</Text>
            <Ionicons name="power" size={24} color="#fff" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        )}
      </View>
      {/* Floating SOS Button */}
        <TouchableOpacity
        style={styles.sosButton}
        onPress={() => setSOSVisible(true)}
        >
        <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
      {/* SOS Modal */}
      <SOSModal visible={isSOSVisible} onClose={() => setSOSVisible(false)} />
      {/* Ride Request Modal */}
      {rideRequest && (
        <RideRequestScreen
          ride={rideRequest}
          onClose={handleRejectRide}
          onAccept={handleAcceptRide}
          onReject={handleRejectRide}
        />
      )}
      {/* Navigation Screen */}
      {navigationRide && !showOtp && (
        <NavigationScreen
          ride={navigationRide}
          onNavigate={handleNavigate}
          onArrived={handleArrived}
        />
      )}
      {/* OTP Screen */}
      {navigationRide && showOtp && (
        <OtpScreen onSubmit={handleOtpSubmit} />
      )}
      {/* Ride In Progress Screen */}
      {rideInProgress && (
        <RideInProgressScreen
          ride={rideInProgress}
          onNavigate={handleNavigateToDropoff}
          onEnd={handleEndRide}
        />
      )}
    </View>
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
  centerMarker: {
    position: 'absolute',
    top: height / 2 - 32,
    left: width / 2 - 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    elevation: 4,
    zIndex: -1,
  },
  swipeBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  swipeBarBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
  },
  swipeBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width - 48,
    height: 56,
    backgroundColor: '#f2f2f2',
    borderRadius: 28,
    marginHorizontal: 24,
    marginBottom: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  swipeBarText: {
    flex: 1,
    textAlign: 'center',
    color: '#00C853',
    fontWeight: 'bold',
    fontSize: 20,
    zIndex: 1,
  },
  swipeCircle: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    zIndex: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  onlineBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: width - 48,
    height: 56,
    backgroundColor: '#00C853',
    borderRadius: 28,
    marginHorizontal: 24,
    marginBottom: 18,
  },
  onlineBarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  sosButton: {
    position: 'absolute',
    bottom: '40%',
    right: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 32,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    zIndex: 99999,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sosText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 1,
  },
});
