import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

export default function RateDriverScreen({ navigation, route }: any) {
  const { driver } = route.params || {};
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState('');

  const driverInfo = driver || {
    name: 'Alex Robin',
    vehicleModel: 'Volkswagen',
    vehicleNumber: 'HG5045',
    photo: undefined,
  };

  const handleTip = (amount: number) => {
    setTip(amount);
    setCustomTip('');
  };

  const handleCustomTip = (value: string) => {
    setCustomTip(value);
    setTip(0);
  };

  const handleSubmit = () => {
    // Submit review logic here
    navigation.navigate('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Rate Your Driver</Text>
        <View style={styles.driverInfo}>
          <Image source={driverInfo.photo ? { uri: driverInfo.photo } : require('../../../assets/images/scoooter1.jpg')} style={styles.driverPhoto} />
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{driverInfo.name}</Text>
            <Text style={styles.vehicleInfo}>{driverInfo.vehicleModel} - {driverInfo.vehicleNumber}</Text>
          </View>
        </View>
        <Text style={styles.promptText}>How was your trip with {driverInfo.name}?</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={32}
                color={star <= rating ? Colors.accent : Colors.gray300}
              />
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.commentsInput}
          placeholder="Additional comments..."
          value={comments}
          onChangeText={setComments}
          multiline
          maxLength={300}
        />
        <Text style={styles.tipPrompt}>Add a tip to {driverInfo.name}</Text>
        <View style={styles.tipOptions}>
          {[10, 20, 30].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[styles.tipButton, tip === amount && styles.tipButtonSelected]}
              onPress={() => handleTip(amount)}
            >
              <Text style={[styles.tipText, tip === amount && styles.tipTextSelected]}>${amount}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={styles.customTipInput}
            placeholder="Add custom"
            value={customTip}
            onChangeText={handleCustomTip}
            keyboardType="numeric"
          />
        </View>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Review</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Layout.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Layout.spacing.lg,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  driverPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: Layout.spacing.md,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  vehicleInfo: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  promptText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.md,
  },
  starButton: {
    marginHorizontal: Layout.spacing.xs,
  },
  commentsInput: {
    backgroundColor: Colors.gray50,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.md,
    width: '100%',
    minHeight: 60,
  },
  tipPrompt: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    marginBottom: Layout.spacing.md,
    alignSelf: 'flex-start',
  },
  tipOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
    width: '100%',
  },
  tipButton: {
    backgroundColor: Colors.gray50,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 70,
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  tipButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tipText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  tipTextSelected: {
    color: Colors.white,
  },
  customTipInput: {
    backgroundColor: Colors.gray50,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    minWidth: 80,
    marginLeft: Layout.spacing.sm,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
  },
}); 