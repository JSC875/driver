import { useState, useCallback, useEffect } from 'react';
import { LocationObject } from 'expo-location';
import { serviceAvailabilityService, LocationData, ServiceAvailabilityResponse } from '../services/serviceAvailabilityService';

export interface UseServiceAvailabilityReturn {
  isChecking: boolean;
  isAvailable: boolean;
  message: string;
  nearestArea?: string;
  distanceFromCenter?: number;
  error?: string;
  checkAvailability: (location: LocationData) => Promise<void>;
  checkRideAvailability: (pickup: LocationData, drop: LocationData) => Promise<void>;
  resetStatus: () => void;
}

export function useServiceAvailability(): UseServiceAvailabilityReturn {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [message, setMessage] = useState('');
  const [nearestArea, setNearestArea] = useState<string>();
  const [distanceFromCenter, setDistanceFromCenter] = useState<number>();
  const [error, setError] = useState<string>();

  const checkAvailability = useCallback(async (location: LocationData) => {
    try {
      setIsChecking(true);
      setError(undefined);
      
      const result = await serviceAvailabilityService.checkServiceAvailability(location);
      
      if (result.success) {
        setIsAvailable(result.data.isAvailable);
        setMessage(result.data.message);
        setNearestArea(result.data.nearestArea);
        setDistanceFromCenter(result.data.distanceFromCenter);
      } else {
        setError(result.error || 'Failed to check availability');
        setIsAvailable(false);
        setMessage('Unable to check service availability');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsAvailable(false);
      setMessage('Error checking service availability');
    } finally {
      setIsChecking(false);
    }
  }, []);

  const checkRideAvailability = useCallback(async (pickup: LocationData, drop: LocationData) => {
    try {
      setIsChecking(true);
      setError(undefined);
      
      const result = await serviceAvailabilityService.canRequestRide(pickup, drop);
      
      if (result.success) {
        setIsAvailable(result.data.isAvailable);
        setMessage(result.data.message);
        setNearestArea(result.data.nearestArea);
        setDistanceFromCenter(result.data.distanceFromCenter);
      } else {
        setError(result.error || 'Failed to check ride availability');
        setIsAvailable(false);
        setMessage('Unable to check ride availability');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsAvailable(false);
      setMessage('Error checking ride availability');
    } finally {
      setIsChecking(false);
    }
  }, []);

  const resetStatus = useCallback(() => {
    setIsChecking(false);
    setIsAvailable(false);
    setMessage('');
    setNearestArea(undefined);
    setDistanceFromCenter(undefined);
    setError(undefined);
  }, []);

  return {
    isChecking,
    isAvailable,
    message,
    nearestArea,
    distanceFromCenter,
    error,
    checkAvailability,
    checkRideAvailability,
    resetStatus,
  };
}

// Hook for checking current location availability
export function useCurrentLocationAvailability() {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  
  const {
    isChecking,
    isAvailable,
    message,
    nearestArea,
    distanceFromCenter,
    error,
    checkAvailability,
    resetStatus,
  } = useServiceAvailability();

  const checkCurrentLocation = useCallback(async () => {
    try {
      // This would typically use expo-location to get current location
      // For now, we'll use a placeholder
      if (currentLocation) {
        await checkAvailability(currentLocation);
      }
    } catch (err) {
      console.error('Error checking current location availability:', err);
    }
  }, [currentLocation, checkAvailability]);

  const updateLocation = useCallback((location: LocationData) => {
    setCurrentLocation(location);
  }, []);

  const setPermission = useCallback((hasPermission: boolean) => {
    setLocationPermission(hasPermission);
  }, []);

  return {
    currentLocation,
    locationPermission,
    isChecking,
    isAvailable,
    message,
    nearestArea,
    distanceFromCenter,
    error,
    checkCurrentLocation,
    updateLocation,
    setPermission,
    resetStatus,
  };
}
