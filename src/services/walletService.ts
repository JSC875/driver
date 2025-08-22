import { useAuth } from '@clerk/clerk-expo';

export interface WalletBalanceResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    balance?: number;
    rideEarnings?: number;
    totalEarnings?: number;
    currency?: string;
    lastUpdated?: string;
    // For recharge order response
    orderId?: string;
    keyId?: string;
    amount?: number;
    // For callback response
    paymentId?: string;
    driverId?: string;
  };
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  time: string;
  category: string;
  transactionId?: string;
}

export interface WalletTransactionsResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: WalletTransaction[];
}

class WalletService {
  private baseUrl = 'https://bike-taxi-production.up.railway.app';

  private async getBackendDriverId(token: string): Promise<string> {
    try {
      console.log('🔍 Getting backend driver ID...');
      console.log('📍 Endpoint:', `${this.baseUrl}/api/drivers/me`);
      
      const response = await fetch(`${this.baseUrl}/api/drivers/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-App-Version': '1.0.0',
          'X-Platform': 'ReactNative',
          'X-Environment': 'development',
        },
      });

      console.log('📡 API Response Status:', response.status);
      console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to get driver profile:', response.status);
        console.error('❌ Full Error Response:', JSON.stringify(errorData, null, 2));
        throw new Error(`Failed to get driver profile: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Backend driver ID obtained:', data.id);
      console.log('📊 Full Driver Profile Data:', JSON.stringify(data, null, 2));
      return data.id;
    } catch (error) {
      console.error('❌ Error getting backend driver ID:', error);
      // Fallback to known backend driver ID if API fails
      console.log('🔄 Using fallback backend driver ID');
      return '943742b3-259e-45a3-801e-f5d98637cda6';
    }
  }

  async getWalletBalance(driverId: string, token?: string): Promise<WalletBalanceResponse> {
    try {
      if (!token) {
        throw new Error('No authentication token provided');
      }

      // Get the backend driver ID from the API
      const backendDriverId = await this.getBackendDriverId(token);
      
      console.log('💰 Fetching wallet balance via API...');
      console.log('📍 Endpoint:', `${this.baseUrl}/api/wallet/${backendDriverId}/balance`);
      console.log('🕐 API call timestamp:', new Date().toISOString());
      console.log('🆔 Clerk Driver ID:', driverId);
      console.log('🆔 Backend Driver ID:', backendDriverId);
      console.log('🔑 Token (first 20 chars):', token.substring(0, 20) + '...');

      const response = await fetch(`${this.baseUrl}/api/wallet/${backendDriverId}/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-App-Version': '1.0.0',
          'X-Platform': 'ReactNative',
          'X-Environment': 'development',
        },
      });

      console.log('📡 API Response Status:', response.status);
      console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error Response:', errorData);
        console.error('❌ API Status:', response.status);
        console.error('❌ API Status Text:', response.statusText);
        console.error('❌ Full Error Response:', JSON.stringify(errorData, null, 2));
        throw new Error(`API request failed: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Wallet balance fetched successfully via API');
      console.log('📊 Full Response Data:', JSON.stringify(data, null, 2));

      return {
        success: true,
        data: data,
        message: 'Wallet balance fetched successfully'
      };
    } catch (error) {
      console.error('❌ Error fetching wallet balance via API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch wallet balance'
      };
    }
  }

  async getWalletTransactions(driverId: string, token?: string): Promise<WalletTransactionsResponse> {
    try {
      if (!token) {
        throw new Error('No authentication token provided');
      }

      // Get the backend driver ID from the API
      const backendDriverId = await this.getBackendDriverId(token);

      console.log('📋 Fetching wallet transactions via API...');
      console.log('📍 Endpoint:', `${this.baseUrl}/api/wallet/${backendDriverId}/transactions`);
      console.log('🕐 API call timestamp:', new Date().toISOString());
      console.log('🆔 Clerk Driver ID:', driverId);
      console.log('🆔 Backend Driver ID:', backendDriverId);

      const response = await fetch(`${this.baseUrl}/api/wallet/${backendDriverId}/transactions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-App-Version': '1.0.0',
          'X-Platform': 'ReactNative',
          'X-Environment': 'development',
        },
      });

      console.log('📡 API Response Status:', response.status);
      console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error Response:', errorData);
        console.error('❌ API Status:', response.status);
        console.error('❌ API Status Text:', response.statusText);
        console.error('❌ Full Error Response:', JSON.stringify(errorData, null, 2));
        throw new Error(`API request failed: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Wallet transactions fetched successfully via API');
      console.log('📊 Full Response Data:', JSON.stringify(data, null, 2));

      return {
        success: true,
        data: data,
        message: 'Wallet transactions fetched successfully'
      };
    } catch (error) {
      console.error('❌ Error fetching wallet transactions via API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch wallet transactions'
      };
    }
  }

  async withdrawFunds(driverId: string, amount: number, token?: string): Promise<WalletBalanceResponse> {
    try {
      if (!token) {
        throw new Error('No authentication token provided');
      }

      if (!amount || amount <= 0) {
        throw new Error('Valid withdrawal amount is required');
      }

      // Get the backend driver ID from the API
      const backendDriverId = await this.getBackendDriverId(token);

      console.log('💸 Processing withdrawal via API...');
      console.log('📍 Endpoint:', `${this.baseUrl}/api/wallet/${backendDriverId}/withdraw`);
      console.log('🕐 API call timestamp:', new Date().toISOString());
      console.log('🆔 Clerk Driver ID:', driverId);
      console.log('🆔 Backend Driver ID:', backendDriverId);
      console.log('💰 Amount:', amount);

      const response = await fetch(`${this.baseUrl}/api/wallet/${backendDriverId}/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-App-Version': '1.0.0',
          'X-Platform': 'ReactNative',
          'X-Environment': 'development',
        },
        body: JSON.stringify({ amount }),
      });

      console.log('📡 API Response Status:', response.status);
      console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error Response:', errorData);
        console.error('❌ API Status:', response.status);
        console.error('❌ API Status Text:', response.statusText);
        console.error('❌ Full Error Response:', JSON.stringify(errorData, null, 2));
        throw new Error(`API request failed: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Withdrawal processed successfully via API');
      console.log('📊 Full Response Data:', JSON.stringify(data, null, 2));

      return {
        success: true,
        data: data,
        message: 'Withdrawal processed successfully'
      };
    } catch (error) {
      console.error('❌ Error processing withdrawal via API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to process withdrawal'
      };
    }
  }

  async createRechargeOrder(driverId: string, amount: number, token?: string): Promise<WalletBalanceResponse> {
    try {
      if (!token) {
        throw new Error('No authentication token provided');
      }

      if (!amount || amount <= 0) {
        throw new Error('Valid recharge amount is required');
      }

      // Get the backend driver ID from the API
      const backendDriverId = await this.getBackendDriverId(token);

      console.log('💰 Creating wallet recharge order via API...');
      console.log('📍 Endpoint:', `${this.baseUrl}/api/wallet/recharge`);
      console.log('🕐 API call timestamp:', new Date().toISOString());
      console.log('🆔 Clerk Driver ID:', driverId);
      console.log('🆔 Backend Driver ID:', backendDriverId);
      console.log('💰 Amount:', amount);

      const response = await fetch(`${this.baseUrl}/api/wallet/recharge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-App-Version': '1.0.0',
          'X-Platform': 'ReactNative',
          'X-Environment': 'development',
        },
        body: JSON.stringify({ 
          driverId: backendDriverId,
          amount 
        }),
      });

      console.log('📡 API Response Status:', response.status);
      console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error Response:', errorData);
        console.error('❌ API Status:', response.status);
        console.error('❌ API Status Text:', response.statusText);
        console.error('❌ Full Error Response:', JSON.stringify(errorData, null, 2));
        throw new Error(`API request failed: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Wallet recharge order created successfully via API');
      console.log('📊 Full Response Data:', JSON.stringify(data, null, 2));

      return {
        success: true,
        data: data,
        message: 'Wallet recharge order created successfully'
      };
    } catch (error) {
      console.error('❌ Error creating wallet recharge order via API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to create wallet recharge order'
      };
    }
  }

  async processRechargeCallback(driverId: string, paymentId: string, orderId: string, signature: string, token?: string): Promise<WalletBalanceResponse> {
    try {
      if (!token) {
        throw new Error('No authentication token provided');
      }

      // Get the backend driver ID from the API
      const backendDriverId = await this.getBackendDriverId(token);

      console.log('💰 Processing wallet recharge callback via API...');
      console.log('📍 Endpoint:', `${this.baseUrl}/api/wallet/recharge/callback`);
      console.log('🕐 API call timestamp:', new Date().toISOString());
      console.log('🆔 Clerk Driver ID:', driverId);
      console.log('🆔 Backend Driver ID:', backendDriverId);
      console.log('💳 Payment ID:', paymentId);
      console.log('📋 Order ID:', orderId);

      const response = await fetch(`${this.baseUrl}/api/wallet/recharge/callback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-App-Version': '1.0.0',
          'X-Platform': 'ReactNative',
          'X-Environment': 'development',
        },
        body: JSON.stringify({ 
          driverId: backendDriverId,
          paymentId,
          orderId,
          signature
        }),
      });

      console.log('📡 API Response Status:', response.status);
      console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error Response:', errorData);
        console.error('❌ API Status:', response.status);
        console.error('❌ API Status Text:', response.statusText);
        console.error('❌ Full Error Response:', JSON.stringify(errorData, null, 2));
        throw new Error(`API request failed: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Wallet recharge callback processed successfully via API');
      console.log('📊 Full Response Data:', JSON.stringify(data, null, 2));

      return {
        success: true,
        data: data,
        message: 'Wallet recharge callback processed successfully'
      };
    } catch (error) {
      console.error('❌ Error processing wallet recharge callback via API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to process wallet recharge callback'
      };
    }
  }
}

export const walletService = new WalletService();
