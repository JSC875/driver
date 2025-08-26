import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LocationTrackingService from '../../services/locationTrackingService';

interface LocationTrackingStatusProps {
  visible?: boolean;
}

export default function LocationTrackingStatus({ visible = true }: LocationTrackingStatusProps) {
  const [status, setStatus] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);

  useEffect(() => {
    if (!visible) return;

    const locationService = LocationTrackingService.getInstance();
    
    const updateStatus = () => {
      const trackingStatus = locationService.getTrackingStatus();
      const location = locationService.getCurrentLocation();
      
      setStatus(trackingStatus);
      setCurrentLocation(location);
    };

    // Update status immediately
    updateStatus();

    // Update status every 2 seconds
    const interval = setInterval(updateStatus, 2000);

    return () => clearInterval(interval);
  }, [visible]);

  const handleForceEmitLocation = () => {
    const locationService = LocationTrackingService.getInstance();
    locationService.forceEmitCurrentLocation();
  };

  if (!visible || !status) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Location Tracking Status</Text>
      
      <View style={styles.statusRow}>
        <Text style={styles.label}>Tracking:</Text>
        <Text style={[styles.value, { color: status.isTracking ? '#00C853' : '#FF5722' }]}>
          {status.isTracking ? 'Active' : 'Inactive'}
        </Text>
      </View>
      
      <View style={styles.statusRow}>
        <Text style={styles.label}>Online:</Text>
        <Text style={[styles.value, { color: status.isOnline ? '#00C853' : '#FF5722' }]}>
          {status.isOnline ? 'Yes' : 'No'}
        </Text>
      </View>
      
      <View style={styles.statusRow}>
        <Text style={styles.label}>Active Ride:</Text>
        <Text style={[styles.value, { color: status.hasActiveRide ? '#00C853' : '#FF5722' }]}>
          {status.hasActiveRide ? 'Yes' : 'No'}
        </Text>
      </View>
      
      {currentLocation && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationTitle}>Current Location:</Text>
          <Text style={styles.locationText}>
            Lat: {currentLocation.latitude.toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            Lng: {currentLocation.longitude.toFixed(6)}
          </Text>
          {currentLocation.accuracy && (
            <Text style={styles.locationText}>
              Accuracy: {currentLocation.accuracy.toFixed(1)}m
            </Text>
          )}
          {currentLocation.speed && (
            <Text style={styles.locationText}>
              Speed: {(currentLocation.speed * 3.6).toFixed(1)} km/h
            </Text>
          )}
          {currentLocation.heading && (
            <Text style={styles.locationText}>
              Heading: {currentLocation.heading.toFixed(0)}°
            </Text>
          )}
        </View>
      )}

      {/* Debug Button */}
      <TouchableOpacity 
        style={styles.debugButton} 
        onPress={handleForceEmitLocation}
      >
        <Text style={styles.debugButtonText}>🚀 Force Emit Location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    minWidth: 200,
    zIndex: 1000,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#fff',
    fontSize: 12,
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  locationTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationText: {
    color: '#fff',
    fontSize: 10,
    marginBottom: 2,
  },
  debugButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: 'flex-end',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
