import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { useAuth } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // State for driver details
  const [driverDetails, setDriverDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchDriverDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get the token - the /api/drivers/me endpoint uses JWT authentication
        const token = await getToken();
        console.log('[ProfileScreen] Retrieved token:', token);
        if (!token) {
          setError('No auth token found.');
          console.error('[ProfileScreen] No auth token found.');
          setLoading(false);
          return;
        }
        
        // Use the correct endpoint with proper JWT authentication
        const url = 'https://bike-taxi-production.up.railway.app/api/drivers/me';
        console.log('[ProfileScreen] Fetching driver details from:', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-App-Version': '1.0.0',
            'X-Platform': 'ReactNative',
            'X-Environment': 'development',
          },
        });
        console.log('[ProfileScreen] Response status:', response.status);
        if (!response.ok) {
          setError('Failed to fetch driver details.');
          console.error('[ProfileScreen] Failed to fetch driver details. Status:', response.status);
          setLoading(false);
          return;
        }
        const data = await response.json();
        console.log('[ProfileScreen] Backend response data:', data);
        setDriverDetails(data);
      } catch (err) {
        setError('An error occurred while fetching driver details.');
        console.error('[ProfileScreen] Error while fetching driver details:', err);
      } finally {
        setLoading(false);
        console.log('[ProfileScreen] Finished fetching driver details.');
      }
    };
    fetchDriverDetails();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  }, []);

  const getUserPhoto = () => {
    return user?.imageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user?.firstName) {
      return user.firstName;
    } else if (user?.fullName) {
      return user.fullName;
    }
    return 'User';
  };

  // Demo values for stats (replace with real data if available)
  const totalRides = 47;
  const totalEarnings = '₹2,340';
  const rating = 4.8;

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, marginTop: 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: Colors.text, marginLeft: 8 }}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.profileCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>  
          <View style={styles.profilePhotoContainer}>
            <Image source={{ uri: getUserPhoto() }} style={styles.profilePhoto} />
          </View>
          <Text style={styles.profileName}>{getUserName()}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalRides}</Text>
              <Text style={styles.statLabel}>Total Rides</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalEarnings}</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.detailsCard}>
          <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.detailsTitle}>Personal Details</Text>
          </View>
          {loading ? (
            <Text>Loading driver details...</Text>
          ) : error ? (
            <Text style={{ color: 'red' }}>{error}</Text>
          ) : driverDetails ? (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{driverDetails.firstName} {driverDetails.lastName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{driverDetails.phoneNumber}</Text>
              </View>
              {/* <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>User Type:</Text>
                <Text style={styles.detailValue}>{driverDetails.userType}</Text>
              </View> */}
              {/* Add more fields as needed */}
            </>
          ) : (
            <Text>No driver details found.</Text>
          )}
        </View>
      </ScrollView>
      <View style={{ padding: 24 }}>
        <TouchableOpacity
          style={{ backgroundColor: '#FF3B30', borderRadius: 8, padding: 16, alignItems: 'center' }}
          onPress={async () => {
            await signOut();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Logout</Text>
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
  scrollContent: {
    paddingVertical: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.lg,
    alignItems: 'center',
  },
  profileCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.xl,
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  profilePhotoContainer: {
    marginBottom: Layout.spacing.md,
  },
  profilePhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  profileName: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: Layout.spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  detailsTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
  },
  detailLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    width: 90,
  },
  detailValue: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
});
