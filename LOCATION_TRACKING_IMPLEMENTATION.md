# Location Tracking Implementation for Driver App

## Overview

This implementation provides accurate, real-time location tracking for the driver app with automatic socket emission when the driver is online and has an active ride.

## Key Features

- **Continuous Location Tracking**: Automatically tracks driver location every 5 seconds or when moving 10+ meters
- **Smart Location Updates**: Only emits location updates when there's a significant change (5+ meters)
- **Automatic Socket Integration**: Seamlessly integrates with existing socket infrastructure
- **Ride-Aware Tracking**: Only sends location updates when driver is online and has an active ride
- **High Accuracy**: Uses GPS with high accuracy settings
- **Battery Optimized**: Configurable intervals to balance accuracy and battery life

## Architecture

### 1. LocationTrackingService (Singleton)

**File**: `src/services/locationTrackingService.ts`

The core service that handles all location tracking logic:

```typescript
class LocationTrackingService {
  // Singleton pattern
  private static instance: LocationTrackingService;
  
  // Configuration
  private config: LocationTrackingConfig = {
    timeInterval: 5000, // 5 seconds
    distanceInterval: 10, // 10 meters
    accuracy: Location.Accuracy.High,
    isOnline: false,
  };
}
```

**Key Methods**:
- `initialize()`: Request permissions and get initial location
- `startTracking()`: Begin continuous location monitoring
- `stopTracking()`: Stop location monitoring
- `handleLocationUpdate()`: Process location changes and emit to socket
- `hasLocationChanged()`: Check if location change is significant

### 2. Enhanced Socket Integration

**File**: `src/utils/socket.ts`

Updated to handle enhanced location data:

```typescript
sendLocationUpdate(data: {
  latitude: number;
  longitude: number;
  userId: string;
  driverId: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp?: number;
})
```

### 3. OnlineStatusContext Integration

**File**: `src/store/OnlineStatusContext.tsx`

Automatically manages location tracking based on online status:

```typescript
useEffect(() => {
  if (isOnline) {
    // Start location tracking when going online
    locationTrackingService.startTracking({
      isOnline: true,
      timeInterval: 5000,
      distanceInterval: 10,
      accuracy: Location.Accuracy.High,
    });
  } else {
    // Stop location tracking when going offline
    locationTrackingService.stopTracking();
  }
}, [isOnline, driverId]);
```

## Implementation Details

### Location Data Structure

```typescript
interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;    // GPS accuracy in meters
  speed?: number;       // Speed in m/s
  heading?: number;     // Direction in degrees
  timestamp: number;    // Unix timestamp
}
```

### Distance Calculation

Uses Haversine formula for accurate distance calculation:

```typescript
private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
```

### Location Change Detection

Only emits updates when driver moves more than 5 meters:

```typescript
private hasLocationChanged(newLocation: LocationData): boolean {
  if (!this.lastLocation) return true;
  
  const distance = this.calculateDistance(
    this.lastLocation.latitude,
    this.lastLocation.longitude,
    newLocation.latitude,
    newLocation.longitude
  );
  
  return distance > 5; // 5 meters threshold
}
```

## Usage Flow

### 1. App Initialization
```typescript
// In OnlineStatusProvider
const locationTrackingService = LocationTrackingService.getInstance();
await locationTrackingService.initialize();
```

### 2. Going Online
```typescript
// Automatically starts location tracking
setIsOnline(true);
```

### 3. Accepting a Ride
```typescript
// Sets current ride request in location tracking service
locationTrackingService.setCurrentRideRequest(acceptedRideDetails);
```

### 4. Location Updates
```typescript
// Automatically emitted when:
// - Driver is online
// - Has active ride
// - Location changed significantly (>5m)
// - Every 5 seconds or 10m movement
```

### 5. Going Offline
```typescript
// Automatically stops location tracking
setIsOnline(false);
```

## Configuration Options

### Location Tracking Config

```typescript
interface LocationTrackingConfig {
  timeInterval: number;        // Update interval in milliseconds
  distanceInterval: number;    // Minimum distance for updates in meters
  accuracy: Location.Accuracy; // GPS accuracy level
  isOnline: boolean;          // Whether driver is online
  currentRideRequest?: any;   // Current active ride
}
```

