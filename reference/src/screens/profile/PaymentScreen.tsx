import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { mockPaymentMethods } from '../../data/mockData';

const paymentOptions = [
  {
    id: 'card',
    label: 'VISA',
    icon: <FontAwesome5 name="cc-visa" size={28} color="#1a1f71" />,
    details: '•••• 52 2457',
    expiry: 'Expiry 04 July 2023',
  },
  {
    id: 'paypal',
    label: 'Paypal',
    icon: <FontAwesome5 name="paypal" size={28} color="#003087" />,
    details: '',
    expiry: '',
  },
  {
    id: 'cash',
    label: 'Cash',
    icon: <Ionicons name="cash-outline" size={28} color="#16a34a" />,
    details: '',
    expiry: '',
  },
];

export default function PaymentScreen({ navigation }: any) {
  const [coupon, setCoupon] = useState('');
  const [selected, setSelected] = useState('card');
  const price = 52;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Back button and illustration */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Coupon section */}
        <TouchableOpacity style={styles.applyCouponRow} activeOpacity={0.8}>
          <Text style={styles.applyCouponText}>Apply Coupon</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </TouchableOpacity>
        <View style={styles.couponInputRow}>
          <TextInput
            style={styles.couponInput}
            placeholder="Enter Coupon code"
            value={coupon}
            onChangeText={setCoupon}
            placeholderTextColor={Colors.gray400}
          />
          <TouchableOpacity style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Add new card */}
        <View style={styles.addCardRow}>
          <Text style={styles.addCardText}>Add New Card</Text>
          <TouchableOpacity>
            <Ionicons name="add" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Payment methods */}
        {paymentOptions.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[styles.paymentCard, selected === option.id && styles.paymentCardSelected]}
            onPress={() => setSelected(option.id)}
            activeOpacity={0.85}
          >
            <View style={styles.paymentIcon}>{option.icon}</View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentLabel}>{option.label}</Text>
              {!!option.details && <Text style={styles.paymentDetails}>{option.details}</Text>}
              {!!option.expiry && <Text style={styles.paymentExpiry}>{option.expiry}</Text>}
            </View>
            {selected === option.id && (
              <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Price and Book Ride button */}
      <View style={styles.bottomBar}>
        <View style={styles.priceBox}>
          <Text style={styles.priceText}>${price}</Text>
          <Text style={styles.priceLabel}>Price</Text>
        </View>
        <TouchableOpacity style={styles.bookBtn}>
          <Text style={styles.bookBtnText}>pay payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginLeft: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  applyCouponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    justifyContent: 'space-between',
  },
  applyCouponText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    marginRight: 8,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  addCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  addCardText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  paymentCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#ecebff',
  },
  paymentIcon: {
    marginRight: 16,
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentDetails: {
    fontSize: 14,
    color: Colors.gray500,
    marginTop: 2,
  },
  paymentExpiry: {
    fontSize: 12,
    color: Colors.gray400,
    marginTop: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 8,
  },
  priceBox: {
    marginRight: 18,
    alignItems: 'center',
  },
  priceText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  priceLabel: {
    fontSize: 13,
    color: Colors.gray500,
    marginTop: -2,
  },
  bookBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
}); 