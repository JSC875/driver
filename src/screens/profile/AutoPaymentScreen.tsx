import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import PriceRoundingDemo from '../../components/common/PriceRoundingDemo';

const { width, height } = Dimensions.get('window');

export default function AutoPaymentScreen() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1877f2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Auto Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Coming Soon Card */}
        <Animated.View
          style={[
            styles.comingSoonCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons name="card" size={60} color="#fff" />
            </Animated.View>
            <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
            <Text style={styles.comingSoonSubtitle}>
              Auto Payment feature is under development
            </Text>
            <Text style={styles.comingSoonDescription}>
              We're working hard to bring you seamless automatic payment processing. 
              Stay tuned for updates!
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Features Preview */}
        <Animated.View
          style={[
            styles.featuresContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.featuresTitle}>What to Expect</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#00C853" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Secure Payments</Text>
              <Text style={styles.featureDescription}>
                Bank-level security for all your transactions
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="time" size={24} color="#FF9500" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Instant Processing</Text>
              <Text style={styles.featureDescription}>
                Payments processed in real-time
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="notifications" size={24} color="#007AFF" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Smart Notifications</Text>
              <Text style={styles.featureDescription}>
                Get notified about all payment activities
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Price Rounding Demo */}
        {/* <Animated.View
          style={[
            styles.demoContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <PriceRoundingDemo />
        </Animated.View> */}

        {/* Notify Me Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.notifyButton}
            activeOpacity={0.8}
            onPress={() => {
              // Handle notification signup
              console.log('Notify me button pressed');
            }}
          >
            <LinearGradient
              colors={['#00C853', '#00E676']}
              style={styles.buttonGradient}
            >
              <Ionicons name="notifications" size={20} color="#fff" />
              <Text style={styles.notifyButtonText}>Notify Me When Available</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  comingSoonCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientBackground: {
    padding: 30,
    alignItems: 'center',
    minHeight: 200,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 15,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  demoContainer: {
    marginBottom: 30,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  notifyButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 16,
  },
  notifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

