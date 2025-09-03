import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { ServiceAvailabilityStatus } from '../constants/ServiceArea';

interface ServiceAvailabilityBannerProps {
  status: ServiceAvailabilityStatus;
  isLoading?: boolean;
  onRetry?: () => void;
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

export const ServiceAvailabilityBanner: React.FC<ServiceAvailabilityBannerProps> = ({
  status,
  isLoading = false,
  onRetry,
  showDetails = false,
  onToggleDetails,
}) => {
  const getStatusColor = () => {
    if (isLoading) return Colors.gray;
    return status.isAvailable ? Colors.success : Colors.error;
  };

  const getStatusIcon = () => {
    if (isLoading) return 'refresh';
    return status.isAvailable ? 'checkmark-circle' : 'close-circle';
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking service availability...';
    return status.isAvailable ? 'Service Available' : 'Service Not Available';
  };

  return (
    <View style={[styles.container, { borderLeftColor: getStatusColor() }]}>
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color={getStatusColor()} />
          ) : (
            <Ionicons name={getStatusIcon()} size={20} color={getStatusColor()} />
          )}
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        
        {onToggleDetails && (
          <TouchableOpacity onPress={onToggleDetails} style={styles.toggleButton}>
            <Ionicons 
              name={showDetails ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={Colors.text} 
            />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.message}>{status.message}</Text>

      {showDetails && status.nearestArea && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color={Colors.primary} />
            <Text style={styles.detailText}>
              Nearest Area: {status.nearestArea}
            </Text>
          </View>
          
          {status.distanceFromCenter && (
            <View style={styles.detailRow}>
              <Ionicons name="map" size={16} color={Colors.primary} />
              <Text style={styles.detailText}>
                Distance from Center: {status.distanceFromCenter.toFixed(1)}km
              </Text>
            </View>
          )}
        </View>
      )}

      {!status.isAvailable && onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Ionicons name="refresh" size={16} color={Colors.white} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  toggleButton: {
    padding: 4,
  },
  message: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  detailsContainer: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: Colors.text,
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default ServiceAvailabilityBanner;
