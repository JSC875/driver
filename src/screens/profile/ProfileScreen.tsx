import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const profileOptions = [
  {
    id: '0',
    title: 'Personal Details',
    icon: 'person-circle-outline',
    screen: 'PersonalDetails',
  },
  {
    id: '2',
    title: 'Wallet & Payments',
    icon: 'wallet-outline',
    screen: 'Wallet',
  },
  {
    id: '3',
    title: 'Settings',
    icon: 'settings-outline',
    screen: 'Settings',
  },
  {
    id: '4',
    title: 'About',
    icon: 'information-circle-outline',
    screen: 'About',
  },
];

export default function ProfileScreen({ navigation, route }: any) {
  const { signOut } = useAuth();
  const { user } = useUser();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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

  const [profilePhoto, setProfilePhoto] = useState(getUserPhoto());

  useFocusEffect(
    useCallback(() => {
      if (route?.params?.updatedPhoto) {
        setProfilePhoto(route.params.updatedPhoto);
      }
    }, [route])
  );

  const handleOptionPress = (screen: string) => {
    if (screen === 'PersonalDetails') {
      navigation.navigate('PersonalDetails', {
        name: getUserName(),
        email: getUserEmail(),
        phone: getUserPhone(),
        gender: '',
        emergencyName: '',
        emergencyPhone: '',
        photo: getUserPhoto(),
      });
    } else if (screen === 'EditProfile') {
      navigation.navigate('EditProfile');
    } else if (screen === 'RideHistory') {
      navigation.navigate('RideHistory');
    } else if (screen === 'Wallet') {
      navigation.navigate('Wallet');
    } else if (screen === 'Settings') {
      navigation.navigate('Settings');
    } else if (screen === 'About') {
      navigation.navigate('About');
    } else {
      console.log(`Navigate to ${screen}`);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
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

  const getUserEmail = () => {
    return user?.primaryEmailAddress?.emailAddress || '';
  };

  const getUserPhone = () => {
    return user?.primaryPhoneNumber?.phoneNumber || '';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <Animated.View style={[styles.profileCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.profileInfo}>
            <View style={styles.profilePhotoContainer}>
            <Image
              source={{ uri: profilePhoto }}
              style={styles.profilePhoto}
            />
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{getUserName()}</Text>
              {getUserEmail() && (
                <Text style={styles.profileEmail}>{getUserEmail()}</Text>
              )}
              {getUserPhone() && (
                <Text style={styles.profilePhone}>{getUserPhone()}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile', {
              name: getUserName(),
              email: getUserEmail(),
              phone: getUserPhone(),
            })} activeOpacity={0.7}>
              <Ionicons name="pencil" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>47</Text>
              <Text style={styles.statLabel}>Total Rides</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹2,340</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={[styles.quickActions, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ScheduleRide')} activeOpacity={0.7}>
              <View style={styles.actionIcon}>
                <Ionicons name="time" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Schedule Ride</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('RideHistory')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="receipt" size={24} color={Colors.accent} />
              </View>
              <Text style={styles.actionText}>Ride History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.getParent()?.navigate('Offers')} activeOpacity={0.7}>
              <View style={styles.actionIcon}>
                <Ionicons name="gift" size={24} color={Colors.coral} />
              </View>
              <Text style={styles.actionText}>Offers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('HelpSupport')} activeOpacity={0.7}>
              <View style={styles.actionIcon}>
                <Ionicons name="help-circle" size={24} color={Colors.info} />
              </View>
              <Text style={styles.actionText}>Support</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Menu Options */}
        <Animated.View style={[styles.menuContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {profileOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={styles.menuItem}
              onPress={() => handleOptionPress(option.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                <Ionicons
                  name={option.icon as any}
                  size={24}
                    color={Colors.primary}
                />
                </View>
                <Text style={styles.menuItemText}>{option.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Logout */}
        <Animated.View style={[styles.logoutContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={24} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        </Animated.View>
      </ScrollView>
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
  },
  headerTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  notificationButton: {
    padding: Layout.spacing.sm,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: Colors.white,
    margin: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  profilePhotoContainer: {
    position: 'relative',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: Layout.spacing.md,
  },
  onlineIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
    right: 0,
    bottom: 0,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  profileEmail: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.xs,
  },
  profilePhone: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Layout.spacing.lg,
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
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.borderLight,
  },
  quickActions: {
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
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.sm,
  },
  actionText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  menuContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  menuItemText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  logoutContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
  },
  logoutText: {
    fontSize: Layout.fontSize.md,
    color: Colors.error,
    fontWeight: '600',
    marginLeft: Layout.spacing.sm,
  },
});
