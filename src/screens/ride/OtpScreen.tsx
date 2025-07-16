import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OtpScreenProps {
  route: any;
  navigation: any;
}

export default function OtpScreen({ route, navigation }: OtpScreenProps) {
  const { ride } = route.params;
  
  console.log('🔐 OtpScreen received ride data:', ride);
  console.log('🔐 rideId:', ride?.rideId);
  console.log('🔐 driverId:', ride?.driverId);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const anim = React.useRef(new Animated.Value(0)).current;
  const checkAnim = React.useRef(new Animated.Value(0)).current;
  const inputRefs = useRef<(TextInput | null)[]>([]);

  React.useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleChange = (val: string, idx: number) => {
    if (!/^[0-9]?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 3) {
      inputRefs.current[idx + 1]?.focus();
      setFocusedIndex(idx + 1);
    }
    if (!val && idx > 0) {
      setFocusedIndex(idx - 1);
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
      setFocusedIndex(idx - 1);
    }
  };

  const handleSubmit = () => {
    if (!otp.every(d => d)) {
      Alert.alert('Incomplete OTP', 'Please enter all 4 digits');
      return;
    }

    setSubmitted(true);
    Animated.sequence([
      Animated.timing(checkAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(600),
    ]).start(() => {
      // Get the entered OTP
      const enteredOtp = otp.join('');
      console.log('🔐 Driver entered OTP:', enteredOtp);
      
      // Send OTP to server for verification
      const socketManager = require('../../utils/socket').default;
      socketManager.sendOtp({
        rideId: ride.rideId,
        driverId: ride.driverId,
        otp: enteredOtp
      });
      
      console.log('🔐 Sent OTP to server for verification');
      
      // Navigate to ride in progress screen
      navigation.navigate('RideInProgressScreen', { ride });
      setSubmitted(false);
      checkAnim.setValue(0);
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={{
        width: 320,
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderRadius: 28,
        padding: 36,
        elevation: 24,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 15 },
        alignItems: 'center',
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }],
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 18, right: 18, zIndex: 10, backgroundColor: '#f6f6f6', borderRadius: 18, padding: 6 }}>
          <Ionicons name="close" size={26} color="#888" />
        </TouchableOpacity>
        <Text style={{ fontSize: 30, fontWeight: 'bold', marginBottom: 10, color: '#1877f2', letterSpacing: 1 }}>Enter OTP</Text>
        <Text style={{ fontSize: 17, marginBottom: 28, color: '#444', textAlign: 'center' }}>Enter the 4-digit code to start your ride</Text>
        <View style={{ flexDirection: 'row', marginBottom: 32, gap: 8 }}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(ref) => { inputRefs.current[idx] = ref; }}
              style={{
                width: 44,
                height: 54,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: focusedIndex === idx ? '#1877f2' : '#e0e0e0',
                backgroundColor: '#f7faff',
                fontSize: 28,
                color: '#222',
                textAlign: 'center',
                marginHorizontal: 2,
                shadowColor: focusedIndex === idx ? '#1877f2' : 'transparent',
                shadowOpacity: focusedIndex === idx ? 0.15 : 0,
                shadowRadius: 6,
                elevation: focusedIndex === idx ? 4 : 0,
              }}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onFocus={() => setFocusedIndex(idx)}
              onChangeText={val => handleChange(val, idx)}
              onKeyPress={e => handleKeyPress(e, idx)}
              returnKeyType="done"
              autoFocus={idx === 0}
            />
          ))}
        </View>
        <TouchableOpacity
          style={{ backgroundColor: otp.every(d => d) ? '#1877f2' : '#b0b0b0', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 8 }}
          onPress={handleSubmit}
          disabled={!otp.every(d => d)}
          activeOpacity={otp.every(d => d) ? 0.8 : 1}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, letterSpacing: 1 }}>Submit OTP</Text>
        </TouchableOpacity>
        {submitted && (
          <Animated.View style={{ marginTop: 18, opacity: checkAnim, transform: [{ scale: checkAnim }] }}>
            <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
          </Animated.View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
} 