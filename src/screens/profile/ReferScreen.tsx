import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function ReferScreen() {
  const { user } = useUser();
  const navigation = useNavigation();

  // Get name (firstName + lastName or fullName fallback)
  let name = '';
  if (user?.firstName && user?.lastName) {
    name = `${user.firstName}${user.lastName}`;
  } else if (user?.firstName) {
    name = user.firstName;
  } else if (user?.fullName) {
    name = user.fullName;
  }

  // Get phone number (last 4 digits)
  const phone = user?.primaryPhoneNumber?.phoneNumber || '';
  const last4 = phone.replace(/\D/g, '').slice(-4);

  // Generate referral code
  const first4 = name.replace(/\s/g, '').slice(0, 4).toUpperCase();
  const referralCode = `${first4}${last4}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Use my referral code ${referralCode} to sign up and earn rewards on Riderrr!`,
      });
    } catch (error) {
      // Optionally handle error
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={26} color="#1877f2" />
      </TouchableOpacity>
      <View style={styles.inner}>
        <Text style={styles.title}>Refer & Earn</Text>
        <Text style={styles.description}>
          Invite your friends and earn rewards when they take their first ride!
        </Text>
        <View style={styles.couponWrapper}>
          {/* Left cut-out */}
          <View style={styles.cutoutLeft} />
          {/* Coupon core */}
          <View style={styles.couponContainer}>
            <Text style={styles.couponLabel}>Your Referral Coupon</Text>
            <View style={styles.couponRow}>
              <Text style={styles.coupon}>{referralCode || '----'}</Text>
              <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                <Ionicons name="share-social" size={22} color="#1877f2" />
              </TouchableOpacity>
            </View>
          </View>
          {/* Right cut-out */}
          <View style={styles.cutoutRight} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const COUPON_HEIGHT = 70;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    backgroundColor: '#f2f6fc',
    borderRadius: 20,
    padding: 6,
    elevation: 2,
  },
  inner: {
    width: '90%',
    maxWidth: 350,
    alignItems: 'center',
    backgroundColor: '#f9fafd',
    paddingVertical: 32,
    paddingHorizontal: 18,
    borderRadius: 18,
    shadowColor: '#1877f2',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1877f2',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 2,
  },
  couponWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
    width: '100%',
    justifyContent: 'center',
    height: COUPON_HEIGHT,
  },
  cutoutLeft: {
    width: 22,
    height: COUPON_HEIGHT,
    backgroundColor: 'transparent',
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
    marginRight: -11,
    zIndex: 2,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: '#eaf0fb',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 1, height: 0 },
  },
  cutoutRight: {
    width: 22,
    height: COUPON_HEIGHT,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50,
    marginLeft: -11,
    zIndex: 2,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: '#eaf0fb',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: -1, height: 0 },
  },
  couponContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#1877f2',
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1877f2',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flexDirection: 'column',
    height: COUPON_HEIGHT,
  },
  couponLabel: {
    fontSize: 13,
    color: '#1877f2',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  coupon: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#222',
    backgroundColor: '#eaf0fb',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  shareButton: {
    backgroundColor: '#eaf0fb',
    borderRadius: 50,
    padding: 7,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
}); 