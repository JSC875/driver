import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Modal, 
  FlatList, 
  TextInput, 
  Image, 
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSignUp, useUser } from '@clerk/clerk-expo';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuthStore } from '../../store/useAuthStore';

const { width, height } = Dimensions.get('window');

// Types
interface NameStepProps {
  firstName: string;
  lastName: string;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  onNext: () => void;
}

interface PhoneStepProps {
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  countryCode: string;
  setCountryCode: (v: string) => void;
  countryModalVisible: boolean;
  setCountryModalVisible: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

interface OtpStepProps {
  otp: string[];
  setOtp: (v: string[]) => void;
  onVerify: () => void;
  onBack: () => void;
  isLoading: boolean;
  error: string;
  resendOtp: () => void;
  canResend: boolean;
  timer: number;
  otpVerified: boolean;
}

interface PhotoStepProps {
  profileImage: string | null;
  setProfileImage: (v: string | null) => void;
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
  isLoading: boolean;
}

interface CountryItem {
  code: string;
  name: string;
}

// Step 1: Name Entry
function NameStep({ firstName, lastName, setFirstName, setLastName, onNext }: NameStepProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '25%' }]} />
        </View>
        <Text style={styles.progress}>Step 1 of 4</Text>
      </View>
      
      <View style={styles.headerContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="person" size={48} color="#1877f2" />
        </View>
        <Text style={styles.stepTitle}>What's your name?</Text>
        <Text style={styles.stepSubtitle}>Let's get to know you better</Text>
      </View>

      <View style={styles.inputContainer}>
        <Input
          label="First Name"
          placeholder="Enter your first name"
          value={firstName}
          onChangeText={setFirstName}
          leftIcon="person"
        />
        <Input
          label="Last Name"
          placeholder="Enter your last name"
          value={lastName}
          onChangeText={setLastName}
          leftIcon="person"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Next"
          onPress={onNext}
          fullWidth
          disabled={!firstName.trim()}
        />
      </View>
    </Animated.View>
  );
}

// Step 2: Phone Number Entry
function PhoneStep({ 
  phoneNumber, 
  setPhoneNumber, 
  countryCode, 
  setCountryCode, 
  countryModalVisible, 
  setCountryModalVisible, 
  onNext, 
  onBack, 
  isLoading 
}: PhoneStepProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const countryList: CountryItem[] = [
    { code: '+91', name: 'India' },
    { code: '+1', name: 'USA' },
    { code: '+44', name: 'UK' },
    { code: '+86', name: 'China' },
    { code: '+49', name: 'Germany' },
    { code: '+33', name: 'France' },
    { code: '+81', name: 'Japan' },
    { code: '+82', name: 'South Korea' },
    { code: '+61', name: 'Australia' },
    { code: '+55', name: 'Brazil' },
  ];

  return (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '50%' }]} />
        </View>
        <Text style={styles.progress}>Step 2 of 4</Text>
      </View>
      
      <View style={styles.headerContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="phone-portrait" size={48} color="#1877f2" />
        </View>
        <Text style={styles.stepTitle}>What's your mobile number?</Text>
        <Text style={styles.stepSubtitle}>We'll send you a verification code</Text>
      </View>

      <View style={styles.inputContainer}>
        <Input
          label="Mobile Number"
          placeholder="Enter your 10-digit mobile number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          maxLength={10}
          leftElement={
            <TouchableOpacity
              onPress={() => setCountryModalVisible(true)}
              style={styles.countryCodeButton}
            >
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <Ionicons name="chevron-down" size={18} color="#666" />
            </TouchableOpacity>
          }
        />
      </View>
      
      {/* Country Code Modal */}
      <Modal
        visible={countryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setCountryModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#222" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryList}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    setCountryCode(item.code);
                    setCountryModalVisible(false);
                  }}
                >
                  <Text style={styles.countryItemText}>
                    {item.name} ({item.code})
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Send OTP"
          onPress={onNext}
          fullWidth
          loading={isLoading}
          disabled={phoneNumber.length !== 10}
        />
        <Button
          title="Back"
          onPress={onBack}
          fullWidth
          variant="secondary"
          style={{ marginTop: 12 }}
        />
      </View>
    </Animated.View>
  );
}

