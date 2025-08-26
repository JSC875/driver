# Receipt Download Feature

## Overview
The receipt download feature allows users to download ride receipts as HTML files that can be shared, printed, or saved for record-keeping purposes.

## Features
- **HTML Receipt Generation**: Creates beautifully formatted HTML receipts with ride details
- **Download & Share**: Uses Expo's file system and sharing APIs to download and share receipts
- **Multiple Locations**: Available in Ride Summary, Transaction History, and Ride History screens
- **Professional Design**: Clean, branded receipt design with all essential ride information

## Implementation Details

### Core Components

#### 1. Receipt Generator Utility (`src/utils/receiptGenerator.ts`)
- `generateReceiptHTML()`: Creates HTML content for receipts
- `downloadReceipt()`: Handles file creation and sharing
- `generateReceiptData()`: Converts ride data to receipt format

#### 2. Receipt Data Interface
```typescript
interface ReceiptData {
  rideId: string;
  date: string;
  time: string;
  pickupLocation: string;
  destination: string;
  distance: string;
  duration: string;
  fare: string;
  driverName: string;
  vehicleModel: string;
  vehicleNumber: string;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
}
```

### Receipt Content
Each receipt includes:
- **Header**: Roqet branding and receipt title
- **Ride Details**: Ride ID, date, and time
- **Route Information**: Pickup and destination addresses
- **Trip Statistics**: Distance and duration
- **Driver Information**: Driver name, vehicle model, and number
- **Payment Summary**: Fare breakdown and total amount
- **Footer**: Thank you message and support contact

### Integration Points

#### 1. Ride Summary Screen (`src/screens/ride/RideSummaryScreen.tsx`)
- Download button appears after ride completion
- Uses actual ride data from the completed trip
- Positioned below the "Submit Feedback" button

#### 2. Transaction Detail Screen (`src/screens/profile/TransactionDetailScreen.tsx`)
- Download button in transaction detail modal
- Uses transaction data to generate receipt
- Available for all transaction types

#### 3. Ride History Screen (`src/screens/profile/RideHistoryScreen.tsx`)
- Download icon on each completed ride card
- Uses historical ride data
- Only available for completed rides (not cancelled)

## Technical Implementation

### Dependencies
```json
{
  "expo-file-system": "~18.1.11",
  "expo-sharing": "latest",
  "react-native-html-to-pdf": "latest"
}
```

### File Flow
1. **HTML Generation**: Creates formatted HTML with CSS styling
2. **File Creation**: Writes HTML to temporary file using `expo-file-system`
3. **Sharing**: Uses `expo-sharing` to open native share dialog
4. **Cleanup**: Automatically deletes temporary file after sharing

### Error Handling
- Checks for sharing availability
- Handles file system errors
- Provides user feedback via alerts
- Graceful fallback for unsupported devices

## Usage Examples

### Basic Usage
```typescript
import { downloadReceipt, generateReceiptData } from '../../utils/receiptGenerator';

const handleDownload = async () => {
  const receiptData = generateReceiptData(rideData, driverData);
  const success = await downloadReceipt(receiptData);
  
  if (success) {
    // Show success message
  } else {
    // Show error message
  }
};
```

### Custom Receipt Data
```typescript
const receiptData = {
  rideId: 'RIDE_123',
  date: '2024-01-15',
  time: '14:30',
  pickupLocation: '123 Main St',
  destination: '456 Oak Ave',
  distance: '5.2 km',
  duration: '18 min',
  fare: '150',
  driverName: 'John Driver',
  vehicleModel: 'Honda Activa',
  vehicleNumber: 'MH12AB1234',
  paymentMethod: 'Cash'
};
```

## Styling
The receipt uses a clean, professional design with:
- **Color Scheme**: Roqet brand colors (blue gradient header)
- **Typography**: System fonts for optimal readability
- **Layout**: Responsive design that works on various screen sizes
- **Visual Elements**: Icons, dots for route visualization, and proper spacing

## Testing
A test component (`src/components/common/ReceiptDownloadTest.tsx`) is available for testing the functionality with sample data.

## Future Enhancements
- PDF generation support
- Email integration
- Receipt templates customization
- Offline receipt storage
- Receipt history management

## Troubleshooting
- **Sharing not available**: Check device compatibility
- **File creation fails**: Verify file system permissions
- **HTML rendering issues**: Test on different devices
- **Memory issues**: Ensure proper cleanup of temporary files