### Default Settings

- **Time Interval**: 5 seconds
- **Distance Interval**: 10 meters
- **Accuracy**: High (best available)
- **Change Threshold**: 5 meters

## Debug Features

### LocationTrackingStatus Component

**File**: `src/components/common/LocationTrackingStatus.tsx`

Provides real-time debugging information:

- Tracking status (Active/Inactive)
- Online status (Yes/No)
- Active ride status (Yes/No)
- Current location coordinates
- GPS accuracy
- Speed and heading (if available)

**Usage**:
```typescript
<LocationTrackingStatus visible={__DEV__} />
```

## Socket Events

### Emitted Events

**Event**: `driver_location`
**Data**:
```typescript
{
  latitude: number,
  longitude: number,
  userId: string,
  driverId: string,
  accuracy?: number,
  speed?: number,
  heading?: number,
  timestamp?: number
}
```

### Event Flow

1. **Location Update Detected**: GPS provides new location
2. **Change Validation**: Check if movement > 5 meters
3. **Ride Validation**: Check if driver is online and has active ride
4. **Socket Emission**: Send location data to server
5. **Backend Update**: Update driver location in database

## Error Handling

### Permission Denied
```typescript
const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') {
  console.error('❌ Location permission denied');
  return false;
}
```

### GPS Errors
```typescript
try {
  const location = await Location.getCurrentPositionAsync({
    accuracy: this.config.accuracy,
  });
} catch (error) {
  console.error('❌ Failed to get location:', error);
}
```

### Socket Connection Issues
```typescript
if (this.socket && this.isConnected) {
  this.socket.emit('driver_location', data);
} else {
  console.warn('⚠️ Socket not connected, cannot send location update');
}
```

## Performance Considerations

### Battery Optimization
- Configurable update intervals
- Distance-based filtering
- Automatic start/stop based on online status

### Network Optimization
- Only send updates when necessary
- Include accuracy and speed data for better tracking
- Timestamp for server-side processing

### Memory Management
- Singleton pattern prevents multiple instances
- Automatic cleanup of location subscriptions
- Efficient distance calculations

## Testing

### Manual Testing
1. Go online in driver app
2. Accept a ride request
3. Move around (walk/drive)
4. Check socket logs for location updates
5. Verify location accuracy in passenger app

### Debug Information
- Location tracking status overlay (dev mode only)
- Console logs for all location events
- Socket connection status monitoring

## Future Enhancements

### Potential Improvements
1. **Geofencing**: Automatic ride status updates based on location
2. **Route Optimization**: Real-time route suggestions
3. **Battery Optimization**: Adaptive update intervals based on movement
4. **Offline Support**: Cache location data when offline
5. **Analytics**: Track driver behavior and optimize routes

### Configuration Options
1. **Custom Thresholds**: Allow drivers to set update preferences
2. **Accuracy Levels**: Different accuracy modes for different scenarios
3. **Update Frequency**: Configurable based on ride type or driver preference

## Troubleshooting

### Common Issues

1. **Location Not Updating**
   - Check location permissions
   - Verify GPS is enabled
   - Check if driver is online and has active ride

2. **High Battery Usage**
   - Increase time interval
   - Increase distance threshold
   - Reduce accuracy level

3. **Inaccurate Locations**
   - Check GPS signal strength
   - Verify high accuracy mode
   - Test outdoors for better signal

4. **Socket Connection Issues**
   - Check internet connection
   - Verify socket server status
   - Check authentication tokens

### Debug Commands

```typescript
// Check tracking status
const status = locationTrackingService.getTrackingStatus();
console.log('Tracking Status:', status);

// Get current location
const location = locationTrackingService.getCurrentLocation();
console.log('Current Location:', location);

// Force location update
locationTrackingService.emitLocationUpdate(locationData);
```

## Conclusion

This implementation provides a robust, efficient, and accurate location tracking system for the driver app. It automatically handles all location updates and socket emissions, ensuring passengers receive real-time driver location information without manual intervention.

The system is designed to be battery-efficient, network-optimized, and highly reliable, with comprehensive error handling and debugging capabilities.
