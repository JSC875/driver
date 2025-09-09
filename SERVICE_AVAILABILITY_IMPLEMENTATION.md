# Service Availability Check Implementation Guide

## Overview
This guide explains how to implement service availability checking for your ride-sharing app, specifically for the Hyderabad area. The system checks if users and drivers are within the service area before allowing them to book rides or go online.

## Features Implemented

### 1. Service Area Configuration (`src/constants/ServiceArea.ts`)
- **Hyderabad Service Area**: 50km radius from city center (17.3850°N, 78.4867°E)
- **Popular Areas**: 16 major areas including Banjara Hills, Jubilee Hills, Hitech City, etc.
- **Distance Calculation**: Uses Haversine formula for accurate distance measurement
- **Area Detection**: Automatically detects nearest popular area

### 2. Service Availability Service (`src/services/serviceAvailabilityService.ts`)
- **Local Check**: Immediate availability check using local coordinates
- **Backend Integration**: Optional backend verification for additional validation
- **Ride Validation**: Checks both pickup and drop locations
- **Error Handling**: Graceful fallback when backend is unavailable

### 3. React Hooks (`src/hooks/useServiceAvailability.ts`)
- **useServiceAvailability**: General service availability checking
- **useCurrentLocationAvailability**: Current location-specific checking
- **State Management**: Loading states, error handling, and status updates

### 4. UI Components (`src/components/ServiceAvailabilityBanner.tsx`)
- **Visual Feedback**: Color-coded status indicators
- **Expandable Details**: Show/hide additional information
- **Retry Functionality**: Allow users to retry failed checks
- **Responsive Design**: Adapts to different screen sizes

## Implementation Steps

### Step 1: Add Service Availability Check to Ride Booking

```typescript
import { useServiceAvailability } from '../hooks/useServiceAvailability';
import { serviceAvailabilityService } from '../services/serviceAvailabilityService';

// In your ride booking component
const RideBookingScreen = () => {
  const { checkRideAvailability, isAvailable, message, isChecking } = useServiceAvailability();

  const handleRideRequest = async (pickup: LocationData, drop: LocationData) => {
    // Check service availability first
    await checkRideAvailability(pickup, drop);
    
    if (isAvailable) {
      // Proceed with ride booking
      // Your existing ride booking logic
    } else {
      // Show error message
      Alert.alert('Service Unavailable', message);
    }
  };

  return (
    <View>
      {/* Your existing UI */}
      <ServiceAvailabilityBanner 
        status={{ isAvailable, message }}
        isLoading={isChecking}
      />
    </View>
  );
};
```

### Step 2: Add Service Availability Check to Driver App

```typescript
import { useCurrentLocationAvailability } from '../hooks/useServiceAvailability';

// In your driver dashboard
const DriverDashboard = () => {
  const { 
    checkCurrentLocation, 
    isAvailable, 
    message, 
    isChecking 
  } = useCurrentLocationAvailability();

  const handleGoOnline = async () => {
    // Check if driver is in service area
    await checkCurrentLocation();
    
    if (isAvailable) {
      // Allow driver to go online
      // Your existing online logic
    } else {
      // Prevent going online
      Alert.alert('Cannot Go Online', message);
    }
  };

  return (
    <View>
      <ServiceAvailabilityBanner 
        status={{ isAvailable, message }}
        isLoading={isChecking}
        onRetry={checkCurrentLocation}
      />
      
      <TouchableOpacity 
        onPress={handleGoOnline}
        disabled={!isAvailable || isChecking}
        style={[styles.button, !isAvailable && styles.buttonDisabled]}
      >
        <Text>Go Online</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Step 3: Integrate with Existing Ride Service

```typescript
// The ride service now includes service availability checks
const rideService = new RideService();

// Before making any ride-related API calls
const canProceed = await rideService.checkServiceAvailability(userLocation);
if (!canProceed) {
  throw new Error('Service not available in your area');
}

// Continue with ride operations
```

## Usage Examples

### 1. Check Single Location Availability

```typescript
import { serviceAvailabilityService } from '../services/serviceAvailabilityService';

const checkLocation = async () => {
  const location = {
    latitude: 17.4065,
    longitude: 78.4567,
    accuracy: 10,
    timestamp: Date.now()
  };

  const result = await serviceAvailabilityService.checkServiceAvailability(location);
  
  if (result.success) {
    console.log('Service available:', result.data.isAvailable);
    console.log('Message:', result.data.message);
    console.log('Nearest area:', result.data.nearestArea);
  }
};
```

### 2. Check Ride Route Availability

```typescript
const checkRideRoute = async () => {
  const pickup = { latitude: 17.4065, longitude: 78.4567 }; // Banjara Hills
  const drop = { latitude: 17.4458, longitude: 78.3789 };   // Hitech City

  const result = await serviceAvailabilityService.canRequestRide(pickup, drop);
  
  if (result.success && result.data.isAvailable) {
    console.log('Ride route is available');
    console.log('Route:', result.data.nearestArea);
  } else {
    console.log('Ride route not available:', result.data.message);
  }
};
```

### 3. Get Service Area Information

```typescript
const serviceInfo = serviceAvailabilityService.getServiceAreaInfo();
console.log('Service City:', serviceInfo.city);
console.log('Service Radius:', serviceInfo.radiusKm, 'km');
console.log('Popular Areas:', serviceInfo.popularAreas);
```

## Configuration

### Customizing Service Area

To change the service area or add new cities, modify `src/constants/ServiceArea.ts`:

```typescript
// Add new city
export const MUMBAI_SERVICE_AREA: ServiceAreaBoundary = {
  name: 'Mumbai',
  coordinates: [
    { lat: 19.0760, lng: 72.8777 }, // Center
    // Add boundary coordinates
  ]
};

