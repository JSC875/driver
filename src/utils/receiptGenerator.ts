import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export interface ReceiptData {
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

export const generateReceiptHTML = (data: ReceiptData): string => {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ride Receipt</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
            color: #333;
        }
        .receipt-container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #007AFF, #0056CC);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .subtitle {
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 20px;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #007AFF;
            margin-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 5px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .label {
            color: #666;
            font-weight: 500;
        }
        .value {
            color: #333;
            font-weight: 600;
        }
        .route-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .route-point {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        .route-point:last-child {
            margin-bottom: 0;
        }
        .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 10px;
        }
        .pickup-dot {
            background: #007AFF;
        }
        .destination-dot {
            background: #FF6B35;
        }
        .payment-summary {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
        }
        .total-row {
            border-top: 2px solid #e0e0e0;
            padding-top: 10px;
            margin-top: 10px;
            font-size: 16px;
            font-weight: bold;
        }
        .footer {
            background: #f8f9fa;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e0e0e0;
        }
        .thank-you {
            font-size: 14px;
            font-weight: 600;
            color: #007AFF;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <div class="logo">Roqet</div>
            <div class="subtitle">Ride Receipt</div>
        </div>
        
        <div class="content">
            <div class="section">
                <div class="section-title">Ride Details</div>
                <div class="info-row">
                    <span class="label">Ride ID:</span>
                    <span class="value">${data.rideId}</span>
                </div>
                <div class="info-row">
                    <span class="label">Date:</span>
                    <span class="value">${data.date}</span>
                </div>
                <div class="info-row">
                    <span class="label">Time:</span>
                    <span class="value">${data.time}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Route Information</div>
                <div class="route-info">
                    <div class="route-point">
                        <div class="dot pickup-dot"></div>
                        <div>
                            <div style="font-weight: 600; color: #007AFF;">Pickup</div>
                            <div style="font-size: 13px; color: #666;">${data.pickupLocation}</div>
                        </div>
                    </div>
                    <div class="route-point">
                        <div class="dot destination-dot"></div>
                        <div>
                            <div style="font-weight: 600; color: #FF6B35;">Destination</div>
                            <div style="font-size: 13px; color: #666;">${data.destination}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Trip Statistics</div>
                <div class="info-row">
                    <span class="label">Distance:</span>
                    <span class="value">${data.distance}</span>
                </div>
                <div class="info-row">
                    <span class="label">Duration:</span>
                    <span class="value">${data.duration}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Driver Information</div>
                <div class="info-row">
                    <span class="label">Driver:</span>
                    <span class="value">${data.driverName}</span>
                </div>
                <div class="info-row">
                    <span class="label">Vehicle:</span>
                    <span class="value">${data.vehicleModel}</span>
                </div>
                <div class="info-row">
                    <span class="label">Vehicle No:</span>
                    <span class="value">${data.vehicleNumber}</span>
                </div>
            </div>

            <div class="payment-summary">
                <div class="section-title">Payment Summary</div>
                <div class="info-row">
                    <span class="label">Ride Fare:</span>
                    <span class="value">₹${data.fare}</span>
                </div>
                <div class="info-row total-row">
                    <span class="label">Total Amount:</span>
                    <span class="value">₹${data.fare}</span>
                </div>
                <div class="info-row" style="margin-top: 10px;">
                    <span class="label">Payment Method:</span>
                    <span class="value">${data.paymentMethod}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="thank-you">Thank you for choosing Roqet!</div>
            <div>Generated on ${currentDate} at ${currentTime}</div>
            <div style="margin-top: 10px;">
                For support, contact us at support@roqet.com
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

export const downloadReceipt = async (data: ReceiptData): Promise<boolean> => {
  try {
    // Generate HTML content
    const htmlContent = generateReceiptHTML(data);
    
    // Create a temporary file path
    const fileName = `receipt_${data.rideId}_${Date.now()}.html`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    
    // Write HTML content to file
    await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    // Check if sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();
    
    if (isSharingAvailable) {
      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/html',
        dialogTitle: 'Download Ride Receipt',
        UTI: 'public.html',
      });
      
      // Clean up the temporary file after sharing
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(fileUri);
        } catch (error) {
          console.log('Error deleting temporary file:', error);
        }
      }, 5000);
      
      return true;
    } else {
      console.log('Sharing is not available on this device');
      return false;
    }
  } catch (error) {
    console.error('Error generating receipt:', error);
    return false;
  }
};

export const generateReceiptData = (
  rideData: any,
  driverData: any,
  customerData?: any
): ReceiptData => {
  const now = new Date();
  
  return {
    rideId: rideData.rideId || `RIDE_${Date.now()}`,
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    pickupLocation: rideData.pickupAddress || 'Your pickup location',
    destination: rideData.dropoffAddress || 'Destination',
    distance: rideData.distance || '5 km',
    duration: rideData.duration || '15 min',
    fare: rideData.price || '100',
    driverName: driverData?.name || 'Driver Name',
    vehicleModel: driverData?.vehicleModel || 'Vehicle Model',
    vehicleNumber: driverData?.vehicleNumber || 'Vehicle Number',
    paymentMethod: rideData.paymentMethod || 'Cash',
    customerName: customerData?.name,
    customerPhone: customerData?.phone,
  };
};
