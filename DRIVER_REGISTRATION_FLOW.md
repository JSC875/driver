# Driver Registration Flow Documentation

## Overview

This document outlines the complete driver registration flow in the RiderSony driver app, specifically focusing on the `/api/registration/driver` endpoint implementation. The registration process follows a multi-step flow that collects user information, verifies identity, uploads required documents, and creates a driver record in the backend.

## Table of Contents

1. [Registration Flow Overview](#registration-flow-overview)
2. [Step-by-Step Flow](#step-by-step-flow)
3. [API Endpoint Details](#api-endpoint-details)
4. [Technical Implementation](#technical-implementation)
5. [Authentication & Security](#authentication--security)
6. [Error Handling](#error-handling)
7. [Data Storage](#data-storage)
8. [Response Structure](#response-structure)
9. [Important Notes](#important-notes)

---

## Registration Flow Overview

The driver registration process follows this sequence:

```
SplashScreen → OnboardingScreen → SignUpScreen → OTPVerificationScreen → 
ProfileSetupScreen → DocumentUploadScreen → HomeScreen (where driver creation happens)
```

### Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   SplashScreen  │───▶│ OnboardingScreen │───▶│   SignUpScreen  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  HomeScreen     │◀───│DocumentUploadScreen│◀───│ProfileSetupScreen│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              /api/registration/driver                       │
│                    (Driver Creation)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Flow

### Step 1: SignUpScreen (`src/screens/auth/SignUpScreen.tsx`)

**Purpose**: Collect basic user information and phone verification

**Process**:
- User enters: `firstName`, `lastName`, `phoneNumber` (with country code)
- Phone number verification via OTP
- Updates Clerk user metadata with `userType: 'driver'`
- Generates custom JWT token with `driver_app_token` template

**Key Features**:
- Multi-step form (4 steps)
- OTP verification with resend functionality
- Profile image upload
- Real-time validation

### Step 2: ProfileSetupScreen

**Purpose**: Collect additional profile information

**Process**:
- User uploads profile image
- Updates Clerk user with profile data
- Validates required fields

### Step 3: DocumentUploadScreen (`src/screens/auth/DocumentUploadScreen.tsx`)

**Purpose**: Collect driver-specific documents

**Required Documents**:
- **Personal Information**:
  - Email address
  - Date of Birth (must be 18+)
  - Gender
- **Vehicle Documents**:
  - Bike Front Photo
  - Bike Back Photo
  - RC (Registration Certificate) Photo
- **Identity Documents**:
  - License Photo
  - Aadhar Photo
  - PAN Photo

**Validation Rules**:
- Age must be 18 or older
- All document fields are required
- Terms and conditions must be accepted

**Process**:
- Validates age (must be 18+)
- Stores documents in Clerk's `unsafeMetadata`
- Navigates to HomeScreen upon completion

### Step 4: HomeScreen - Driver Creation (`src/screens/home/HomeScreen.tsx`)

**Purpose**: Creates driver record in backend using `/api/registration/driver`

**Trigger**: Automatically runs when user first reaches HomeScreen

**Process**:
1. Check if driver already exists
2. Create user record if needed
3. Create driver record via API
4. Store driver IDs locally
5. Regenerate JWT with updated claims

---

## API Endpoint Details

### `/api/registration/driver`

**Endpoint**: `POST https://bike-taxi-production.up.railway.app/api/registration/driver`

**Content-Type**: `multipart/form-data`

**Authentication**: `Bearer <custom_jwt_token>`

### Request Structure

```typescript
// FormData payload
const formData = new FormData();
formData.append('clerkUserId', user.id);
formData.append('firstName', user.firstName || '');
formData.append('lastName', user.lastName || '');
formData.append('phoneNumber', phoneNumber); // Without country code (+91)
formData.append('userType', 'driver');
// Optional: profileImage, licenseImage
```

### Headers

```typescript
{
  'Authorization': `Bearer ${customToken}`,
  'X-App-Version': '1.0.0',
  'X-Platform': 'ReactNative',
  'X-Environment': 'development'
  // Note: Do NOT set Content-Type for multipart/form-data
}
```

---

## Technical Implementation

### Complete Implementation in HomeScreen

```typescript
const createDriver = async () => {
  console.log('[createDriver] Starting driver creation process...');
  
  try {
    // 1. Get custom Clerk JWT token
    const customToken = await getToken({ template: 'driver_app_token' });
    console.log('[createDriver] Got custom Clerk JWT (driver_app_token):', customToken);
    
    if (!customToken) {
      console.error('[createDriver] No custom Clerk JWT found!');
      return;
    }

    // 2. Create user record first
    console.log('[createDriver] Step 1: Creating user record...');
    const userResponse = await fetch('https://bike-taxi-production.up.railway.app/api/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${customToken}`,
        'Content-Type': 'application/json',
        'X-App-Version': '1.0.0',
        'X-Platform': 'ReactNative',
        'X-Environment': 'development',
      },
    });
    
    if (userResponse.ok) {
      console.log('[createDriver] ✅ User record created/retrieved successfully');
    } else {
      console.error('[createDriver] ❌ Failed to create user record:', userResponse.status);
    }

    // 3. Check if driver already exists
    console.log('[createDriver] Step 2: Creating driver record...');
    console.log('[createDriver] Checking if driver already exists...');
    const driverCheckResponse = await fetch(`https://bike-taxi-production.up.railway.app/api/drivers/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${customToken}`,
        'Content-Type': 'application/json',
        'X-App-Version': '1.0.0',
        'X-Platform': 'ReactNative',
        'X-Environment': 'development',
      },
    });
    
    if (driverCheckResponse.ok) {
      console.log('[createDriver] ✅ Driver already exists, skipping creation');
      setDriverCreated(true);
      return;
    } else if (driverCheckResponse.status === 404) {
      console.log('[createDriver] Driver not found, proceeding with creation...');
    } else {
      console.log('[createDriver] Driver check response:', driverCheckResponse.status);
    }

    // 4. Prepare form data for driver creation
    const formData = new FormData();
    formData.append('clerkUserId', user.id);
    formData.append('firstName', user.firstName || '');
    formData.append('lastName', user.lastName || '');
    
    // Fix phone number format - remove country code
    let phoneNumber = user.phoneNumbers?.[0]?.phoneNumber || '';
    if (phoneNumber.startsWith('+91')) {
      phoneNumber = phoneNumber.substring(3); // Remove +91 prefix
    }
    formData.append('phoneNumber', phoneNumber);
    formData.append('userType', 'driver');
    
    console.log('[createDriver] FormData prepared:', {
      clerkUserId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: phoneNumber,
      userType: 'driver',
    });

    // 5. Call /api/registration/driver endpoint
    console.log('[createDriver] Sending POST request to /api/registration/driver...');
    const response = await fetch('https://bike-taxi-production.up.railway.app/api/registration/driver', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customToken}`,
        // Do NOT set Content-Type for multipart/form-data
      },
      body: formData,
    });
    
    console.log('[createDriver] Response received. Status:', response.status);

    // 6. Handle response
    const rawText = await response.text();
    console.log('[createDriver] Raw response text:', rawText);

    let data = null;
    if (rawText) {
      try {
        data = JSON.parse(rawText);
        console.log('[createDriver] Parsed JSON:', data);
      } catch (jsonErr) {
        console.error('[createDriver] Failed to parse response as JSON:', jsonErr);
      }
    }

    if (response.ok && data?.driverId) {
      console.log('[createDriver] ✅ Driver created successfully!');
      console.log('[createDriver] Driver ID:', data.driverId);
      console.log('[createDriver] Clerk User ID:', data.clerkUserId);
      console.log('[createDriver] Status:', data.status);
      
      // Force JWT regeneration to get updated userType claim
      console.log('[createDriver] 🔄 Forcing JWT regeneration after driver creation...');
      try {
        const updatedToken = await getToken({ template: 'driver_app_token', skipCache: true });
        console.log('[createDriver] ✅ JWT regenerated with updated userType claim');
        
        // Add a small delay to ensure backend has time to update User entity
        console.log('[createDriver] ⏳ Waiting 2 seconds for backend to update User entity...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (jwtError) {
        console.error('[createDriver] ⚠️ JWT regeneration failed:', jwtError);
      }
      
      // Save the driver ID to AsyncStorage
      try {
        await AsyncStorage.setItem('driverId', data.driverId);
        await AsyncStorage.setItem('clerkDriverId', data.clerkUserId);
        console.log('[createDriver] Driver ID saved to AsyncStorage:', data.driverId);
      } catch (e) {
        console.error('[createDriver] Failed to save driver ID to AsyncStorage:', e);
      }
      
      setDriverCreated(true);
    } else if (response.status === 400 && data?.error?.includes('already exists')) {
      console.log('[createDriver] ⚠️ Driver already exists, this is normal');
      setDriverCreated(true);
    } else {
      console.error('[createDriver] ❌ Failed to create driver');
      console.error('[createDriver] Response status:', response.status);
      console.error('[createDriver] Response data:', data);
    }
  } catch (error) {
    console.error('[createDriver] Error during driver creation:', error);
  }
};
```

---

## Authentication & Security

### Clerk Authentication

- **Provider**: [Clerk](https://clerk.dev/) for authentication
- **JWT Template**: `driver_app_token`
- **Token Claims**: `firstName`, `lastName`, `phoneNumber`, `userType: 'driver'`

### JWT Token Generation

```typescript
const customToken = await getToken({ template: 'driver_app_token' });
```

### Security Headers

```typescript
{
  'Authorization': `Bearer ${customToken}`,
  'X-App-Version': '1.0.0',
  'X-Platform': 'ReactNative',
  'X-Environment': 'development'
}
```

---

## Error Handling

### Common Error Scenarios

1. **400 Error - Driver Already Exists**
   ```typescript
   if (response.status === 400 && data?.error?.includes('already exists')) {
     console.log('[createDriver] ⚠️ Driver already exists, this is normal');
     setDriverCreated(true);
   }
   ```

2. **404 Error - Driver Not Found**
   ```typescript
   if (driverCheckResponse.status === 404) {
     console.log('[createDriver] Driver not found, proceeding with creation...');
   }
   ```

3. **Network Errors**
   - Retry logic implementation
   - User-friendly error messages
   - Console logging for debugging

### Error Response Structure

```typescript
{
  "error": "string",
  "message": "string",
  "statusCode": number
}
```

---

## Data Storage

### Clerk Storage

**User Metadata**:
```typescript
{
  email: string,
  dob: string, // ISO date string
  gender: string,
  bikeFrontPhoto: string,
  bikeBackPhoto: string,
  licensePhoto: string,
  rcPhoto: string,
  aadharPhoto: string,
  panPhoto: string,
  type: 'driver'
}
```

### AsyncStorage

**Local Storage Keys**:
- `driverId`: Backend driver ID
- `clerkDriverId`: Clerk user ID
- `clerkUserId`: Clerk user ID (alternative)

### Backend Storage

**Driver Record**:
- Driver ID
- Clerk User ID
- Personal information
- Document references
- Status (PENDING_VERIFICATION, ACTIVE, SUSPENDED)
- Location data
- Ride history

---

## Response Structure

### Success Response

```typescript
{
  "driverId": "string",
  "clerkUserId": "string", 
  "status": "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED",
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string",
  "createdAt": "string", // ISO date string
  "updatedAt": "string"  // ISO date string
}
```

### Error Response

```typescript
{
  "error": "string",
  "message": "string",
  "statusCode": number,
  "timestamp": "string"
}
```

---

## Important Notes

### 1. Idempotency
- The endpoint can be called multiple times safely
- Duplicate calls return existing driver data
- No side effects from repeated calls

### 2. Document Upload
- Documents are stored in Clerk metadata
- Not sent to `/api/registration/driver` endpoint
- Separate document verification process

### 3. JWT Regeneration
- After successful creation, JWT is regenerated
- Includes updated userType claims
- 2-second delay for backend synchronization

### 4. Status Management
- Driver status starts as `PENDING_VERIFICATION`
- Admin approval required for `ACTIVE` status
- Document verification affects status

### 5. Phone Number Format
- **Input**: `+91XXXXXXXXXX` (with country code)
- **Backend**: `XXXXXXXXXX` (without country code)
- **Validation**: Must be 10 digits

### 6. Location Updates
- Driver location updated separately via `/api/drivers/me/location`
- Real-time location tracking
- Required for ride matching

### 7. Age Validation
- Minimum age: 18 years
- Calculated from date of birth
- Enforced in DocumentUploadScreen

### 8. Required Fields
- All personal information fields
- All document uploads
- Terms and conditions acceptance

---

## Testing Checklist

### Pre-Registration
- [ ] User can navigate through all screens
- [ ] OTP verification works correctly
- [ ] Document uploads function properly
- [ ] Age validation works (18+ requirement)

### Registration Process
- [ ] `/api/users/me` endpoint called successfully
- [ ] Driver existence check works
- [ ] `/api/registration/driver` endpoint called with correct data
- [ ] Phone number format conversion works
- [ ] JWT token generation and usage

### Post-Registration
- [ ] Driver ID saved to AsyncStorage
- [ ] JWT regeneration successful
- [ ] User navigated to HomeScreen
- [ ] Driver status properly set

### Error Scenarios
- [ ] Network errors handled gracefully
- [ ] Duplicate registration handled
- [ ] Invalid data validation
- [ ] Missing required fields

---

## Troubleshooting

### Common Issues

1. **JWT Token Issues**
   - Ensure `driver_app_token` template exists
   - Check token expiration
   - Verify token claims

2. **Phone Number Format**
   - Remove country code (+91)
   - Ensure 10-digit format
   - Validate phone number

3. **Document Upload Failures**
   - Check file size limits
   - Verify image formats
   - Ensure all required documents uploaded

4. **Network Errors**
   - Check internet connectivity
   - Verify API endpoint availability
   - Review request headers

### Debug Logging

The implementation includes comprehensive logging:
- Request/response details
- Error messages
- Process flow tracking
- Data validation results

---

## Future Enhancements

### Potential Improvements

1. **Offline Support**
   - Queue registration requests
   - Sync when online

2. **Progressive Document Upload**
   - Upload documents as user progresses
   - Reduce final submission time

3. **Enhanced Validation**
   - Real-time field validation
   - Document quality checks
   - OCR for document data extraction

4. **Status Tracking**
   - Real-time verification status
   - Push notifications for status changes
   - Document approval tracking

---

*This documentation covers the complete driver registration flow as implemented in the RiderSony driver app. For technical support or questions, refer to the development team.*
