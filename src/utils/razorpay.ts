// Import RazorpayCheckout with proper error handling for Expo
let RazorpayCheckout: any = null;

// Enhanced import with multiple fallback methods
const importRazorpay = () => {
  try {
    // Method 1: Direct require
    const razorpay = require('react-native-razorpay');
    if (razorpay && razorpay.default) {
      return razorpay.default;
    }
    if (razorpay && razorpay.open) {
      return razorpay;
    }
    return razorpay;
  } catch (error) {
    console.error('❌ Method 1 failed:', error);
    
    try {
      // Method 2: Dynamic import
      const razorpay = require('react-native-razorpay').default;
      return razorpay;
    } catch (altError) {
      console.error('❌ Method 2 failed:', altError);
      
      try {
        // Method 3: Try with different path
        const razorpay = require('react-native-razorpay/index');
        return razorpay.default || razorpay;
      } catch (thirdError) {
        console.error('❌ Method 3 failed:', thirdError);
        return null;
      }
    }
  }
};

RazorpayCheckout = importRazorpay();

// Development mode check
const isDevelopment = __DEV__;

// Payment result types
export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
  message?: string;
}

// Payment options interface for direct payment
export interface PaymentOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    email?: string;
    contact?: string;
    name?: string;
  };
  theme: {
    color: string;
  };
  handler: (response: any) => void;
  modal: {
    ondismiss: () => void;
  };
}

// Amount conversion utilities
export const convertRupeesToPaise = (rupees: number): number => {
  return Math.round(rupees * 100);
};

export const convertPaiseToRupees = (paise: number): number => {
  return paise / 100;
};

export const ensureAmountInPaise = (amount: number, isAlreadyInPaise: boolean = false): number => {
  // If explicitly told the amount is already in paise, don't convert
  if (isAlreadyInPaise) {
    console.log(`💰 Amount ${amount} is already in paise (₹${amount / 100})`);
    return amount;
  }
  
  // Check if this looks like a typical rupee amount for rides (small numbers)
  const typicalRupeeAmounts = [50, 100, 150, 200, 250, 300, 500, 750, 1000];
  
  if (typicalRupeeAmounts.includes(amount)) {
    // This looks like a rupee amount, convert to paise
    console.log(`💰 Converting ₹${amount} to ${amount * 100} paise`);
    return amount * 100;
  }
  
  // For amounts like 7300, 5000, 10000, etc., assume they're already in paise
  // This is the normal case from the ride flow
  console.log(`💰 Amount ${amount} is already in paise (₹${amount / 100})`);
  return amount;
};

export const formatAmountForDisplay = (amount: number, currency: string = 'INR'): string => {
  const rupees = convertPaiseToRupees(amount);
  return `${currency} ${rupees.toFixed(2)}`;
};

import Constants from 'expo-constants';

// Get environment variables from Constants
const getEnvVar = (key: string, fallback?: string): string => {
  return Constants.expoConfig?.extra?.[key] || process.env[key] || fallback || '';
};

// Razorpay configuration
export const RAZORPAY_CONFIG = {
  // Live keys for production
  live: {
    key: getEnvVar('EXPO_PUBLIC_RAZORPAY_LIVE_KEY', 'rzp_live_AEcWKhM01jAKqu'),
    secret: getEnvVar('EXPO_PUBLIC_RAZORPAY_LIVE_SECRET', 'N89cllTVPqHC6CzDCXHlZhxM'),
  },
};

// Get Razorpay key for client-side usage
export const getRazorpayKey = (): string => {
  const config = RAZORPAY_CONFIG.live;
  return config.key;
};

// Check if using live keys
export const isUsingLiveKeys = (): boolean => {
  return getRazorpayKey().startsWith('rzp_live_');
};

// Payment configuration
export const PAYMENT_CONFIG = {
  currency: 'INR',
  name: 'Roqet Bike Taxi',
  description: 'Wallet recharge',
  theme: {
    color: '#007AFF',
  },
  // Payment methods to enable
  paymentMethods: {
    card: true,
    netbanking: true,
    upi: true,
    wallet: true,
    emi: true,
  },
  // Prefill options
  prefill: {
    email: '', // Will be set dynamically
    contact: '', // Will be set dynamically
    name: '', // Will be set dynamically
  },
  // Modal options
  modal: {
    ondismiss: () => {
      if (isDevelopment) {
        console.log('Payment modal dismissed');
      }
    },
  },
};

// Check if Razorpay is available
export const isRazorpayAvailable = (): boolean => {
  return RazorpayCheckout !== null && typeof RazorpayCheckout !== 'undefined' && RazorpayCheckout.open !== undefined;
};

// Get payment warning message
export const getPaymentWarningMessage = (): string => {
  if (isUsingLiveKeys()) {
    return '⚠️ LIVE PAYMENTS ENABLED - Real money will be charged!';
  }
  return '⚠️ TEST MODE - No real money will be charged';
};

// Validation functions
export const validateRazorpayKey = (key: string): boolean => {
  return Boolean(key && key.startsWith('rzp_') && key.length > 10);
};

export const validatePaymentAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000000; // Max 10 lakh rupees
};

// Error messages
export const RAZORPAY_ERROR_MESSAGES = {
  INVALID_KEY: 'Invalid Razorpay key configuration',
  INVALID_AMOUNT: 'Invalid payment amount',
  NETWORK_ERROR: 'Network error occurred during payment',
  PAYMENT_CANCELLED: 'Payment was cancelled by user',
  PAYMENT_FAILED: 'Payment failed. Please try again',
  VERIFICATION_FAILED: 'Payment verification failed',
  ORDER_CREATION_FAILED: 'Failed to create payment order',
  LIVE_PAYMENT_WARNING: '⚠️ This is a REAL payment that will charge your account',
};

// Initialize Razorpay payment with order data
export const initializePayment = async (options: PaymentOptions): Promise<PaymentResult> => {
  try {
    if (isDevelopment) {
      console.log('💰 Initializing Razorpay payment...');
      console.log('📋 Payment options:', options);
      console.log('🔧 Using live keys:', isUsingLiveKeys());
      console.log('⚠️ Warning:', getPaymentWarningMessage());
      console.log('💰 Amount in paise:', options.amount);
      console.log('💰 Amount in rupees:', convertPaiseToRupees(options.amount));
    }

    // Check if Razorpay is available

    
    // Always use WebView implementation for now since native SDK is not properly linked
    console.log('🌐 Using WebView implementation for Razorpay (native SDK not available)');
    return {
      success: false,
      error: 'USE_WEBVIEW',
      message: 'Use WebView implementation',
    };

    if (isDevelopment) {
      console.log('🔧 Razorpay options:', options);
    }

    // Skip native SDK validation since we're using WebView
    
    // Native SDK call removed - using WebView only

  } catch (error: any) {
    if (isDevelopment) {
      console.error('❌ Payment error:', error);
    }

    // Handle specific Razorpay errors
    if (error && error.code) {
      switch (error.code) {
        case 'PAYMENT_CANCELLED':
          return {
            success: false,
            error: 'Payment was cancelled by user',
            message: 'Payment cancelled',
          };
        case 'NETWORK_ERROR':
          return {
            success: false,
            error: 'Network error occurred during payment',
            message: 'Network error',
          };
        default:
          return {
            success: false,
            error: error.description || error.message || 'Payment failed',
            message: 'Payment failed',
          };
      }
    }
    
    return {
      success: false,
      error: error.message || 'Payment failed',
      message: 'Payment failed',
    };
  }
};
