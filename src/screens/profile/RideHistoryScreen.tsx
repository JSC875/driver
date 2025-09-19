import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { mockRideHistory } from '../../data/mockData';
import { useRideHistory } from '../../store/RideHistoryContext';
import { RefreshControl } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { formatRidePrice } from '../../utils/priceUtils';
import { downloadReceipt, generateReceiptData } from '../../utils/receiptGenerator';

const { width } = Dimensions.get('window');

export default function RideHistoryScreen({ navigation }: any) {
  const [selectedTab, setSelectedTab] = useState('completed');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const { rides, loading, error, hasLoaded, clearHistory, refreshRideHistory } = useRideHistory();
  const { getToken } = useAuth();

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
    
    console.log('📱 RideHistoryScreen mounted - API call will be triggered automatically');
  }, []);

  // Separate useEffect for fetching ride history to avoid multiple calls
  useEffect(() => {
    // Only fetch if not already loaded
    if (!hasLoaded) {
      const loadRideHistory = async () => {
        try {
          const token = await getToken();
          console.log('🔑 Retrieved auth token for ride history:', token ? 'Available' : 'Not available');
          
          if (token) {
            await refreshRideHistory(token);
          } else {
            console.error('❌ No authentication token available');
          }
        } catch (error) {
          console.error('❌ Error loading ride history:', error);
        }
      };
      
      loadRideHistory();
    } else {
      console.log('📱 Ride history already loaded, skipping API call');
    }
  }, []); // Only run once on mount, don't depend on hasLoaded

  // Filter and sort rides (latest first)
  const filteredRides = rides
    .filter((ride) => {
      if (selectedTab === 'completed') {
        return ride.status === 'completed' || ride.status === 'accepted';
      } else if (selectedTab === 'cancelled') {
        return ride.status === 'cancelled';
      }
      return false;
    })
    .sort((a, b) => {
      // Sort by requestedAt date (latest first)
      const dateA = new Date(a.requestedAt || a.date).getTime();
      const dateB = new Date(b.requestedAt || b.date).getTime();
      return dateB - dateA; // Descending order (newest first)
    });

  const renderRideItem = ({ item, index }: any) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity style={styles.rideCard} activeOpacity={0.7}>
        <View style={styles.rideHeader}>
          <View style={styles.rideDate}>
            <Text style={styles.dateText}>{item.date}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          <View style={styles.fareContainer}>
            <Text style={styles.fareText}>{formatRidePrice(item.fare)}</Text>
          </View>
        </View>

        <View style={styles.rideRoute}>
          <View style={styles.routePoint}>
            <View style={styles.pickupDot} />
            <Text style={styles.routeText}>{item.from}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routePoint}>
            <View style={styles.destinationDot} />
            <Text style={styles.routeText}>{item.to}</Text>
          </View>
        </View>

        <View style={styles.rideFooter}>
          <View style={styles.rideStats}>
            <View style={styles.statItem}>
              <Ionicons name="location" size={14} color={Colors.gray400} />
              <Text style={styles.statText}>{item.distance} km</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={14} color={Colors.gray400} />
              <Text style={styles.statText}>{item.duration} mins</Text>
            </View>
          </View>
          
          <View style={styles.rideActions}>
            {item.status === 'cancelled' ? (
              <View style={styles.cancellationContainer}>
                <Ionicons name="close-circle" size={14} color="#ff4444" />
                <Text style={styles.cancellationText}>{item.cancellationReason}</Text>
              </View>
            ) : (
              <>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color={Colors.accent} />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={async () => {
                    try {
                      // Generate receipt data from ride history item
                      const receiptData = generateReceiptData(
                        {
                          rideId: item.id,
                          pickupAddress: item.from,
                          dropoffAddress: item.to,
                          distance: item.distance,
                          duration: item.duration,
                          price: item.fare.toString(),
                          paymentMethod: 'Cash',
                        },
                        {
                          name: 'Driver Name',
                          vehicleModel: 'Vehicle Model',
                          vehicleNumber: 'Vehicle Number',
                        }
                      );

                      const success = await downloadReceipt(receiptData);
                      
                      if (success) {
                        Alert.alert(
                          'Success',
                          'Receipt downloaded successfully! You can find it in your downloads folder.',
                          [{ text: 'OK' }]
                        );
                      } else {
                        Alert.alert(
                          'Error',
                          'Failed to download receipt. Please try again.',
                          [{ text: 'OK' }]
                        );
                      }
                    } catch (error) {
                      console.error('Error downloading receipt:', error);
                      Alert.alert(
                        'Error',
                        'An error occurred while downloading the receipt. Please try again.',
                        [{ text: 'OK' }]
                      );
                    }
                  }}
                >
                  <Ionicons name="download-outline" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride History</Text>
        <TouchableOpacity 
          style={styles.filterButton} 
          activeOpacity={0.7}
          onPress={async () => {
            try {
              const token = await getToken();
              if (token) {
                await refreshRideHistory(token);
              }
            } catch (error) {
              console.error('❌ Error refreshing ride history:', error);
            }
          }}
          disabled={loading}
        >
          {loading ? (
            <Ionicons name="refresh" size={24} color={Colors.primary} />
          ) : (
            <Ionicons name="refresh" size={24} color={Colors.text} />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Tabs */}
      <Animated.View style={[styles.tabsContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'completed' && styles.activeTab,
          ]}
          onPress={() => setSelectedTab('completed')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'completed' && styles.activeTabText,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'cancelled' && styles.activeTab,
          ]}
          onPress={() => setSelectedTab('cancelled')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'cancelled' && styles.activeTabText,
            ]}
          >
            Cancelled
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Ride List */}
      <FlatList
        data={filteredRides}
        renderItem={renderRideItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={async () => {
              try {
                const token = await getToken();
                if (token) {
                  await refreshRideHistory(token);
                }
              } catch (error) {
                console.error('❌ Error refreshing ride history:', error);
              }
            }}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading ride history...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color={Colors.error} />
                <Text style={styles.errorText}>Failed to load ride history</Text>
                <Text style={styles.errorSubtext}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={async () => {
                  try {
                    const token = await getToken();
                    if (token) {
                      await refreshRideHistory(token);
                    }
                  } catch (error) {
                    console.error('❌ Error retrying ride history:', error);
                  }
                }}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="time" size={48} color={Colors.gray400} />
                <Text style={styles.emptyStateText}>No ride history yet</Text>
                <Text style={styles.emptyStateSubtext}>Your completed rides will appear here</Text>
              </View>
            )}
          </View>
        }
      />
      {/* Clear History Button */}
      <TouchableOpacity style={{ alignSelf: 'center', margin: 16 }} onPress={clearHistory}>
        <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Clear Ride History</Text>
      </TouchableOpacity>
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
  filterButton: {
    padding: Layout.spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: Layout.spacing.lg,
  },
  rideCard: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  rideDate: {
    flex: 1,
  },
  dateText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  timeText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  fareContainer: {
    backgroundColor: Colors.gray50,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.sm,
  },
  fareText: {
    fontSize: Layout.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  rideRoute: {
    marginBottom: Layout.spacing.md,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xs,
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: Layout.spacing.md,
  },
  destinationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.coral,
    marginRight: Layout.spacing.md,
  },
  routeText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text,
    flex: 1,
  },
  routeLine: {
    width: 1,
    height: 16,
    backgroundColor: Colors.gray300,
    marginLeft: 3,
    marginVertical: 2,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  rideStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  statText: {
    marginLeft: Layout.spacing.xs,
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  rideActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  ratingText: {
    marginLeft: Layout.spacing.xs,
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  downloadButton: {
    padding: Layout.spacing.xs,
    marginLeft: Layout.spacing.sm,
  },
  cancellationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffebee',
  },
  cancellationText: {
    fontSize: Layout.fontSize.xs,
    color: '#ff4444',
    fontWeight: '500',
    marginLeft: 4,
    flex: 1,
  },
  rebookButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.sm,
  },
  rebookText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.md,
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  errorText: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Layout.spacing.md,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.sm,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  retryButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  emptyStateText: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Layout.spacing.md,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.sm,
    textAlign: 'center',
  },
});
