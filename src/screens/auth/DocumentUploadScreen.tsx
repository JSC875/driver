import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, StyleSheet, Platform, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '@clerk/clerk-expo';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Add type for navigation prop
interface DocumentUploadScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

const DocumentUploadScreen = ({ navigation }: DocumentUploadScreenProps) => {
  const { user, isLoaded } = useUser();
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [isOver18, setIsOver18] = useState(false);
  const [bikeFrontPhoto, setBikeFrontPhoto] = useState<string | null>(null);
  const [bikeBackPhoto, setBikeBackPhoto] = useState<string | null>(null);
  const [licensePhoto, setLicensePhoto] = useState<string | null>(null);
  const [rcPhoto, setRcPhoto] = useState<string | null>(null);
  const [aadharPhoto, setAadharPhoto] = useState<string | null>(null);
  const [panPhoto, setPanPhoto] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Calculate age based on DOB
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    setIsOver18(age >= 18);
  }, [dob]);

  useEffect(() => {
    // Pre-fill email if available
    if (user?.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [user]);

  const pickImage = async (setImageFunction: (uri: string) => void) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      setImageFunction(result.assets[0].uri);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dob;
    setShowDatePicker(Platform.OS === 'ios');
    setDob(currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleSubmit = async () => {
    if (!isOver18) {
      Alert.alert('Error', 'You must be at least 18 years old to register as a driver.');
      return;
    }
    if (!email || !gender || !bikeFrontPhoto || !bikeBackPhoto || !licensePhoto || !rcPhoto || !aadharPhoto || !panPhoto) {
      Alert.alert('Error', 'Please fill all fields and upload all documents.');
      return;
    }
    if (!termsAccepted) {
      Alert.alert('Error', 'Please accept the terms and conditions.');
      return;
    }
    try {
      setIsSaving(true);
      await user?.update({
        unsafeMetadata: {
          email,
          dob: dob.toISOString(),
          gender,
          bikeFrontPhoto,
          bikeBackPhoto,
          licensePhoto,
          rcPhoto,
          aadharPhoto,
          panPhoto,
        },
      });
      setIsSaving(false);
      Alert.alert('Success', 'Documents submitted for verification!');
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Error', 'Failed to save documents. Please try again.');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Driver Registration</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Date of Birth</Text>
      <TouchableOpacity onPress={showDatepicker} style={styles.dateInput}>
        <Text>{formatDate(dob)}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={dob}
          mode="date"
          display="default"
          onChange={onChangeDate}
          maximumDate={new Date()}
        />
      )}
      {!isOver18 && dob && (
        <Text style={styles.errorText}>You must be at least 18 years old to register.</Text>
      )}
      <Text style={styles.label}>Gender</Text>
      <View style={styles.genderContainer}>
        <TouchableOpacity
          style={[styles.genderOption, gender === 'male' && styles.genderSelected]}
          onPress={() => setGender('male')}
        >
          <Text>Male</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderOption, gender === 'female' && styles.genderSelected]}
          onPress={() => setGender('female')}
        >
          <Text>Female</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderOption, gender === 'other' && styles.genderSelected]}
          onPress={() => setGender('other')}
        >
          <Text>Other</Text>
        </TouchableOpacity>
      </View>
      {/* Document Upload Sections */}
      <Text style={styles.sectionHeader}>Upload Documents</Text>
      <Text style={styles.label}>Bike Front Photo</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setBikeFrontPhoto)}>
        <Text>Select Image</Text>
      </TouchableOpacity>
      {bikeFrontPhoto && <Image source={{ uri: bikeFrontPhoto }} style={styles.previewImage} />}
      <Text style={styles.label}>Bike Back Photo</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setBikeBackPhoto)}>
        <Text>Select Image</Text>
      </TouchableOpacity>
      {bikeBackPhoto && <Image source={{ uri: bikeBackPhoto }} style={styles.previewImage} />}
      <Text style={styles.label}>Driver's License</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setLicensePhoto)}>
        <Text>Select Image</Text>
      </TouchableOpacity>
      {licensePhoto && <Image source={{ uri: licensePhoto }} style={styles.previewImage} />}
      <Text style={styles.label}>RC (Registration Certificate)</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setRcPhoto)}>
        <Text>Select Image</Text>
      </TouchableOpacity>
      {rcPhoto && <Image source={{ uri: rcPhoto }} style={styles.previewImage} />}
      <Text style={styles.label}>Aadhar Card</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setAadharPhoto)}>
        <Text>Select Image</Text>
      </TouchableOpacity>
      {aadharPhoto && <Image source={{ uri: aadharPhoto }} style={styles.previewImage} />}
      <Text style={styles.label}>PAN Card</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setPanPhoto)}>
        <Text>Select Image</Text>
      </TouchableOpacity>
      {panPhoto && <Image source={{ uri: panPhoto }} style={styles.previewImage} />}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 10 }}>
        <Switch
          value={termsAccepted}
          onValueChange={setTermsAccepted}
        />
        <Text style={{ marginLeft: 8 }}>I accept the terms and conditions</Text>
      </View>
      <TouchableOpacity 
        style={[styles.submitButton, (!isOver18 || !termsAccepted || isSaving) && styles.disabledButton]} 
        onPress={handleSubmit}
        disabled={!isOver18 || !termsAccepted || isSaving}
      >
        <Text style={styles.submitButtonText}>{isSaving ? 'Saving...' : 'Submit Documents'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  dateInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    justifyContent: 'center',
    marginBottom: 10,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  genderOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: '30%',
    alignItems: 'center',
  },
  genderSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  checkbox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginLeft: 0,
    paddingLeft: 0,
    marginTop: 15,
  },
  submitButton: {
    backgroundColor: '#2196f3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default DocumentUploadScreen; 