// Step 3: OTP Entry
function OtpStep({ 
  otp, 
  setOtp, 
  onVerify, 
  onBack, 
  isLoading, 
  error, 
  resendOtp, 
  canResend, 
  timer,
  otpVerified
}: OtpStepProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow single digit
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (nativeEvent: any, index: number) => {
    if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.progress}>Step 3 of 4</Text>
      <Text style={styles.stepTitle}>Enter 6-digit verification code</Text>
      <Text style={styles.otpSubtitle}>
        We've sent a verification code to your mobile number
      </Text>
      
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[styles.otpInput, digit && styles.otpInputFilled]}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent, index)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
            selectTextOnFocus
          />
        ))}
      </View>
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      
      <View style={styles.resendContainer}>
        {canResend ? (
          <TouchableOpacity onPress={resendOtp}>
            <Text style={styles.resendText}>Resend OTP</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
        )}
      </View>
      
      <Button
        title={otpVerified ? "Verifying..." : "Verify"}
        onPress={onVerify}
        fullWidth
        loading={isLoading}
        disabled={otp.join('').length !== 6 || otpVerified}
        style={{ marginTop: 24 }}
      />
      <Button
        title="Back"
        onPress={onBack}
        fullWidth
        variant="secondary"
        style={{ marginTop: 12 }}
      />
    </View>
  );
}

