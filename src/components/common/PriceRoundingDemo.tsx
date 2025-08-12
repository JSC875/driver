import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatRidePrice, getRidePrice } from '../../utils/priceUtils';

/**
 * Demo component to showcase price rounding functionality
 * This shows how prices are rounded for easier payment between drivers and users
 */
export default function PriceRoundingDemo() {
  // Example prices that would normally have many decimal places
  const examplePrices = [
    67.3436285,
    45.7891234,
    123.4567890,
    89.9999999,
    156.1234567
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Price Rounding Demo</Text>
      <Text style={styles.subtitle}>
        Prices are rounded to whole numbers for easier payment
      </Text>
      
      {examplePrices.map((price, index) => (
        <View key={index} style={styles.priceRow}>
          <Text style={styles.originalPrice}>
            Original: ₹{price.toFixed(7)}
          </Text>
          <Text style={styles.roundedPrice}>
            Rounded: {formatRidePrice(price)}
          </Text>
          <Text style={styles.difference}>
            Difference: ₹{(getRidePrice(price) - price).toFixed(2)}
          </Text>
        </View>
      ))}
      
      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Benefits:</Text>
        <Text style={styles.benefit}>• Easier cash payments</Text>
        <Text style={styles.benefit}>• No decimal confusion</Text>
        <Text style={styles.benefit}>• Faster transactions</Text>
        <Text style={styles.benefit}>• Better user experience</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1877f2',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  priceRow: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  originalPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  roundedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00C853',
    marginBottom: 4,
  },
  difference: {
    fontSize: 12,
    color: '#FF9500',
    fontStyle: 'italic',
  },
  benefitsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1877f2',
    marginBottom: 8,
  },
  benefit: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
});
