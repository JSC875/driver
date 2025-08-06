import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import Button from './Button';
import { logJWTDetails, decodeJWT } from '../../utils/jwtDecoder';

export default function JWTLoggingTest() {
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();
  const { user } = useUser();

  const handleTestJWT = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 === DRIVER JWT CUSTOM FIELDS TEST ===');
      
      // Get current JWT
      const token = await getToken({ template: 'driver_app_token', skipCache: true });
      if (!token) {
        Alert.alert('Error', 'No JWT token available');
        return;
      }

      // Decode and check custom fields
      const decoded = decodeJWT(token);
      if (!decoded) {
        Alert.alert('Error', 'Failed to decode JWT');
        return;
      }

      // Check for custom fields
      const customFields = {
        firstName: decoded.firstName || 'Not found',
        lastName: decoded.lastName || 'Not found',
        userType: decoded.userType || 'Not found',
        phoneNumber: decoded.phoneNumber || 'Not found'
      };

      console.log('🎯 Custom Fields in JWT:');
      Object.entries(customFields).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });

      // Check user metadata
      console.log('👤 User Metadata:');
      console.log('  firstName:', user?.firstName);
      console.log('  lastName:', user?.lastName);
      console.log('  userType:', user?.unsafeMetadata?.type);
      console.log('  phoneNumber:', user?.primaryPhoneNumber?.phoneNumber);

      // Show results in alert
      const results = Object.entries(customFields)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

      Alert.alert(
        'Driver JWT Custom Fields Test',
        `Results:\n\n${results}\n\nCheck console for detailed logs.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('JWT Test Error:', error);
      Alert.alert('Error', 'Failed to test JWT custom fields');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceJWTRegeneration = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 === FORCING DRIVER JWT REGENERATION ===');
      
      // Force new JWT
      const newToken = await getToken({ template: 'driver_app_token', skipCache: true });
      if (newToken) {
        console.log('✅ New JWT generated successfully');
        await logJWTDetails(getToken, 'Forced Driver JWT Regeneration Test');
        Alert.alert('Success', 'Driver JWT regenerated successfully! Check console for details.');
      } else {
        Alert.alert('Error', 'Failed to regenerate JWT');
      }
    } catch (error) {
      console.error('JWT Regeneration Error:', error);
      Alert.alert('Error', 'Failed to regenerate JWT');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserMetadata = async () => {
    setIsLoading(true);
    try {
      console.log('📝 === UPDATING DRIVER USER METADATA ===');
      
      if (!user) {
        Alert.alert('Error', 'No user available');
        return;
      }

      // Update user metadata
      await user.update({
        unsafeMetadata: { ...user.unsafeMetadata, type: 'driver' }
      });

      console.log('✅ Driver user metadata updated');
      
      // Force new JWT
      const newToken = await getToken({ template: 'driver_app_token', skipCache: true });
      if (newToken) {
        console.log('✅ New JWT generated after metadata update');
        await logJWTDetails(getToken, 'Post-Metadata Update Driver JWT Test');
        Alert.alert('Success', 'Driver user metadata updated and JWT regenerated! Check console for details.');
      } else {
        Alert.alert('Error', 'Failed to generate new JWT after metadata update');
      }
    } catch (error) {
      console.error('Metadata Update Error:', error);
      Alert.alert('Error', 'Failed to update driver user metadata');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver JWT Custom Fields Test</Text>
      <Text style={styles.subtitle}>
        Test and debug JWT custom fields during driver signup
      </Text>
      
      <Button
        title="Test Driver JWT Custom Fields"
        onPress={handleTestJWT}
        loading={isLoading}
        fullWidth
        style={styles.button}
      />
      
      <Button
        title="Force Driver JWT Regeneration"
        onPress={handleForceJWTRegeneration}
        loading={isLoading}
        fullWidth
        variant="secondary"
        style={styles.button}
      />
      
      <Button
        title="Update Driver Metadata & Regenerate JWT"
        onPress={handleUpdateUserMetadata}
        loading={isLoading}
        fullWidth
        variant="secondary"
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginBottom: 12,
  },
}); 