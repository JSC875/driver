import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSignIn } from '@clerk/clerk-expo';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const { width, height } = Dimensions.get('window');

const COUNTRY_CODES = [
  { code: '+91', label: 'IN' },
  { code: '+1', label: 'US' },
];

export default function LoginScreen({ navigation }: any) {
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  const [showDropdown, setShowDropdown] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, setActive, isLoaded } = useSignIn();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSendOTP = async () => {
    if (!isLoaded) return;

    // US: 10 digits, IN: 10 digits (can be customized if needed)
    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);

    try {
      // Format phone number for Clerk (add selected country code)
      const formattedPhone = `${countryCode}${phoneNumber}`;
      // Start the sign-in process using the phone number method
      const { supportedFirstFactors } = await signIn.create({
        identifier: formattedPhone,
      });
      // Find the phone number factor
      const phoneNumberFactor = supportedFirstFactors?.find((factor: any) => {
        return factor.strategy === 'phone_code';
      }) as any;
      if (phoneNumberFactor) {
        // Prepare the phone number verification
        await signIn.prepareFirstFactor({
          strategy: 'phone_code',
          phoneNumberId: phoneNumberFactor.phoneNumberId,
        });
        navigation.navigate('OTPVerification', {
          phoneNumber: formattedPhone,
          isSignIn: true,
        });
      }
    } catch (err: any) {
      console.error('Error:', err);
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const renderCountryCodeSelector = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity
        style={styles.countryCodeButton}
        onPress={() => setShowDropdown(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.countryCodeText}>{countryCode}</Text>
        <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.gray400} />
      </TouchableOpacity>
      <Modal
        visible={showDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Country Code</Text>
          {COUNTRY_CODES.map((item) => (
            <TouchableOpacity
              key={item.code}
              style={styles.modalItem}
              onPress={() => {
                setCountryCode(item.code);
                setShowDropdown(false);
              }}
            >
              <Text style={styles.modalItemText}>{item.label} {item.code}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.iconContainer}>
              <Image source={require('../../../assets/images/Mainlogo.jpeg')} style={{ width: 360, height: 360 }} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Enter your mobile number to sign in
            </Text>
          </Animated.View>

          <Animated.View style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.inputContainer}>
              <Input
                label="Mobile Number"
                placeholder="Enter your mobile number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={10}
                leftElement={renderCountryCodeSelector()}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Send OTP"
                onPress={handleSendOTP}
                loading={isLoading}
                fullWidth
                disabled={phoneNumber.length !== 10}
              />
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
              <Text style={styles.signUpText}>
                Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#1877f2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    flex: 1,
    paddingHorizontal: 8,
  },
  inputContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  signUpButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  signUpText: {
    fontSize: 16,
    color: '#666',
  },
  signUpLink: {
    color: '#1877f2',
    fontWeight: '600',
  },
  footer: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#1877f2',
    fontWeight: '500',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    marginTop: 'auto',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
});
