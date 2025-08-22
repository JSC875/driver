import * as Location from 'expo-location';
import socketManager from '../utils/socket';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

interface LocationTrackingConfig {
  timeInterval: number; // milliseconds
  distanceInterval: number; // meters
  accuracy: Location.Accuracy;
  isOnline: boolean;
  currentRideRequest?: any;
}

class LocationTrackingService {
  private static instance: LocationTrackingService;
  private locationSubscription: Location.LocationSubscription | null = null;
  private isTracking = false;
  private continuousEmissionInterval: NodeJS.Timeout | null = null;
  private config: LocationTrackingConfig = {
    timeInterval: 5000, // 5 seconds
    distanceInterval: 10, // 10 meters
    accuracy: Location.Accuracy.High,
    isOnline: false,
  };
  private lastLocation: LocationData | null = null;
  private driverId: string = '';

  private constructor() {}

  public static getInstance(): LocationTrackingService {
    if (!LocationTrackingService.instance) {
      LocationTrackingService.instance = new LocationTrackingService();
    }
    return LocationTrackingService.instance;
  }

  /**
   * Initialize the location tracking service
   */
  async initialize(driverId?: string): Promise<boolean> {
    try {
      console.log('📍 Initializing location tracking service...');
      
      // Set driver ID if provided
      if (driverId) {
        this.driverId = driverId;
        console.log('✅ Driver ID set in location tracking service:', this.driverId);
      }
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('❌ Location permission denied');
        return false;
      }

      // Get initial location
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: this.config.accuracy,
      });

      this.lastLocation = {
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
        accuracy: initialLocation.coords.accuracy || undefined,
        speed: initialLocation.coords.speed || undefined,
        heading: initialLocation.coords.heading || undefined,
        timestamp: initialLocation.timestamp,
      };

      console.log('✅ Location tracking service initialized successfully');
      console.log('✅ Initial location:', {
        lat: this.lastLocation.latitude,
        lng: this.lastLocation.longitude,
        accuracy: this.lastLocation.accuracy,
        timestamp: new Date(this.lastLocation.timestamp).toISOString()
      });
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize location tracking service:', error);
      return false;
    }
  }

  /**
   * Start continuous location tracking
   */
  async startTracking(config?: Partial<LocationTrackingConfig>): Promise<boolean> {
    if (this.isTracking) {
      console.log('📍 Location tracking already active');
      return true;
    }

    try {
      // Update config if provided
      if (config) {
        this.config = { ...this.config, ...config };
      }

      console.log('📍 Starting location tracking with config:', this.config);

      // Stop any existing subscription
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      // Start watching position
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: this.config.accuracy,
          timeInterval: this.config.timeInterval,
          distanceInterval: this.config.distanceInterval,
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      this.isTracking = true;
      console.log('✅ Location tracking started successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to start location tracking:', error);
      return false;
    }
  }

  /**
   * Stop location tracking
   */
  stopTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isTracking = false;
    console.log('📍 Location tracking stopped');
  }

  /**
   * Handle location updates and emit to socket
   */
  private handleLocationUpdate(location: Location.LocationObject): void {
    // Ensure coordinates have consistent precision (7 decimal places for ~1cm accuracy)
    const latitude = parseFloat(location.coords.latitude.toFixed(7));
    const longitude = parseFloat(location.coords.longitude.toFixed(7));
    
    const locationData: LocationData = {
      latitude: latitude,
      longitude: longitude,
      accuracy: location.coords.accuracy || undefined,
      speed: location.coords.speed || undefined,
      heading: location.coords.heading || undefined,
      timestamp: location.timestamp,
    };

    console.log('📍 Raw location from GPS:', {
      rawLat: location.coords.latitude,
      rawLng: location.coords.longitude,
      processedLat: latitude,
      processedLng: longitude,
      latPrecision: latitude.toString().split('.')[1]?.length || 0,
      lngPrecision: longitude.toString().split('.')[1]?.length || 0,
      accuracy: location.coords.accuracy,
      timestamp: new Date(location.timestamp).toISOString()
    });

    // Check if location has changed significantly
    if (this.hasLocationChanged(locationData)) {
      this.lastLocation = locationData;
      
      console.log('📍 Location changed significantly, checking if should emit:', {
        isOnline: this.config.isOnline,
        hasCurrentRideRequest: !!this.config.currentRideRequest,
        currentRideRequest: this.config.currentRideRequest
      });
      
      // Emit location update if online and has active ride
      if (this.config.isOnline && this.config.currentRideRequest) {
        console.log('📍 Emitting location update to customer app');
        this.emitLocationUpdate(locationData);
      } else {
        console.log('📍 Not emitting location update:', {
          reason: !this.config.isOnline ? 'Driver not online' : 'No active ride request',
          isOnline: this.config.isOnline,
          hasRideRequest: !!this.config.currentRideRequest
        });
      }

      // Also update backend location
      this.updateBackendLocation(locationData);
    } else {
      console.log('📍 Location change not significant enough to emit');
    }
  }

  /**
   * Check if location has changed significantly
   */
  private hasLocationChanged(newLocation: LocationData): boolean {
    if (!this.lastLocation) return true;

    // Calculate distance between points
    const distance = this.calculateDistance(
      this.lastLocation.latitude,
      this.lastLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    );

    // Consider it changed if moved more than 5 meters
    return distance > 5;
  }

  /**
   * Calculate distance between two points in meters
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Emit location update to socket server
   */
  private emitLocationUpdate(locationData: LocationData): void {
    if (!this.config.currentRideRequest) {
      console.log('📍 No active ride request, skipping socket update');
      return;
    }

    // Use the backend driver ID from the ride request
    // The customer app expects the backend driver ID format: 943742b3-259e-45a3-801e-f5d98637cda6
    const backendDriverId = this.config.currentRideRequest.backendDriverId || 
                           '943742b3-259e-45a3-801e-f5d98637cda6'; // Fallback to known backend driver ID
    
    // Ensure coordinates are properly formatted for transmission
    const socketData = {
      latitude: parseFloat(locationData.latitude.toFixed(7)),
      longitude: parseFloat(locationData.longitude.toFixed(7)),
      userId: this.config.currentRideRequest.userId,
      driverId: backendDriverId, // Use backend driver ID for customer app compatibility
      accuracy: locationData.accuracy,
      speed: locationData.speed,
      heading: locationData.heading,
      timestamp: locationData.timestamp,
    };

    console.log('📍 Emitting location update with data:', {
      lat: socketData.latitude,
      lng: socketData.longitude,
      latPrecision: socketData.latitude.toString().split('.')[1]?.length || 0,
      lngPrecision: socketData.longitude.toString().split('.')[1]?.length || 0,
      userId: socketData.userId,
      driverId: socketData.driverId,
      driverIdSource: 'backend_driver_id',
      rideId: this.config.currentRideRequest.rideId,
      accuracy: socketData.accuracy,
      speed: socketData.speed,
      heading: socketData.heading,
      timestamp: socketData.timestamp,
    });

    // Send via socket
    socketManager.sendLocationUpdate(socketData);
    
    // Also update backend
    this.updateBackendLocation(locationData);
  }

  /**
   * Update location on backend
   */
  private async updateBackendLocation(locationData: LocationData): Promise<void> {
    try {
      // This would typically use the JWT token from the auth context
      // For now, we'll log the update
      console.log('📍 Backend location update:', {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: new Date(locationData.timestamp).toISOString(),
      });
    } catch (error) {
      console.error('❌ Failed to update backend location:', error);
    }
  }

  /**
   * Update tracking configuration
   */
  updateConfig(config: Partial<LocationTrackingConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('📍 Location tracking config updated:', this.config);
  }

  /**
   * Set current ride request
   */
  setCurrentRideRequest(rideRequest: any): void {
    this.config.currentRideRequest = rideRequest;
    console.log('📍 Current ride request updated:', {
      rideId: rideRequest?.rideId,
      driverId: rideRequest?.driverId,
      backendDriverId: rideRequest?.backendDriverId,
      userId: rideRequest?.userId,
      hasDriverId: !!rideRequest?.driverId,
      hasBackendDriverId: !!rideRequest?.backendDriverId
    });
  }

  /**
   * Manually emit current location to customer app (for debugging)
   */
  public forceEmitCurrentLocation(): void {
    if (!this.lastLocation) {
      console.log('📍 No current location available to emit');
      return;
    }

    console.log('📍 Force emitting current location to customer app');
    
    // Create a temporary ride request if none exists
    const tempRideRequest = this.config.currentRideRequest || {
      rideId: 'temp_ride_001',
      userId: 'user_31GhofPb9tV1kryNa3l3XtvaxOy', // Use actual customer user ID for testing
      backendDriverId: '943742b3-259e-45a3-801e-f5d98637cda6', // Use known backend driver ID
      driverId: this.driverId || 'user_31ET1nMl4LntOESWDx4fmHcFZiD'
    };

    // Temporarily set the ride request
    const originalRideRequest = this.config.currentRideRequest;
    this.config.currentRideRequest = tempRideRequest;
    this.config.isOnline = true;

    // Emit the location update
    this.emitLocationUpdate(this.lastLocation);

    // Restore original state
    this.config.currentRideRequest = originalRideRequest;
    this.config.isOnline = originalRideRequest ? true : false;

    console.log('📍 Force location emission completed');
  }

  /**
   * Start continuous location emission during active ride
   */
  public startContinuousLocationEmission(): void {
    if (!this.config.currentRideRequest) {
      console.log('📍 No active ride request, cannot start continuous emission');
      return;
    }

    console.log('📍 Starting continuous location emission for active ride');
    this.config.isOnline = true;
    
    // Emit current location immediately
    if (this.lastLocation) {
      this.emitLocationUpdate(this.lastLocation);
    }

    // Set up interval to emit location updates every 5 seconds during ride
    this.continuousEmissionInterval = setInterval(() => {
      if (this.lastLocation && this.config.currentRideRequest) {
        console.log('📍 Continuous emission: Sending location update');
        this.emitLocationUpdate(this.lastLocation);
      }
    }, 5000); // Emit every 5 seconds

    console.log('📍 Continuous location emission started');
  }

  /**
   * Stop continuous location emission
   */
  public stopContinuousLocationEmission(): void {
    if (this.continuousEmissionInterval) {
      clearInterval(this.continuousEmissionInterval);
      this.continuousEmissionInterval = null;
      console.log('📍 Continuous location emission stopped');
    }
  }

  /**
   * Get current location
   */
  getCurrentLocation(): LocationData | null {
    return this.lastLocation;
  }

  /**
   * Check if tracking is active
   */
  isTrackingActive(): boolean {
    return this.isTracking;
  }

  /**
   * Get tracking status
   */
  getTrackingStatus(): {
    isTracking: boolean;
    isOnline: boolean;
    hasActiveRide: boolean;
    lastLocation: LocationData | null;
  } {
    return {
      isTracking: this.isTracking,
      isOnline: this.config.isOnline,
      hasActiveRide: !!this.config.currentRideRequest,
      lastLocation: this.lastLocation,
    };
  }
}

export default LocationTrackingService;
