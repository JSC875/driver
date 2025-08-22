import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { walletService } from '../../services/walletService';
import { useAuth } from '@clerk/clerk-expo';

export default function WalletAPITest({ onBack }: { onBack?: () => void }) {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testWalletAPI = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addLog('🔍 Starting wallet API test...');
      
      // Get token
      const token = await getToken({ template: 'driver_app_token' });
      if (!token) {
        addLog('❌ No authentication token available');
        return;
      }
      addLog('✅ Token obtained successfully');
      addLog(`🔑 Token preview: ${token.substring(0, 20)}...`);
      
      // Test driver ID
      const driverId = 'test-driver-id';
      addLog(`🆔 Using driver ID: ${driverId}`);
      
      // Test wallet balance
      addLog('💰 Testing wallet balance API...');
      const balanceResponse = await walletService.getWalletBalance(driverId, token);
      addLog(`📊 Balance response success: ${balanceResponse.success}`);
      if (balanceResponse.error) {
        addLog(`❌ Balance error: ${balanceResponse.error}`);
      } else {
        addLog(`✅ Balance data: ${JSON.stringify(balanceResponse.data, null, 2)}`);
      }
      
             // Test wallet transactions
       addLog('📋 Testing wallet transactions API...');
       const transactionsResponse = await walletService.getWalletTransactions(driverId, token);
       addLog(`📊 Transactions response success: ${transactionsResponse.success}`);
       if (transactionsResponse.error) {
         addLog(`❌ Transactions error: ${transactionsResponse.error}`);
       } else {
         addLog(`✅ Transactions data: ${JSON.stringify(transactionsResponse.data, null, 2)}`);
         if (transactionsResponse.data) {
           addLog(`📊 Transactions count: ${transactionsResponse.data.transactions?.length || 0}`);
           addLog(`📊 Total transactions: ${transactionsResponse.data.totalTransactions || 0}`);
           addLog(`📊 API status: ${transactionsResponse.data.status || 'unknown'}`);
         }
       }
      
      addLog('✅ API test completed');
      
    } catch (error) {
      addLog(`❌ Test failed with error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Wallet API Test</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testWalletAPI}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Wallet API'}
        </Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.logsContainer}>
        {testResults.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 5,
  },
});
