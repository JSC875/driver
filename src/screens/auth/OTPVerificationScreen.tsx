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

const { width, height } = Dimensions.get('window');

export default function OTPVerificationScreen({ navigation, route }: any) {
  const { phoneNumber, isSignIn } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  
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
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter complete OTP');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignIn && signIn) {
        const completeSignIn = await signIn.attemptFirstFactor({
          strategy: 'phone_code',
          code: otpString,
        });

        if (completeSignIn?.status === 'complete') {
          await setSignInActive({ session: completeSignIn.createdSessionId });
        }
      } else if (signUp) {
        const completeSignUp = await signUp.attemptPhoneNumberVerification({
          code: otpString,
        });

        if (completeSignUp?.status === 'complete') {
          await setSignUpActive({ session: completeSignUp.createdSessionId });
          navigation.navigate('ProfileSetup');
        }
      }
    } catch (err: any) {
      console.error('Error:', err);
      Alert.alert('Error', err.errors?.[0]?.message || 'Invalid OTP. Please try again.');
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
              title="Verify & Continue"
              onPress={handleVerifyOTP}
              loading={isLoading}
              fullWidth
              disabled={otp.join('').length !== 6}
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
