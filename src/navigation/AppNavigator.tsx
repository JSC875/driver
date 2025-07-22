import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '../store/useAuthStore';

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import DocumentUploadScreen from '../screens/auth/DocumentUploadScreen';

// Home Screens
import HomeScreen from '../screens/home/HomeScreen';
import LocationSearchScreen from '../screens/home/LocationSearchScreen';
import RideEstimateScreen from '../screens/home/RideEstimateScreen';
import ConfirmRideScreen from '../screens/home/ConfirmRideScreen';
import ScheduleRideScreen from '../screens/home/ScheduleRideScreen';
import OffersScreen from '../screens/home/OffersScreen';

// Ride Screens
import FindingDriverScreen from '../screens/ride/FindingDriverScreen';
import LiveTrackingScreen from '../screens/ride/LiveTrackingScreen';
import ChatScreen from '../screens/ride/ChatScreen';
import RideSummaryScreen from '../screens/ride/RideSummaryScreen';
import EndRideScreen from '../screens/ride/EndRideScreen';
import NavigationScreen from '../screens/ride/NavigationScreen';
import OtpScreen from '../screens/ride/OtpScreen';
import RideInProgressScreen from '../screens/ride/RideInProgressScreen';

// Profile Screens
import ProfileScreen from '../screens/profile/ProfileScreen';
import RideHistoryScreen from '../screens/profile/RideHistoryScreen';
import WalletScreen from '../screens/profile/WalletScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import PersonalDetailsScreen from '../screens/profile/PersonalDetailsScreen';
import AboutScreen from '../screens/profile/AboutScreen';
import PrivacySecurityScreen from '../screens/profile/PrivacySecurityScreen';
import ReferScreen from '../screens/profile/ReferScreen';

// Support Screens
import HelpSupportScreen from '../screens/support/HelpSupportScreen';
import RideIssuesScreen from '../screens/support/RideIssuesScreen';
import AccidentReportScreen from '../screens/support/AccidentReportScreen';
import AccidentDetailsScreen from '../screens/support/AccidentDetailsScreen';
import PersonalInfoUpdateScreen from '../screens/support/PersonalInfoUpdateScreen';
import CancellationFeeScreen from '../screens/support/CancellationFeeScreen';
import DriverUnprofessionalScreen from '../screens/support/DriverUnprofessionalScreen';
import VehicleUnexpectedScreen from '../screens/support/VehicleUnexpectedScreen';
import LostItemScreen from '../screens/support/LostItemScreen';
import AccountIssuesScreen from '../screens/support/AccountIssuesScreen';
import PaymentsIssuesScreen from '../screens/support/PaymentsIssuesScreen';
import OtherIssuesScreen from '../screens/support/OtherIssuesScreen';
import TermsConditionScreen from '../screens/support/TermsConditionScreen';

import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <Stack.Navigator
      id={undefined}
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
    </Stack.Navigator>
  );
}

function MainNavigator() {
  return (
    <Stack.Navigator
      id={undefined}
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="RideEstimate" component={RideEstimateScreen} />
      <Stack.Screen name="ConfirmRide" component={ConfirmRideScreen} />
      <Stack.Screen name="ScheduleRide" component={ScheduleRideScreen} />
      <Stack.Screen name="Offers" component={OffersScreen} />
      {/* Support Flow */}
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="RideIssues" component={RideIssuesScreen} />
      <Stack.Screen name="AccidentReport" component={AccidentReportScreen} />
      <Stack.Screen name="AccidentDetails" component={AccidentDetailsScreen} />
      <Stack.Screen name="PersonalInfoUpdate" component={PersonalInfoUpdateScreen} />
      <Stack.Screen name="CancellationFee" component={CancellationFeeScreen} />
      <Stack.Screen name="DriverUnprofessional" component={DriverUnprofessionalScreen} />
      <Stack.Screen name="VehicleUnexpected" component={VehicleUnexpectedScreen} />
      <Stack.Screen name="LostItem" component={LostItemScreen} />
      <Stack.Screen name="AccountIssues" component={AccountIssuesScreen} />
      <Stack.Screen name="PaymentsIssues" component={PaymentsIssuesScreen} />
      <Stack.Screen name="OtherIssues" component={OtherIssuesScreen} />
      <Stack.Screen name="TermsCondition" component={TermsConditionScreen} />
      {/* Ride Flow */}
      <Stack.Screen name="FindingDriver" component={FindingDriverScreen} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="RideSummary" component={RideSummaryScreen} />
      <Stack.Screen name="EndRide" component={EndRideScreen} />
      <Stack.Screen name="NavigationScreen" component={NavigationScreen} />
      <Stack.Screen name="OtpScreen" component={OtpScreen} />
      <Stack.Screen name="RideInProgressScreen" component={RideInProgressScreen} />
      
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="RideHistory" component={RideHistoryScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <Stack.Screen name="Refer" component={ReferScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isSignedIn, isLoaded } = useAuth();
  const { isTestAuthenticated } = useAuthStore();

  // Show loading screen while checking auth state
  if (!isLoaded) {
    return null; // or a loading screen component
  }

  // Use test authentication for development/testing
  const shouldShowMainApp = isSignedIn || isTestAuthenticated;

  return (
    <NavigationContainer>
      {shouldShowMainApp ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
