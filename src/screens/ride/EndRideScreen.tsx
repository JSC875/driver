import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

const { width } = Dimensions.get('window');

interface EndRideScreenProps {
  navigation: any;
  route: any;
}

export default function EndRideScreen({ navigation, route }: EndRideScreenProps) {
  const { ride } = route.params || {};
  const swipeX = useRef(new Animated.Value(0)).current;
  const [swiping, setSwiping] = useState(false);
  const lastHaptic = useRef(0);
  
  const SWIPE_WIDTH = width * 0.9;
  const SWIPE_THRESHOLD = SWIPE_WIDTH * 0.6;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5,
      onPanResponderGrant: () => {
        if (Platform.OS === 'android') {
          Vibration.vibrate([0, 2000], true);
        }
      },
      onPanResponderMove: (e, gestureState) => {
        let newX = gestureState.dx;
        if (newX < 0) newX = 0;
        if (newX > SWIPE_WIDTH - 56) newX = SWIPE_WIDTH - 56;
        swipeX.setValue(newX);
        setSwiping(true);
        
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
        if (gestureState.dx > SWIPE_THRESHOLD) {
          Animated.timing(swipeX, {
            toValue: SWIPE_WIDTH - 56,
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            setSwiping(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // End the ride and navigate back
            handleEndRide();
          });
        } else {
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: false,
          }).start(() => setSwiping(false));
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

  const handleEndRide = () => {
    // Call the completeRide function to notify the server
    console.log('Ending ride:', ride);
    
    if (ride?.rideId && ride?.driverId) {
      // Import and use the socket manager to complete the ride
      const socketManager = require('../../utils/socket').default;
      socketManager.completeRide({
        rideId: ride.rideId,
        driverId: ride.driverId
      });
      
      console.log('✅ Ride completion request sent to server');
    } else {
      console.error('❌ Missing rideId or driverId for ride completion');
    }
    
    // Navigate to RideSummaryScreen for feedback
    const summaryData = {
      destination: { name: ride?.dropoffAddress || 'Destination' },
      estimate: {
        distance: '5 km',
        duration: '15 min',
        fare: ride?.price || '100'
      },
      driver: {
        name: 'Driver Name',
        photo: 'https://via.placeholder.com/60',
        vehicleModel: 'Vehicle Model',
        vehicleNumber: 'Vehicle Number'
      }
    };
    navigation.navigate('RideSummary', summaryData);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>End Ride</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            {/* Replace car icon with bike icon */}
            {/* <Ionicons name="car" size={48} color={Colors.primary} /> */}
            <Ionicons name="bicycle" size={48} color={Colors.primary} />
            {/* If you want a motorbike instead, use:
            <MaterialCommunityIcons name="motorbike" size={48} color={Colors.primary} />
            */}
          </View>
        </View>

        <Text style={styles.title}>End Your Ride</Text>
        <Text style={styles.subtitle}>
          Swipe the button below to confirm you want to end this ride
        </Text>

        {ride && (
          <View style={styles.rideInfo}>
            <View style={styles.rideDetail}>
              <Ionicons name="location" size={16} color={Colors.primary} />
              <Text style={styles.rideText}>
                {ride.pickupAddress || 'Pickup location'} → {ride.dropoffAddress || 'Dropoff location'}
              </Text>
            </View>
            <View style={styles.rideDetail}>
              <Ionicons name="cash" size={16} color={Colors.accent} />
              <Text style={styles.rideText}>{ride.price || 'Price not available'}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Swipe Button */}
      <View style={styles.swipeContainer}>
        <View style={styles.swipeBar} {...panResponder.panHandlers}>
          <Animated.View 
            style={[
              styles.swipeHandle,
              { transform: [{ translateX: swipeX }] }
            ]}
          >
            <Ionicons name="arrow-forward" size={24} color={Colors.white} />
          </Animated.View>
          <Text style={styles.swipeText}>
            {swiping ? 'Keep swiping...' : 'Swipe to end ride'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: Layout.spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
  },
  headerTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  iconContainer: {
    marginBottom: Layout.spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Layout.spacing.xl,
  },
  rideInfo: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    width: '100%',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  rideDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  rideText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    marginLeft: Layout.spacing.sm,
    flex: 1,
  },
  swipeContainer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },
  swipeBar: {
    height: 64,
    backgroundColor: Colors.primary,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  swipeHandle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  swipeText: {
    color: Colors.white,
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    marginLeft: Layout.spacing.lg,
    flex: 1,
  },
}); 