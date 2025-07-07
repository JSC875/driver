import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/Colors';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const GENDERS = ['Male', 'Female', 'Other'];

export default function DocumentDetailsScreen({ navigation }: any) {
  const { user } = useUser();
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || '');
  const [license, setLicense] = useState<string | null>(null);
  const [aadhaar, setAadhaar] = useState<string | null>(null);
  const [bikeFront, setBikeFront] = useState<string | null>(null);
  const [bikeBack, setBikeBack] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : '';
  const isUnderage = typeof age === 'number' && age < 18;
  const allDocsUploaded = license && aadhaar && bikeFront && bikeBack;
  const canComplete = dob && gender && email && allDocsUploaded && !isUnderage;

  const pickImage = async (setter: (uri: string) => void) => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      setter(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    if (!canComplete) return;
    setIsLoading(true);
    try {
      // Save details to Clerk unsafeMetadata
      await user?.update({
        unsafeMetadata: {
          dob: dob?.toISOString(),
          gender,
          email,
          age,
          license,
          aadhaar,
          bikeFront,
          bikeBack,
        },
      });
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      Alert.alert('Error', 'Failed to save details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Upload Documents & Details</Text>
        <Text style={styles.subtitle}>Please provide the following details and documents to complete your signup.</Text>
        {/* DOB */}
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.inputRow}>
          <Input
            label="Date of Birth *"
            placeholder="Select your date of birth"
            value={dob ? dob.toLocaleDateString() : ''}
            editable={false}
            leftIcon="calendar"
          />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dob || new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              setShowDatePicker(false);
              if (date) setDob(date);
            }}
            maximumDate={new Date()}
          />
        )}
        {/* Age & Restriction */}
        {dob && (
          <Text style={{ color: isUnderage ? Colors.error : Colors.text, marginBottom: 8, marginLeft: 8 }}>
            Age: {age} {isUnderage ? '(You must be 18+ to sign up)' : ''}
          </Text>
        )}
        {/* Gender */}
        <View style={styles.inputRow}>
          <Input
            label="Gender *"
            placeholder="Select gender"
            value={gender}
            editable={false}
            leftIcon="person"
            rightIcon="chevron-down"
            onPressIn={() => {
              Alert.alert('Select Gender', '', GENDERS.map(g => ({ text: g, onPress: () => setGender(g) })));
            }}
          />
        </View>
        {/* Email */}
        <View style={styles.inputRow}>
          <Input
            label="Email *"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            leftIcon="mail"
          />
        </View>
        {/* Document Uploads */}
        <Text style={styles.sectionTitle}>Upload Documents</Text>
        <View style={styles.uploadRow}>
          <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setLicense)}>
            {license ? <Image source={{ uri: license }} style={styles.uploadImage} /> : <Ionicons name="document" size={32} color={Colors.gray400} />}
            <Text style={styles.uploadLabel}>License</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setAadhaar)}>
            {aadhaar ? <Image source={{ uri: aadhaar }} style={styles.uploadImage} /> : <Ionicons name="document" size={32} color={Colors.gray400} />}
            <Text style={styles.uploadLabel}>Aadhaar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.uploadRow}>
          <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setBikeFront)}>
            {bikeFront ? <Image source={{ uri: bikeFront }} style={styles.uploadImage} /> : <Ionicons name="bicycle" size={32} color={Colors.gray400} />}
            <Text style={styles.uploadLabel}>Bike Front</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setBikeBack)}>
            {bikeBack ? <Image source={{ uri: bikeBack }} style={styles.uploadImage} /> : <Ionicons name="bicycle" size={32} color={Colors.gray400} />}
            <Text style={styles.uploadLabel}>Bike Back</Text>
          </TouchableOpacity>
        </View>
        <Button
          title="Complete"
          onPress={handleComplete}
          loading={isLoading}
          fullWidth
          disabled={!canComplete}
          style={{ marginTop: 32 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { flexGrow: 1, padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: Colors.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginBottom: 24, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginTop: 24, marginBottom: 12 },
  inputRow: { marginBottom: 12 },
  uploadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  uploadBox: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.gray200, borderRadius: 12, padding: 16, marginHorizontal: 4, backgroundColor: '#f7faff' },
  uploadLabel: { marginTop: 8, color: Colors.textSecondary, fontSize: 14 },
  uploadImage: { width: 60, height: 60, borderRadius: 8, resizeMode: 'cover' },
}); 