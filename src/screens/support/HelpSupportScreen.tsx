import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, PRIMARY_GREEN, TITLE_COLOR, SUBTITLE_COLOR } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const mockTrip = {
  date: 'Mon 22 Feb, 4:10 PM',
  route: 'Park Ave → Austin, Texas',
  fare: '$8.50',
  map: 'https://maps.googleapis.com/maps/api/staticmap?center=Austin,TX&zoom=13&size=200x80&maptype=roadmap&markers=color:green%7Clabel:A%7CAustin,TX', // placeholder
};

const menuItems = [
  { key: 'ride', label: 'Ride Issues', screen: 'RideIssues', icon: 'car-outline' },
  { key: 'payments', label: 'Payments and Refunds', screen: 'PaymentsIssues', icon: 'card-outline' },

  { key: 'account', label: 'Account related issues', screen: 'AccountIssues', icon: 'person-outline' },
  { key: 'other', label: 'Other Issues', screen: 'OtherIssues', icon: 'help-circle-outline' },
];

const extraMenu = [
  { key: 'privacy', label: 'Privacy Policy', screen: 'PersonalInfoUpdate', icon: 'shield-outline' },
  { key: 'terms', label: 'Terms and conditions', screen: 'TermsCondition', icon: 'document-text-outline' },
];

export default function HelpSupportScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Back" activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={TITLE_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </Animated.View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recent Trip Card */}
        {/* <Animated.View style={[styles.tripCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.tripCardLeft}>
            <Image source={{ uri: mockTrip.map }} style={styles.mapImage} />
          </View>
          <View style={styles.tripCardRight}>
            <Text style={styles.tripDate}>{mockTrip.date}</Text>
            <Text style={styles.tripRoute}>{mockTrip.route}</Text>
            <Text style={styles.tripFare}>{mockTrip.fare}</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.getHelpLink}>Get Help</Text>
            </TouchableOpacity>
          </View>
        </Animated.View> */}
        {/* Menu Items */}
        <Animated.View style={[styles.menuSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen, { category: item.key })}
              accessibilityLabel={item.label}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                </View>
              <Text style={styles.menuText}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          ))}
        </Animated.View>
        {/* Extra Menu */}
        <Animated.View style={[styles.menuSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {extraMenu.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
              accessibilityLabel={item.label}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                </View>
              <Text style={styles.menuText}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
      {/* Bottom Actions */}
      <Animated.View style={[styles.bottomBar, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.bottomButton}
          accessibilityLabel="Call Support"
          onPress={() => Linking.openURL('tel:+1234567890')}
          activeOpacity={0.7}
        >
          <Ionicons name="call-outline" size={20} color={PRIMARY_GREEN} />
          <Text style={styles.bottomButtonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomButton}
          accessibilityLabel="Chat with Support"
          onPress={() => navigation.navigate('Chat', { driver: { name: 'Support' } })}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={PRIMARY_GREEN} />
          <Text style={styles.bottomButtonText}>Chat</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: TITLE_COLOR,
  },
  content: {
    padding: Layout.spacing.lg,
    paddingBottom: 120,
  },
  tripCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tripCardLeft: {
    width: 90,
    height: 90,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapImage: {
    width: 80,
    height: 80,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.gray200,
  },
  tripCardRight: {
    flex: 1,
    padding: Layout.spacing.md,
    justifyContent: 'center',
  },
  tripDate: {
    fontSize: Layout.fontSize.sm,
    color: SUBTITLE_COLOR,
    marginBottom: 2,
  },
  tripRoute: {
    fontSize: Layout.fontSize.md,
    color: TITLE_COLOR,
    fontWeight: '500',
    marginBottom: 2,
  },
  tripFare: {
    fontSize: Layout.fontSize.md,
    color: PRIMARY_GREEN,
    fontWeight: '700',
    marginBottom: 2,
  },
  getHelpLink: {
    color: PRIMARY_GREEN,
    fontWeight: '600',
    marginTop: 4,
    fontSize: Layout.fontSize.sm,
  },
  menuSection: {
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
    backgroundColor: 'transparent',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  menuText: {
    fontSize: Layout.fontSize.md,
    color: TITLE_COLOR,
    fontWeight: '500',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: Layout.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 32,
    height: Layout.buttonHeight,
  },
  bottomButtonText: {
    marginLeft: 8,
    fontSize: Layout.fontSize.md,
    color: PRIMARY_GREEN,
    fontWeight: '600',
  },
}); 