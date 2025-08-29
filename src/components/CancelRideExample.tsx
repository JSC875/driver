import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CancelRideButton from './CancelRideButton';

// Example component showing how to use CancelRideButton
export default function CancelRideExample() {
  const exampleRide = {
    rideId: 'ride-123',
    driverId: 'driver-456',
    pickupAddress: '123 Main St, City',
    dropoffAddress: '456 Oak Ave, City',
    price: '$15.00',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cancel Ride Button Examples</Text>
      
      {/* Example 1: Standard Cancel Button */}
      <View style={styles.example}>
        <Text style={styles.exampleTitle}>Standard Cancel Button</Text>
        <CancelRideButton
          rideId={exampleRide.rideId}
          driverId={exampleRide.driverId}
          rideDetails={{
            pickupAddress: exampleRide.pickupAddress,
            dropoffAddress: exampleRide.dropoffAddress,
            price: exampleRide.price,
          }}
          onSuccess={() => console.log('Ride cancelled successfully')}
        />
      </View>

      {/* Example 2: Disabled Cancel Button */}
      <View style={styles.example}>
        <Text style={styles.exampleTitle}>Disabled Cancel Button (Ride Started)</Text>
        <CancelRideButton
          rideId={exampleRide.rideId}
          driverId={exampleRide.driverId}
          disabled={true}
          onSuccess={() => console.log('Ride cancelled successfully')}
        />
      </View>

      {/* Example 3: Custom Styled Cancel Button */}
      <View style={styles.example}>
        <Text style={styles.exampleTitle}>Custom Styled Cancel Button</Text>
        <CancelRideButton
          rideId={exampleRide.rideId}
          driverId={exampleRide.driverId}
          style={{
            backgroundColor: '#dc3545',
            borderRadius: 25,
            paddingVertical: 15,
            paddingHorizontal: 30,
            shadowColor: '#dc3545',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
          onSuccess={() => console.log('Ride cancelled successfully')}
        />
      </View>

      {/* Example 4: Icon Only Cancel Button */}
      <View style={styles.example}>
        <Text style={styles.exampleTitle}>Icon Only Cancel Button</Text>
        <CancelRideButton
          rideId={exampleRide.rideId}
          driverId={exampleRide.driverId}
          style={{
            backgroundColor: '#f8f9fa',
            borderRadius: 20,
            width: 40,
            height: 40,
            padding: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          showIcon={true}
          onSuccess={() => console.log('Ride cancelled successfully')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  example: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
});
