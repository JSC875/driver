import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface CancelRideModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  rideDetails?: {
    pickupAddress: string;
    dropoffAddress: string;
    price: string;
  };
}

const cancellationReasons = [
  {
    id: 'wrong_location',
    title: 'Wrong pickup/dropoff location',
    description: 'Address is incorrect or unclear',
    icon: 'location-outline',
  },
  {
    id: 'passenger_not_found',
    title: 'Passenger not found',
    description: 'Could not locate passenger at pickup',
    icon: 'person-outline',
  },
  {
    id: 'vehicle_issue',
    title: 'Vehicle breakdown',
    description: 'Technical or mechanical problem',
    icon: 'car-outline',
  },
  {
    id: 'emergency',
    title: 'Emergency situation',
    description: 'Personal or medical emergency',
    icon: 'medical-outline',
  },
  {
    id: 'unsafe_location',
    title: 'Unsafe pickup location',
    description: 'Area appears dangerous or inaccessible',
    icon: 'warning-outline',
  },
  {
    id: 'traffic',
    title: 'Traffic/road conditions',
    description: 'Heavy traffic or road closure',
    icon: 'traffic-light-outline',
  },
  {
    id: 'other',
    title: 'Other reason',
    description: 'Select if none of the above apply',
    icon: 'ellipsis-horizontal-outline',
  },
];

export default function CancelRideModal({
  visible,
  onClose,
  onConfirm,
  rideDetails,
}: CancelRideModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleReasonSelect = (reasonId: string) => {
    setSelectedReason(reasonId);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (selectedReason) {
      const reason = cancellationReasons.find(r => r.id === selectedReason);
      onConfirm(reason?.title || selectedReason);
      // Reset state
      setSelectedReason('');
      setShowConfirmation(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setShowConfirmation(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons name="close-circle" size={24} color="#666" />
              <Text style={styles.headerTitle}>Cancel Ride</Text>
              <View style={{ width: 24 }} />
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Ride Details */}
          {rideDetails && (
            <View style={styles.rideDetails}>
              <View style={styles.rideDetailRow}>
                <Ionicons name="location" size={16} color="#00C853" />
                <Text style={styles.rideDetailText} numberOfLines={2}>
                  {rideDetails.pickupAddress}
                </Text>
              </View>
              <View style={styles.rideDetailRow}>
                <Ionicons name="flag" size={16} color="#FF6B35" />
                <Text style={styles.rideDetailText} numberOfLines={2}>
                  {rideDetails.dropoffAddress}
                </Text>
              </View>
              <View style={styles.rideDetailRow}>
                <Ionicons name="cash-outline" size={16} color="#1877f2" />
                <Text style={styles.rideDetailText}>{rideDetails.price}</Text>
              </View>
            </View>
          )}

          {/* Confirmation Step */}
          {showConfirmation ? (
            <View style={styles.confirmationContainer}>
              <View style={styles.confirmationIcon}>
                <Ionicons name="warning" size={48} color="#FF6B35" />
              </View>
              <Text style={styles.confirmationTitle}>
                Cancel this ride?
              </Text>
              <Text style={styles.confirmationMessage}>
                Are you sure you want to cancel this ride? This action cannot be undone.
              </Text>
              
              <View style={styles.confirmationButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowConfirmation(false)}
                >
                  <Text style={styles.cancelButtonText}>No, Keep Ride</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>Yes, Cancel Ride</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Reason Selection Step */
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonTitle}>
                Why are you cancelling this ride?
              </Text>
              <Text style={styles.reasonSubtitle}>
                Please select a reason to help us improve our service
              </Text>

              <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
                {cancellationReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    style={styles.reasonItem}
                    onPress={() => handleReasonSelect(reason.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.reasonIcon}>
                      <Ionicons name={reason.icon as any} size={20} color="#1877f2" />
                    </View>
                    <View style={styles.reasonContent}>
                      <Text style={styles.reasonText}>{reason.title}</Text>
                      <Text style={styles.reasonDescription}>{reason.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width - 40,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
  },
  rideDetails: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  rideDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rideDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  reasonContainer: {
    padding: 20,
  },
  reasonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reasonSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  reasonsList: {
    maxHeight: 400,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reasonContent: {
    flex: 1,
  },
  reasonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reasonDescription: {
    fontSize: 14,
    color: '#666',
  },
  confirmationContainer: {
    padding: 20,
    alignItems: 'center',
  },
  confirmationIcon: {
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#ff4757',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