// Step 4: Photo Upload
function PhotoStep({ 
  profileImage, 
  setProfileImage, 
  onComplete, 
  onSkip, 
  onBack, 
  isLoading 
}: PhotoStepProps) {
  const handleImagePicker = async () => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to add your photo',
      [
        { 
          text: 'Camera', 
          onPress: async () => {
            try {
              const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
              if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Camera permission is required to take a photo.');
                return;
              }
              
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              
              if (!result.canceled && result.assets[0]) {
                setProfileImage(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Error taking photo:', error);
              Alert.alert('Error', 'Failed to take photo. Please try again.');
            }
          }
        },
        { 
          text: 'Gallery', 
          onPress: async () => {
            try {
              const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Gallery permission is required to select a photo.');
                return;
              }
              
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              
              if (!result.canceled && result.assets[0]) {
                setProfileImage(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Error selecting photo:', error);
              Alert.alert('Error', 'Failed to select photo. Please try again.');
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.progress}>Step 4 of 4</Text>
      <Text style={styles.stepTitle}>Upload your photo</Text>
      <Text style={styles.photoSubtitle}>
        Add a profile photo to help others recognize you
      </Text>
      
      <TouchableOpacity
        onPress={handleImagePicker}
        style={styles.profileImageContainer}
      >
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="camera" size={32} color={Colors.gray400} />
          </View>
        )}
        {profileImage && (
          <View style={styles.imageSelectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
          </View>
        )}
      </TouchableOpacity>
      
      <Text style={styles.imageHint}>
        {profileImage ? 'Photo selected! Tap to change' : 'Tap to upload'}
      </Text>
      
      <Button
        title="Complete"
        onPress={onComplete}
        fullWidth
        loading={isLoading}
        style={{ marginTop: 24 }}
      />
      <Button
        title="I'll do it later"
        onPress={onSkip}
        fullWidth
        variant="secondary"
        style={{ marginTop: 12 }}
      />
      <Button
        title="Back"
        onPress={onBack}
        fullWidth
        variant="ghost"
        style={{ marginTop: 12 }}
      />
    </View>
  );
}

// Main SignUp Screen Component
export default function SignUpScreen({ navigation }: { navigation: any }) {
  const [step, setStep] = useState<number>(1);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [countryModalVisible, setCountryModalVisible] = useState<boolean>(false);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>('');
  const [timer, setTimer] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [signUpCreated, setSignUpCreated] = useState<boolean>(false);
  const [otpVerified, setOtpVerified] = useState<boolean>(false);
  const { signUp, isLoaded } = useSignUp();
  const { user } = useUser();
  const { setTestAuthenticated } = useAuthStore();

  // Timer for OTP resend
  useEffect(() => {
    if (step !== 3) return;
    
    setTimer(30);
    setCanResend(false);
    
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
  }, [step]);

  // Reset signUpCreated if phone number changes
  useEffect(() => {
    setSignUpCreated(false);
  }, [phoneNumber, countryCode]);

  // Step navigation
  const goToNextStep = () => setStep((s) => s + 1);
  const goToPrevStep = () => setStep((s) => s - 1);

  // Step 2: Send OTP
  const handleSendOTP = async () => {
    if (!isLoaded) return;
    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    setIsLoading(true);
    try {
      const formattedPhone = `${countryCode}${phoneNumber.replace(/^0+/, '')}`;
      console.log('Creating sign-up with phone number:', formattedPhone);
      
      if (!signUpCreated) {
        await signUp.create({ phoneNumber: formattedPhone });
        setSignUpCreated(true);
        console.log('Sign-up created successfully');
      }
      
      console.log('Preparing phone number verification');
      await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
      console.log('OTP sent successfully');
      goToNextStep();
    } catch (err: unknown) {
      console.error('Error sending OTP:', err);
      if (typeof err === 'object' && err && 'errors' in err) {
        // @ts-ignore
        Alert.alert('Error', err.errors?.[0]?.message || 'Failed to send OTP');
      } else {
        Alert.alert('Error', 'Failed to send OTP');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOTP = async () => {
    setIsLoading(true);
    try {
      const otpString = otp.join('');
      console.log('OTP verification attempt with:', otpString);
      console.log('signUp available:', !!signUp);
      console.log('signUp status:', signUp?.status);
      
      if (otpString.length !== 6) {
        setOtpError('Please enter complete OTP');
        setIsLoading(false);
        return;
      }
      
      console.log('Attempting OTP verification with code:', otpString);
      
      // For development/testing: Check if it's a test OTP (123456)
      if (otpString === '123456') {
        console.log('Test OTP detected, simulating successful verification');
        setOtpVerified(true);
        // Simulate successful verification for testing
        setTimeout(() => {
          console.log('Test OTP verification complete, proceeding to profile setup');
          goToNextStep();
        }, 1000);
        return;
      }

      // For development: Also accept any 6-digit code starting with '1' as valid
      if (otpString.length === 6 && otpString.startsWith('1')) {
        console.log('Development OTP detected, simulating successful verification');
        setOtpVerified(true);
        setTimeout(() => {
          console.log('Development OTP verification complete, proceeding to profile setup');
          goToNextStep();
        }, 1000);
        return;
      }
      
      const completeSignUp = await signUp?.attemptPhoneNumberVerification({ code: otpString });
      console.log('OTP verification result:', completeSignUp);
      
      if (completeSignUp?.status === 'complete') {
        console.log('OTP verification successful, navigating to next step');
        setOtpVerified(true);
        goToNextStep();
      } else if (completeSignUp?.status === 'missing_requirements') {
        console.log('OTP verified but missing requirements, updating user data');
        console.log('Available firstName:', firstName);
        console.log('Available lastName:', lastName);
        console.log('Missing fields:', completeSignUp?.missingFields);
        // OTP is verified but we need to provide the missing fields
        try {
          const updateData: any = {};
          if (firstName.trim()) updateData.firstName = firstName.trim();
          if (lastName.trim()) updateData.lastName = lastName.trim();
          console.log('Updating user with data:', updateData);
          await signUp?.update(updateData);
          console.log('User data updated successfully, navigating to next step');
          setOtpVerified(true);
          goToNextStep();
          return;
        } catch (updateErr: any) {
          console.error('Error updating user data:', updateErr);
          const updateErrorMessage = (updateErr && typeof updateErr === 'object' && 'errors' in updateErr && Array.isArray(updateErr.errors) && updateErr.errors[0]?.message)
            ? updateErr.errors[0].message
            : (updateErr && typeof updateErr === 'object' && 'message' in updateErr ? updateErr.message : 'Failed to update user profile');
          throw new Error(updateErrorMessage);
        }
      } else {
        console.log('OTP verification failed with status:', completeSignUp?.status);
        throw new Error('OTP verification failed');
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      const errorMessage = err?.errors?.[0]?.message || err?.message || 'Invalid OTP. Please try again.';
      setOtpError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Resend OTP
  const handleResendOTP = async () => {
    try {
      await signUp?.preparePhoneNumberVerification({ strategy: 'phone_code' });
      setTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setOtpVerified(false); // Reset verification state
      Alert.alert('Success', 'OTP sent successfully');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  // Step 4: Complete Profile
  const handleCompleteProfile = async () => {
    setIsLoading(true);
    try {
      // Check if this is a test OTP flow (user might not be properly signed in)
      if (otpVerified && !user) {
        console.log('Test OTP flow detected, bypassing Clerk user update');
        // For test OTP, we'll simulate successful profile completion
        Alert.alert('Success', 'Profile setup completed!', [
          { text: 'OK', onPress: () => {
            console.log('Test flow completed, setting test authentication');
            setTestAuthenticated(true);
          }}
        ]);
        return;
      }
      
      // Update user profile with Clerk and set userType to driver
      await user?.update({ 
        firstName: firstName.trim(), 
        lastName: lastName.trim(),
        unsafeMetadata: { ...user.unsafeMetadata, type: 'driver' }
      });
      
      // TODO: Handle profile image upload if needed
      // if (profileImage) {
      //   await user?.setProfileImage({ file: profileImage });
      // }
      
      console.log('Profile updated successfully, user should be redirected to main app');
      // The user is now signed in and will be automatically redirected to the main app
      // Clerk's useAuth hook will handle the navigation
    } catch (err: any) {
      console.error('Error updating profile:', err);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Skip profile
  const handleSkipProfile = async () => {
    // Check if this is a test OTP flow
    if (otpVerified && !user) {
      console.log('Test OTP flow detected, skipping profile setup');
      Alert.alert('Profile Setup', 'You can complete your profile later from the settings.', [
        { text: 'OK', onPress: () => {
          console.log('Test flow completed, setting test authentication');
          setTestAuthenticated(true);
        }}
      ]);
      return;
    }
    // Set userType in Clerk metadata if user is available
    if (user) {
      await user.update({
        unsafeMetadata: { ...user.unsafeMetadata, type: 'driver' }
      });
    }
    console.log('Profile setup skipped, user should be redirected to main app');
    // The user is now signed in and will be automatically redirected to the main app
    // Clerk's useAuth hook will handle the navigation
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            {step > 1 && (
              <TouchableOpacity onPress={goToPrevStep} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.text} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.content}>
            {step === 1 && (
              <NameStep
                firstName={firstName}
                lastName={lastName}
                setFirstName={setFirstName}
                setLastName={setLastName}
                onNext={goToNextStep}
              />
            )}
            
            {step === 2 && (
              <PhoneStep
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
                countryCode={countryCode}
                setCountryCode={setCountryCode}
                countryModalVisible={countryModalVisible}
                setCountryModalVisible={setCountryModalVisible}
                onNext={handleSendOTP}
                onBack={goToPrevStep}
                isLoading={isLoading}
              />
            )}
            
            {step === 3 && (
              <OtpStep
                otp={otp}
                setOtp={setOtp}
                onVerify={handleVerifyOTP}
                onBack={goToPrevStep}
                isLoading={isLoading}
                error={otpError}
                resendOtp={handleResendOTP}
                canResend={canResend}
                timer={timer}
                otpVerified={otpVerified}
              />
            )}
            
            {step === 4 && (
              <PhotoStep
                profileImage={profileImage}
                setProfileImage={setProfileImage}
                onComplete={handleCompleteProfile}
                onSkip={handleSkipProfile}
                onBack={goToPrevStep}
                isLoading={isLoading}
              />
            )}
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: Layout.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
  },
  stepContainer: {
    marginTop: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    height: 10,
    backgroundColor: Colors.gray200,
    borderRadius: 5,
    flex: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  progress: {
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    backgroundColor: Colors.gray100,
    padding: 16,
    borderRadius: 80,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  stepSubtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 24,
  },
  buttonContainer: {
    marginTop: 24,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  countryCodeText: {
    fontWeight: '600',
    fontSize: 16,
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '85%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  countryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  countryItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 8,
    marginHorizontal: 6,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: Colors.gray50,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  otpSubtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 14,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  resendText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  timerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  photoSubtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 14,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  imageHint: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 14,
  },
  imageSelectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});