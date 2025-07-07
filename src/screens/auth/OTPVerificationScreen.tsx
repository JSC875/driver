import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../store/useAuthStore';

const { width, height } = Dimensions.get('window');

export default function OTPVerificationScreen({ navigation, route }: any) {
  const { phoneNumber, isSignIn } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  const { setTestAuthenticated } = useAuthStore();
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    // Prevent multiple verification attempts
    if (isLoading || otpVerified) {
      return;
    }
    
    const otpString = otp.join('');
    console.log('OTP verification attempt with:', otpString);
    console.log('isSignIn:', isSignIn);
    console.log('signIn available:', !!signIn);
    console.log('signUp available:', !!signUp);
    
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter complete OTP');
      return;
    }

    setIsLoading(true);

    try {
      // For development/testing: Check if it's a test OTP (123456)
      if (otpString === '123456') {
        console.log('Test OTP detected, simulating successful verification');
        setOtpVerified(true);
        
        // For test OTP, we need to manually complete the sign-up process
        if (isSignIn) {
          // For sign-in test flow, we'll simulate the session
          setTimeout(() => {
            console.log('Test sign-in completed, setting test authentication');
            setTestAuthenticated(true);
          }, 1000);
        } else {
          // For sign-up test flow, navigate to profile setup
          setTimeout(() => {
            navigation.navigate('ProfileSetup');
          }, 1000);
        }
        return;
      }

      // For development: Also accept any 6-digit code starting with '1' as valid
      if (otpString.length === 6 && otpString.startsWith('1')) {
        console.log('Development OTP detected, simulating successful verification');
        setOtpVerified(true);
        
        if (isSignIn) {
          setTimeout(() => {
            console.log('Development sign-in completed, setting test authentication');
            setTestAuthenticated(true);
          }, 1000);
        } else {
          setTimeout(() => {
            navigation.navigate('ProfileSetup');
          }, 1000);
        }
        return;
      }

      if (isSignIn && signIn) {
        console.log('Attempting sign-in OTP verification with code:', otpString);
        const completeSignIn = await signIn.attemptFirstFactor({
          strategy: 'phone_code',
          code: otpString,
        });
        console.log('Sign-in OTP verification result:', completeSignIn);

        if (completeSignIn?.status === 'complete') {
          console.log('Sign-in successful, setting active session');
          setOtpVerified(true);
          await setSignInActive({ session: completeSignIn.createdSessionId });
          // User will be automatically redirected to main app by Clerk's useAuth hook
        } else {
          console.log('Sign-in verification failed with status:', completeSignIn?.status);
          throw new Error('OTP verification failed');
        }
      } else if (signUp) {
        console.log('Attempting sign-up OTP verification with code:', otpString);
        const completeSignUp = await signUp.attemptPhoneNumberVerification({
          code: otpString,
        });
        console.log('Sign-up OTP verification result:', completeSignUp);

        if (completeSignUp?.status === 'complete') {
          console.log('Sign-up successful, setting active session and navigating to ProfileSetup');
          setOtpVerified(true);
          await setSignUpActive({ session: completeSignUp.createdSessionId });
          navigation.navigate('ProfileSetup');
        } else if (completeSignUp?.status === 'missing_requirements') {
          console.log('OTP verified but missing requirements, this should be handled in SignUpScreen');
          // This case should be handled in the SignUpScreen where we have access to firstName/lastName
          throw new Error('Please complete the signup process in the previous screen');
        } else {
          console.log('Sign-up verification failed with status:', completeSignUp?.status);
          throw new Error('OTP verification failed');
        }
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      const errorMessage = err?.errors?.[0]?.message || err?.message || 'Invalid OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      if (isSignIn && signIn) {
        const { supportedFirstFactors } = await signIn.create({
          identifier: phoneNumber,
        });

        const phoneNumberFactor = supportedFirstFactors?.find((factor: any) => {
          return factor.strategy === 'phone_code';
        }) as any;

        if (phoneNumberFactor) {
          await signIn.prepareFirstFactor({
            strategy: 'phone_code',
            phoneNumberId: phoneNumberFactor.phoneNumberId,
          });
        }
      } else if (signUp) {
        await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
      }
      
      setTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setOtpVerified(false); // Reset verification state
      inputRefs.current[0]?.focus();
      
      Alert.alert('Success', 'OTP sent successfully');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#222" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Animated.View style={[styles.titleContainer, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={48} color="#1877f2" />
            </View>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to{'\n'}
              <Text style={styles.phoneNumber}>{phoneNumber}</Text>
              {'\n\n'}
              <Text style={styles.testOtpText}>
                💡 For testing: Use 123456 or any 6-digit code starting with '1'
              </Text>
            </Text>
          </Animated.View>

          <Animated.View style={[styles.otpContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </Animated.View>

          <Animated.View style={[styles.resendContainer, { opacity: fadeAnim }]}>
            {canResend ? (
              <TouchableOpacity onPress={handleResendOTP} style={styles.resendButton}>
                <Ionicons name="refresh" size={16} color="#1877f2" style={{ marginRight: 8 }} />
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.timerContainer}>
                <Ionicons name="time" size={16} color="#999" style={{ marginRight: 8 }} />
                <Text style={styles.timerText}>
                  Resend OTP in {timer}s
                </Text>
              </View>
            )}
          </Animated.View>

          <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Button
              title={otpVerified ? "Verifying..." : "Verify & Continue"}
              onPress={handleVerifyOTP}
              loading={isLoading}
              fullWidth
              disabled={otp.join('').length !== 6 || otpVerified}
            />
          </Animated.View>
        </Animated.View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneNumber: {
    color: '#1877f2',
    fontWeight: '600',
  },
  testOtpText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otpInputFilled: {
    borderColor: '#1877f2',
    backgroundColor: 'rgba(24, 119, 242, 0.05)',
    shadowColor: '#1877f2',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
    borderRadius: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 16,
    color: '#1877f2',
    fontWeight: '600',
  },
  timerText: {
    fontSize: 16,
    color: '#999',
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: 20,
  },
});