// Update popular areas
export const MUMBAI_POPULAR_AREAS = [
  { name: 'Bandra', lat: 19.0596, lng: 72.8295 },
  { name: 'Andheri', lat: 19.1197, lng: 72.8464 },
  // Add more areas
];
```

### Adjusting Service Radius

```typescript
// Change service area radius
export const SERVICE_AREA_RADIUS_KM = 75; // Increase to 75km
```

## Error Handling

### Network Issues
- **Backend Unavailable**: System falls back to local checks
- **Timeout Handling**: Configurable timeout for backend calls
- **Retry Logic**: Automatic retry with exponential backoff

### Location Issues
- **GPS Accuracy**: Handles low-accuracy locations gracefully
- **Permission Denied**: Clear error messages for location permission issues
- **Invalid Coordinates**: Validation for coordinate ranges

## Testing

### Test Cases

1. **Within Service Area**
   - Location: Banjara Hills (17.4065°N, 78.4567°E)
   - Expected: Service available

2. **Outside Service Area**
   - Location: 100km from Hyderabad center
   - Expected: Service not available

3. **Boundary Testing**
   - Location: Exactly 50km from center
   - Expected: Service available

4. **Edge Cases**
   - Invalid coordinates
   - Network failures
   - Permission denied

### Testing Commands

```bash
# Run tests
npm test

# Test specific service
npm test -- --grep "ServiceAvailability"

# Test with mock data
npm test -- --grep "MockLocation"
```

## Performance Considerations

### Optimization Strategies
- **Local First**: Immediate local checks before backend calls
- **Caching**: Cache service area boundaries locally
- **Batch Requests**: Group multiple location checks when possible
- **Lazy Loading**: Load service area data only when needed

### Memory Management
- **Coordinate Precision**: Use appropriate decimal places
- **Array Limits**: Limit popular areas list to essential locations
- **Cleanup**: Clear cached data when app goes to background

## Security Considerations

### Data Protection
- **Coordinate Privacy**: Don't log exact user coordinates
- **API Security**: Use HTTPS for all backend calls
- **Rate Limiting**: Implement rate limiting for availability checks
- **Input Validation**: Validate all coordinate inputs

### Access Control
- **User Authentication**: Require authentication for service checks
- **Permission Checks**: Verify location permissions before checks
- **Audit Logging**: Log service availability check attempts

## Troubleshooting

### Common Issues

1. **Service Always Shows as Unavailable**
   - Check coordinate format (should be decimal degrees)
   - Verify service area radius configuration
   - Check if location is within defined boundaries

2. **Backend Integration Fails**
   - Verify API endpoint URL
   - Check network connectivity
   - Review API response format

3. **Performance Issues**
   - Reduce popular areas list
   - Implement coordinate caching
   - Use approximate distance calculations for initial checks

### Debug Mode

Enable debug logging by setting environment variable:

```bash
export DEBUG_SERVICE_AVAILABILITY=true
```

This will log detailed information about:
- Coordinate calculations
- Distance measurements
- Service area boundaries
- Backend API calls

## Future Enhancements

### Planned Features
1. **Multi-City Support**: Support for multiple service areas
2. **Dynamic Boundaries**: Real-time boundary updates
3. **Traffic Integration**: Consider traffic conditions in availability
4. **Time-Based Availability**: Different availability based on time of day
5. **Weather Integration**: Weather-based service availability

### API Extensions
1. **Bulk Location Check**: Check multiple locations at once
2. **Route Optimization**: Suggest optimal routes within service area
3. **Demand Prediction**: Predict service availability based on demand
4. **Real-Time Updates**: WebSocket updates for availability changes

## Support

For technical support or questions about this implementation:

1. **Documentation**: Check this guide and inline code comments
2. **Code Review**: Review the implementation files for examples
3. **Testing**: Use the provided test cases to verify functionality
4. **Logs**: Enable debug logging for detailed troubleshooting

## Conclusion

This service availability system provides a robust foundation for ensuring your ride-sharing app only operates within the Hyderabad service area. The implementation is designed to be:

- **Reliable**: Multiple fallback mechanisms
- **Performant**: Local-first approach with backend validation
- **User-Friendly**: Clear visual feedback and error messages
- **Maintainable**: Well-structured code with comprehensive documentation
- **Extensible**: Easy to add new cities or modify existing areas

By following this guide, you'll have a production-ready service availability system that enhances user experience while maintaining operational efficiency.
