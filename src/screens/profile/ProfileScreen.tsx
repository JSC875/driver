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
import { walletService, WalletBalanceResponse } from '../../services/walletService';
import { useRideHistory } from '../../store/RideHistoryContext';

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
  
  // State for earnings and stats
  const [earningsData, setEarningsData] = useState<WalletBalanceResponse | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [earningsError, setEarningsError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // Get ride history for total rides count
  const { rides, fetchRideHistory } = useRideHistory();

  // Fetch driver details, earnings, and ride history
  useEffect(() => {
    let isMounted = true;
    
    const fetchAllData = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      setError(null);
      setEarningsLoading(true);
      setEarningsError(null);
      
      try {
        const token = await getToken();
        console.log('[ProfileScreen] Retrieved token:', token);
        if (!token) {
          setError('No auth token found.');
          console.error('[ProfileScreen] No auth token found.');
          return;
        }
        
        // Fetch driver details
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
        } else {
          const data = await response.json();
          console.log('[ProfileScreen] Backend response data:', data);
          if (isMounted) {
            setDriverDetails(data);
          }
        }
        
        // Fetch earnings data and transactions
        try {
          console.log('[ProfileScreen] Fetching earnings data...');
          const earningsResponse = await walletService.getWalletBalance(user?.id || '', token);
          console.log('[ProfileScreen] Earnings response:', earningsResponse);
          
          if (earningsResponse.success && isMounted) {
            setEarningsData(earningsResponse);
          } else if (isMounted) {
            setEarningsError(earningsResponse.error || 'Failed to fetch earnings');
            console.error('[ProfileScreen] Failed to fetch earnings:', earningsResponse.error);
          }
          
                     // Fetch transactions to calculate total earnings
           console.log('[ProfileScreen] Fetching transactions...');
           const transactionsResponse = await walletService.getWalletTransactions(user?.id || '', token);
           console.log('[ProfileScreen] Transactions response:', transactionsResponse);
           
           if (transactionsResponse.success && transactionsResponse.data && isMounted) {
             const fetchedTransactions = transactionsResponse.data.transactions || [];
             console.log('[ProfileScreen] Setting transactions:', fetchedTransactions);
             setTransactions(fetchedTransactions);
           } else {
             console.log('[ProfileScreen] Failed to fetch transactions or no data');
           }
        } catch (earningsErr) {
          if (isMounted) {
            setEarningsError('Failed to fetch earnings data');
          }
          console.error('[ProfileScreen] Error fetching earnings:', earningsErr);
        }
        
        // Fetch ride history for total rides count
        try {
          console.log('[ProfileScreen] Fetching ride history...');
          await fetchRideHistory(token);
        } catch (rideErr) {
          console.error('[ProfileScreen] Error fetching ride history:', rideErr);
        }
        
      } catch (err) {
        if (isMounted) {
          setError('An error occurred while fetching data.');
        }
        console.error('[ProfileScreen] Error while fetching data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setEarningsLoading(false);
        }
        console.log('[ProfileScreen] Finished fetching all data.');
      }
    };
    
    fetchAllData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Remove dependencies to prevent multiple calls

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
    // First try to get name from driver details (backend data)
    if (driverDetails?.firstName && driverDetails?.lastName) {
      return `${driverDetails.firstName} ${driverDetails.lastName}`;
    } else if (driverDetails?.firstName) {
      return driverDetails.firstName;
    }
    
    // Fallback to Clerk user data
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user?.firstName) {
      return user.firstName;
    } else if (user?.fullName) {
      return user.fullName;
    }
    
    return 'User';
  };

  // Calculate real stats from backend data
  const calculateStats = () => {
    // Total rides from ride history (completed rides only)
    const totalRides = rides.filter(ride => ride.status === 'completed').length;
    
    // Calculate total earnings from transactions (same as wallet section)
    let totalEarnings = 0;
    let todayEarnings = 0;
    const today = new Date().toLocaleDateString();
    
    console.log('[ProfileScreen] Calculating earnings from transactions:', transactions.length, 'transactions');
    console.log('[ProfileScreen] Today\'s date:', today);
    
         transactions.forEach((transaction, index) => {
       console.log(`[ProfileScreen] Transaction ${index}:`, {
         type: transaction.type,
         transactionType: transaction.transactionType,
         description: transaction.description,
         amount: transaction.amount,
         date: transaction.date,
         timestamp: transaction.timestamp
       });
       
       // Check for ride payment transactions - handle both processed and raw transaction data
       const isRidePayment = (
         (transaction.type === 'credit' && transaction.description === 'Ride payment') ||
         (transaction.transactionType === 'CREDIT' && transaction.description?.includes('Ride payment'))
       );
       
       if (isRidePayment) {
         const amount = transaction.amount || 0;
         totalEarnings += amount;
         console.log('[ProfileScreen] Adding to total earnings:', amount);
         
         // Check if transaction is from today
         const transactionDate = transaction.date || new Date(transaction.timestamp).toLocaleDateString();
         if (transactionDate === today) {
           todayEarnings += amount;
           console.log('[ProfileScreen] Adding to today\'s earnings:', amount);
         }
       }
     });
    
    console.log('[ProfileScreen] Final calculations:', {
      totalEarnings,
      todayEarnings,
      totalRides
    });
    
    // Rating from driver details or default
    const rating = driverDetails?.rating || 4.8;
    
    return {
      totalRides,
      totalEarnings,
      todayEarnings,
      rating
    };
  };
  
  const { totalRides, totalEarnings, todayEarnings, rating } = calculateStats();

  // Memoize refresh function to prevent unnecessary re-renders
  const handleRefresh = useCallback(async () => {
    // Prevent multiple simultaneous refresh calls
    if (loading || earningsLoading) {
      console.log('[ProfileScreen] Refresh already in progress, skipping...');
      return;
    }
    
    setLoading(true);
    setEarningsLoading(true);
    setError(null);
    setEarningsError(null);
    
    try {
      const token = await getToken();
      if (token) {
        // Refresh ride history
        await fetchRideHistory(token);
        // Refresh earnings and transactions
        const earningsResponse = await walletService.getWalletBalance(user?.id || '', token);
        if (earningsResponse.success) {
          setEarningsData(earningsResponse);
        } else {
          setEarningsError(earningsResponse.error || 'Failed to refresh earnings');
        }
        
        // Refresh transactions
        const transactionsResponse = await walletService.getWalletTransactions(user?.id || '', token);
        if (transactionsResponse.success && transactionsResponse.data) {
          setTransactions(transactionsResponse.data.transactions || []);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
      setEarningsLoading(false);
    }
  }, [loading, earningsLoading, getToken, user?.id, fetchRideHistory]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
            <Ionicons name="arrow-back" size={26} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: Colors.text, marginLeft: 8 }}>Profile</Text>
        </View>
                 <TouchableOpacity 
           onPress={handleRefresh}
                       style={{ 
              padding: 8,
              opacity: (loading || earningsLoading) ? 0.5 : 1
            }}
            disabled={loading || earningsLoading}
          >
           <Ionicons 
             name="refresh" 
             size={24} 
             color={Colors.primary}
             style={{
               transform: [{ rotate: (loading || earningsLoading) ? '180deg' : '0deg' }]
             }}
           />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.profileCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>  
          <View style={styles.profilePhotoContainer}>
            <Image source={{ uri: getUserPhoto() }} style={styles.profilePhoto} />
          </View>
          <Text style={styles.profileName}>{getUserName()}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {loading ? '...' : totalRides}
              </Text>
              <Text style={styles.statLabel}>Total Rides</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {earningsLoading ? '...' : `₹${totalEarnings.toLocaleString()}`}
              </Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {loading ? '...' : rating.toFixed(1)}
              </Text>
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



        {/* Error Display */}
        {earningsError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>⚠️ {earningsError}</Text>
          </View>
        )}
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
  totalEarningsRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Layout.spacing.sm,
    marginTop: Layout.spacing.sm,
  },
  totalEarningsLabel: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  totalEarningsValue: {
    fontWeight: 'bold',
    color: Colors.primary,
    fontSize: Layout.fontSize.md,
  },
  errorCard: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginTop: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: Layout.fontSize.sm,
    color: '#DC2626',
    textAlign: 'center',
  },
});
