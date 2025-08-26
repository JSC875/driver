import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { downloadReceipt, generateReceiptData } from '../../utils/receiptGenerator';

export default function ReceiptDownloadTest() {
  const handleTestDownload = async () => {
    try {
      // Create sample receipt data
      const receiptData = generateReceiptData(
        {
          rideId: 'TEST_RIDE_123',
          pickupAddress: '123 Main Street, City',
          dropoffAddress: '456 Oak Avenue, City',
          distance: '5.2 km',
          duration: '18 min',
          price: '150',
          paymentMethod: 'Cash',
        },
        {
          name: 'John Driver',
          vehicleModel: 'Honda Activa',
          vehicleNumber: 'MH12AB1234',
        }
      );

      const success = await downloadReceipt(receiptData);
      
      if (success) {
        Alert.alert(
          'Success',
          'Test receipt downloaded successfully! Check your downloads folder.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to download test receipt. Please check your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error in test download:', error);
      Alert.alert(
        'Error',
        'An error occurred during test download. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Receipt Download Test</Text>
      <Text style={styles.description}>
        Test the receipt download functionality with sample data
      </Text>
      
      <TouchableOpacity style={styles.testButton} onPress={handleTestDownload}>
        <Ionicons name="download-outline" size={20} color={Colors.white} />
        <Text style={styles.testButtonText}>Download Test Receipt</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Layout.spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    margin: Layout.spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  description: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.lg,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.md,
  },
  testButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: Layout.spacing.sm,
  },
});
