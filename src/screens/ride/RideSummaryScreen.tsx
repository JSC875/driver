
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import Button from '../../components/common/Button';
import { useOnlineStatus } from '../../store/OnlineStatusContext';
import { useAuth } from '@clerk/clerk-expo';
import HomeScreen from '../home/HomeScreen';
import { downloadReceipt, generateReceiptData } from '../../utils/receiptGenerator';

function goToHome(navigation: any) {
  navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
}

const feedbackTags = [
  
  'On time',
  'Easy directions',
  'Friendly',
  'Late pickup',
  'Disrespectful Behaviour',
  'Unclear Instructions',
];

export default function RideSummaryScreen({ navigation, route }: any) {
  const { destination, estimate, driver } = route.params;
  const { setIsOnline, resetDriverStatus } = useOnlineStatus();
  const { getToken } = useAuth();
  // Add these hooks to clear ride state
  const [_, setRideInProgress] = React.useState(null);
  const [__, setNavigationRide] = React.useState(null);
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tip, setTip] = useState(0);

  // Function to update driver online status on backend
  const updateDriverOnlineStatusOnBackend = async (token: string) => {
    try {
      console.log('📡 Calling /api/drivers/me/status endpoint for ONLINE (RideSummary)...');
      
      const response = await fetch('https://bike-taxi-production.up.railway.app/api/drivers/me/status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-App-Version': '1.0.0',
          'X-Platform': 'ReactNative',
          'X-Environment': 'development',
        },
        body: JSON.stringify({
          status: 'ONLINE'
        }),
      });

      const responseText = await response.text();
      let data = null;
      
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (jsonErr) {
          console.error('❌ Failed to parse response as JSON:', jsonErr);
        }
      }

      if (response.ok) {
        console.log('✅ Online status update successful (RideSummary)!');
        console.log('📊 Response data:', data);
        return true;
      } else {
        console.error('❌ Online status update failed (RideSummary)');
        console.error('📊 Response status:', response.status);
        console.error('📊 Response data:', data);
        return false;
      }
    } catch (error) {
      console.error('❌ Error during online status update (RideSummary):', error);
      return false;
    }
  };

  const handleRating = (value: number) => {
    setRating(value);
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleTip = (amount: number) => {
    setTip(amount);
  };

  const handleSubmitFeedback = async () => {
    // Reset driver status to available
    resetDriverStatus();
    setIsOnline(true);
    
    // Update driver status to ONLINE on backend
    try {
      const onlineToken = await getToken({ template: 'driver_app_token' });
      if (onlineToken) {
        const statusSuccess = await updateDriverOnlineStatusOnBackend(onlineToken);
        if (statusSuccess) {
          console.log('✅ Driver status updated to ONLINE after ride completion');
        } else {
          console.error('❌ Failed to update driver status to ONLINE after ride completion');
        }
      }
    } catch (err) {
      console.error('Failed to update driver status after ride completion:', err);
    }
    
    setRideInProgress(null);
    setNavigationRide(null);
    goToHome(navigation);
  };

  const handleBookAnother = () => {
    navigation.navigate('Main');
  };

  const handleDownloadReceipt = async () => {
    try {
      // Generate receipt data from current ride information
      const receiptData = generateReceiptData(
        {
          rideId: `RIDE_${Date.now()}`,
          pickupAddress: 'Your pickup location',
          dropoffAddress: destination?.name || 'Destination',
          distance: estimate.distance,
          duration: estimate.duration,
          price: estimate.fare,
          paymentMethod: 'Cash',
        },
        {
          name: driver?.name || 'Driver Name',
          vehicleModel: driver?.vehicleModel || 'Vehicle Model',
          vehicleNumber: driver?.vehicleNumber || 'Vehicle Number',
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={60} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Ride Completed!</Text>
          <Text style={styles.successSubtitle}>
            Hope you had a great experience
          </Text>
        </View>

        {/* Trip Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Trip Summary</Text>
          
          <View style={styles.routeInfo}>
            <View style={styles.routePoint}>
              <View style={styles.pickupDot} />
              <View style={styles.routeDetails}>
                <Text style={styles.routeLabel}>From</Text>
                <Text style={styles.routeAddress}>Your pickup location</Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routePoint}>
              <View style={styles.destinationDot} />
              <View style={styles.routeDetails}>
                <Text style={styles.routeLabel}>To</Text>
                <Text style={styles.routeAddress}>{destination?.name || 'Destination'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.tripStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{estimate.distance}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{estimate.duration}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{estimate.fare}</Text>
              <Text style={styles.statLabel}>Fare</Text>
            </View>
          </View>
        </View>

        {/* Customer Rating */}
        <View style={styles.ratingCard}>
          <Text style={styles.cardTitle}>Rate Your Customer</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={star <= rating ? Colors.accent : Colors.gray300}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <View style={styles.feedbackTags}>
              <Text style={styles.tagsTitle}>What went well?</Text>
              <View style={styles.tagsContainer}>
                {feedbackTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagButton,
                      selectedTags.includes(tag) && styles.tagButtonSelected,
                    ]}
                    onPress={() => handleTagToggle(tag)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedTags.includes(tag) && styles.tagTextSelected,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
        {/* Payment Summary */}
        <View style={styles.paymentCard}>
          <Text style={styles.cardTitle}>Payment Summary</Text>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Ride Fare</Text>
            <Text style={styles.paymentValue}>{estimate.fare}</Text>
          </View>
          <View style={styles.paymentDivider} />
          <View style={styles.paymentTotal}>
            <Text style={styles.paymentTotalLabel}>Total Received</Text>
            <Text style={styles.paymentTotalValue}>{estimate.fare}</Text>
          </View>
        </View>
      </ScrollView>
      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          title="Submit Feedback"
          onPress={handleSubmitFeedback}
          style={styles.submitButton}
        />
        
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownloadReceipt}
        >
          <Ionicons name="download-outline" size={20} color={Colors.white} />
          <Text style={styles.downloadButtonText}>Download Receipt</Text>
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
  content: {
    flex: 1,
  },
  successHeader: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
    backgroundColor: Colors.white,
    marginBottom: Layout.spacing.md,
  },
  successIcon: {
    marginBottom: Layout.spacing.md,
  },
  successTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  successSubtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  routeInfo: {
    marginBottom: Layout.spacing.md,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginRight: Layout.spacing.md,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.coral,
    marginRight: Layout.spacing.md,
  },
  routeDetails: {
    flex: 1,
    paddingVertical: Layout.spacing.sm,
  },
  routeLabel: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  routeAddress: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.gray300,
    marginLeft: 5,
    marginVertical: 4,
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statItem: {
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
    marginTop: Layout.spacing.xs,
  },
  ratingCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  driverPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Layout.spacing.md,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  vehicleInfo: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Layout.spacing.lg,
  },
  starButton: {
    marginHorizontal: Layout.spacing.xs,
  },
  feedbackTags: {
    marginTop: Layout.spacing.md,
  },
  tagsTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagButton: {
    backgroundColor: Colors.gray50,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 50,
    marginRight: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text,
  },
  tagTextSelected: {
    color: Colors.white,
  },
  tipCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tipSubtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.md,
  },
  tipOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tipButton: {
    backgroundColor: Colors.gray50,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 80,
    alignItems: 'center',
  },
  tipButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tipText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  tipTextSelected: {
    color: Colors.white,
  },
  paymentCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
  },
  paymentLabel: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
  },
  paymentValue: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Layout.spacing.sm,
  },
  paymentTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Layout.spacing.sm,
  },
  paymentTotalLabel: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentTotalValue: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  bottomActions: {
    backgroundColor: Colors.white,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  submitButton: {
    marginBottom: Layout.spacing.sm,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.md,
    marginTop: Layout.spacing.sm,
  },
  downloadButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: Layout.spacing.sm,
  },
  bookAnotherButton: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
  },
  bookAnotherText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
});
