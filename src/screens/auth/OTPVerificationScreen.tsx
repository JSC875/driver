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
  Animated, // <-- Add Animated import
  Easing,
  BackHandler, // Add BackHandler import
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSignIn, useSignUp, useUser, useAuth } from '@clerk/clerk-expo';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import Button from '../../components/common/Button';
import { logJWTDetails } from '../../utils/jwtDecoder';

export default function OTPVerificationScreen({ navigation, route }: any) {
  const { phoneNumber, isSignIn } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  const { user } = useUser();
  const { getToken } = useAuth();
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const scaleAnims = useRef(otp.map(() => new Animated.Value(1))).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [clipboardContent, setClipboardContent] = useState<string>('');

  // Animate scale when focused
  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    Animated.spring(scaleAnims[index], {
      toValue: 1.15,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };
  const handleBlur = (index: number) => {
    Animated.spring(scaleAnims[index], {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
    setFocusedIndex(null);
  };

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

  // Handle hardware back button - prevent going back
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Return true to prevent default back behavior
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Check clipboard content on component mount and when screen comes into focus
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const content = await Clipboard.getString();
        setClipboardContent(content);
      } catch (error) {
        console.log('Error reading clipboard:', error);
      }
    };

    checkClipboard();
  }, []);

  // Function to handle paste operation
  const handlePaste = async () => {
    try {
      const content = await Clipboard.getString();
      console.log('Clipboard content:', content);
      
      // Extract OTP from clipboard content (look for 6-digit number)
      const otpMatch = content.match(/\b\d{6}\b/);
      if (otpMatch) {
        const otpString = otpMatch[0];
        console.log('Extracted OTP:', otpString);
        
        // Split OTP into individual digits
        const otpArray = otpString.split('').slice(0, 6);
        const newOtp = [...otp];
        
        // Fill the OTP array
        for (let i = 0; i < otpArray.length; i++) {
          if (i < 6) {
            newOtp[i] = otpArray[i];
          }
        }
        
        setOtp(newOtp);
        
        // Focus the last filled input
        const lastFilledIndex = Math.min(otpArray.length - 1, 5);
        inputRefs.current[lastFilledIndex]?.focus();
        
        // Animate all filled inputs
        otpArray.forEach((_, idx) => {
          if (idx < 6) {
            Animated.sequence([
              Animated.spring(scaleAnims[idx], {
                toValue: 1.25,
                useNativeDriver: true,
                friction: 2,
              }),
              Animated.spring(scaleAnims[idx], {
                toValue: 1.15,
                useNativeDriver: true,
                friction: 4,
              }),
            ]).start();
          }
        });
        
        // Show success feedback
        Alert.alert('Success', 'OTP pasted successfully!');
      } else {
        Alert.alert('No OTP Found', 'No 6-digit OTP found in clipboard. Please copy the OTP and try again.');
      }
    } catch (error) {
      console.error('Error pasting OTP:', error);
      Alert.alert('Error', 'Failed to paste OTP. Please try again.');
    }
  };


  // Animate bounce on digit entry
  const handleOtpChange = (value: string, index: number) => {
    // Handle auto-fill or paste of complete OTP
    if (value.length > 1) {
      // If multiple characters are entered (auto-fill or paste), split them
      const otpArray = value.split('').slice(0, 6);
      const newOtp = [...otp];
      
      for (let i = 0; i < otpArray.length; i++) {
        if (i < 6) {
          newOtp[i] = otpArray[i];
        }
      }
      
      setOtp(newOtp);
      
      // Focus the last filled input or the next empty one
      const lastFilledIndex = Math.min(otpArray.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
      
      // Animate all filled inputs
      otpArray.forEach((_, idx) => {
        if (idx < 6) {
          Animated.sequence([
            Animated.spring(scaleAnims[idx], {
              toValue: 1.25,
              useNativeDriver: true,
              friction: 2,
            }),
            Animated.spring(scaleAnims[idx], {
              toValue: 1.15,
              useNativeDriver: true,
              friction: 4,
            }),
          ]).start();
        }
      });
      
      // Show success feedback for paste operation
      if (Platform.OS === 'android') {
        Alert.alert('Success', 'OTP pasted successfully!');
      }
      
      return;
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value) {
      Animated.sequence([
        Animated.spring(scaleAnims[index], {
          toValue: 1.25,
          useNativeDriver: true,
          friction: 2,
        }),
        Animated.spring(scaleAnims[index], {
          toValue: 1.15,
          useNativeDriver: true,
          friction: 4,
        }),
      ]).start();
    }
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

  // Animate shake if OTP is incorrect
  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    console.log('OTPVerificationScreen - Verifying OTP:', otpString);
    console.log('OTPVerificationScreen - Is Sign In:', isSignIn);
    console.log('OTPVerificationScreen - Phone Number:', phoneNumber);
    
    if (otpString.length !== 6) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 6,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -6,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
      Alert.alert('Error', 'Please enter complete OTP');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignIn) {
        // Sign in flow
        console.log('OTPVerificationScreen - Attempting sign in with OTP...');
        console.log('OTPVerificationScreen - SignIn object:', signIn);
        
        if (!signIn) {
          console.error('OTPVerificationScreen - SignIn object is null');
          Alert.alert('Error', 'Authentication service not available. Please try again.');
          return;
        }
        
        const completeSignIn = await signIn.attemptFirstFactor({
          strategy: 'phone_code',
          code: otpString,
        });

        console.log('OTPVerificationScreen - Sign in result:', completeSignIn);

        if (completeSignIn?.status === 'complete') {
          console.log('OTPVerificationScreen - Sign in successful, setting active session...');
          console.log('OTPVerificationScreen - Created session ID:', completeSignIn.createdSessionId);
          
          // Set userType in Clerk metadata for sign-in
          if (user) {
            try {
              await user.update({
                unsafeMetadata: { ...user.unsafeMetadata, type: 'driver' }
              });
              console.log('OTPVerificationScreen - User type set to driver (sign-in)');
              
              // Force new JWT with updated userType
              if (typeof getToken === 'function') {
                const newToken = await getToken({ template: 'driver_app_token', skipCache: true });
                console.log('OTPVerificationScreen - New JWT with userType (sign-in):', newToken ? 'Generated' : 'Failed');
                
                // Log the JWT details to verify custom fields
                if (newToken) {
                  await logJWTDetails(getToken, 'OTP Sign-In JWT Analysis');
                }
              }
            } catch (metadataErr) {
              console.error('OTPVerificationScreen - Error setting user type (sign-in):', metadataErr);
            }
          }
          
          if (setSignInActive) {
            await setSignInActive({ session: completeSignIn.createdSessionId });
            console.log('OTPVerificationScreen - Session activated successfully');
          } else {
            console.error('OTPVerificationScreen - setSignInActive is not available');
          }
          // Don't navigate manually - the auth state change will handle it
        } else {
          console.log('OTPVerificationScreen - Sign in failed, status:', completeSignIn?.status);
          console.log('OTPVerificationScreen - Complete signin object:', completeSignIn);
        }
      } else {
        // Sign up flow
        console.log('OTPVerificationScreen - Attempting sign up with OTP...');
        console.log('OTPVerificationScreen - SignUp object:', signUp);
        
        if (!signUp) {
          console.error('OTPVerificationScreen - SignUp object is null');
          Alert.alert('Error', 'Authentication service not available. Please try again.');
          return;
        }
        
        const completeSignUp = await signUp.attemptPhoneNumberVerification({
          code: otpString,
        });

        console.log('OTPVerificationScreen - Sign up result:', completeSignUp);
        console.log('OTPVerificationScreen - Phone verification status:', completeSignUp?.verifications?.phoneNumber?.status);

        // Check if phone number is verified
        const isPhoneVerified = completeSignUp?.verifications?.phoneNumber?.status === 'verified';
        console.log('OTPVerificationScreen - Is phone verified:', isPhoneVerified);

        if (isPhoneVerified) {
          console.log('OTPVerificationScreen - Phone verification successful!');
          console.log('OTPVerificationScreen - Missing fields:', completeSignUp?.missingFields);
          
          // Set userType in Clerk metadata immediately after phone verification
          if (user) {
            try {
              await user.update({
                unsafeMetadata: { ...user.unsafeMetadata, type: 'driver' }
              });
              console.log('OTPVerificationScreen - User type set to driver');
              
              // Force new JWT with updated userType
              if (typeof getToken === 'function') {
                const newToken = await getToken({ template: 'driver_app_token', skipCache: true });
                console.log('OTPVerificationScreen - New JWT with userType:', newToken ? 'Generated' : 'Failed');
                
                // Log the JWT details to verify custom fields
                if (newToken) {
                  await logJWTDetails(getToken, 'OTP Verification JWT Analysis');
                }
              }
            } catch (metadataErr) {
              console.error('OTPVerificationScreen - Error setting user type:', metadataErr);
            }
          }
          
          if (setSignUpActive && completeSignUp.createdSessionId) {
            await setSignUpActive({ session: completeSignUp.createdSessionId });
            console.log('OTPVerificationScreen - Session activated successfully');
          } else {
            console.error('OTPVerificationScreen - setSignUpActive is not available or no session ID');
          }
          // Navigate to profile setup for new users
          navigation.navigate('ProfileSetup');
        } else {
          console.log('OTPVerificationScreen - Phone verification failed');
          console.log('OTPVerificationScreen - Complete signup object:', completeSignUp);
        }
      }
    } catch (err: any) {
      console.error('OTPVerificationScreen - OTP Verification Error:', err);
      console.error('OTPVerificationScreen - Error details:', err.errors);
      console.error('OTPVerificationScreen - Error message:', err.message);
      console.error('OTPVerificationScreen - Error code:', err.code);
      
      let errorMessage = 'Invalid OTP. Please try again.';
      if (err?.errors?.[0]?.message) {
        errorMessage = err.errors[0].message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      if (isSignIn) {
        // For sign in, we need to get the phone number factor again
        if (signIn) {
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
        }
      } else {
        if (signUp) {
          await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
        }
      }
      
      setTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      Alert.alert('Success', 'OTP sent successfully');
    } catch (err: any) {
      console.error('OTPVerificationScreen - Error resending OTP:', err);
      
      let errorMessage = 'Failed to resend OTP. Please try again.';
      if (err?.errors?.[0]?.message) {
        errorMessage = err.errors[0].message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      // Handle specific rate limiting error
      if (errorMessage.includes('Too many verification code requests')) {
        Alert.alert(
          'Rate Limit Exceeded', 
          'You have requested too many OTP codes. Please wait a few minutes before trying again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          {/* Remove back button to prevent going back after OTP entry */}
        </View>

        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to{'\n'}
              <Text style={styles.phoneNumber}>{phoneNumber}</Text>
            </Text>
            <Text style={styles.infoText}>
              Please complete the verification to continue
            </Text>
          </View>

          <View style={styles.otpContainer}>
            <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: shakeAnim }] }}>
              {otp.map((digit, index) => (
                <Animated.View key={index} style={{ transform: [{ scale: scaleAnims[index] }], marginHorizontal: 4 }}>
                  <TextInput
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled,
                      focusedIndex === index && styles.otpInputFocused,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) =>
                      handleKeyPress(nativeEvent.key, index)
                    }
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    onFocus={() => handleFocus(index)}
                    onBlur={() => handleBlur(index)}
                    autoComplete="sms-otp"
                    textContentType="oneTimeCode"
                    autoFocus={index === 0}
                    contextMenuHidden={Platform.OS === 'android' ? false : true}
                  />
                </Animated.View>
              ))}
            </Animated.View>
            
            {/* Paste Button for Android */}
            {Platform.OS === 'android' && (
              <View style={styles.copyPasteContainer}>
                <TouchableOpacity
                  style={[styles.copyPasteButton, styles.pasteButton]}
                  onPress={handlePaste}
                  activeOpacity={0.7}
                >
                  <Ionicons name="clipboard-outline" size={20} color="#fff" />
                  <Text style={styles.copyPasteButtonText}>Paste OTP</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResendOTP}>
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                Resend OTP in {timer}s
              </Text>
            )}
          </View>

          <Button
            title="Verify & Continue"
            onPress={handleVerifyOTP}
            loading={isLoading}
            fullWidth
            disabled={otp.join('').length !== 6}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
  },
  backButton: {
    padding: Layout.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneNumber: {
    fontWeight: '600',
    color: Colors.text,
  },
  infoText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Layout.spacing.sm,
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  copyPasteContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Layout.spacing.md,
  },
  copyPasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pasteButton: {
    backgroundColor: Colors.primary,
  },
  copyPasteButtonText: {
    color: '#fff',
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    marginLeft: Layout.spacing.xs,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    backgroundColor: Colors.gray50,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  otpInputFocused: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  resendText: {
    fontSize: Layout.fontSize.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  timerText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
  },
});
