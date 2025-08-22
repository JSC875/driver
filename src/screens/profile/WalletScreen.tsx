import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { mockPaymentMethods } from '../../data/mockData';
import Button from '../../components/common/Button';
import { useAuth } from '@clerk/clerk-expo';
import { socketManager } from '../../utils/socket';
import { walletService, WalletTransaction } from '../../services/walletService';
import { getUserIdFromJWT } from '../../utils/jwtDecoder';
import { initializePayment, PaymentOptions, convertRupeesToPaise, getRazorpayKey, PAYMENT_CONFIG } from '../../utils/razorpay';
import RazorpayWebView from '../../components/payment/RazorpayWebView';

const { width } = Dimensions.get('window');

// Enhanced wallet transactions with real data structure
const initialWalletTransactions = [
  {
    id: 'initial-1',
    type: 'credit',
    amount: 500,
    description: 'Wallet top-up',
    date: '2024-01-15',
    time: '10:30 AM',
    category: 'topup'
  },
  {
    id: 'initial-2',
    type: 'credit',
    amount: 85,
    description: 'Ride earnings',
    date: '2024-01-15',
    time: '09:30 AM',
    category: 'ride_earnings'
  },
  {
    id: 'initial-3',
    type: 'credit',
    amount: 50,
    description: 'Referral bonus',
    date: '2024-01-14',
    time: '06:45 PM',
    category: 'bonus'
  },
  {
    id: 'initial-4',
    type: 'debit',
    amount: 200,
    description: 'Withdrawal',
    date: '2024-01-13',
    time: '02:30 PM',
    category: 'withdrawal'
  },
];

export default function WalletScreen({ navigation }: any) {
  const { getToken } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [rideEarnings, setRideEarnings] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [selectedTab, setSelectedTab] = useState('wallet');
  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [showPaymentNotification, setShowPaymentNotification] = useState(false);
  const [lastPaymentAmount, setLastPaymentAmount] = useState(0);
  const [driverId, setDriverId] = useState<string>('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isRecharging, setIsRecharging] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showRazorpayWebView, setShowRazorpayWebView] = useState(false);
  const [webViewOrderData, setWebViewOrderData] = useState<any>(null);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const notificationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
    ]).start();

    // Initialize wallet data and socket connection
    initializeWalletData();
  }, []);

  const initializeWalletData = async () => {
    try {
      setIsInitialLoading(true);
      
      // Get driver ID from JWT
      const userId = await getUserIdFromJWT(getToken);
      setDriverId(userId);
      
      // Fetch wallet balance and transactions
      await fetchWalletData(userId);
      
      // Initialize socket connection
      await initializeSocketConnection();
      
    } catch (error) {
      console.error('❌ WalletScreen: Failed to initialize wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data. Please try again.');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchWalletData = async (driverId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Fetch wallet balance
      const balanceResponse = await walletService.getWalletBalance(driverId, token);
      
      if (balanceResponse.success && balanceResponse.data) {
        setWalletBalance(balanceResponse.data.balance || 0);
        setRideEarnings(balanceResponse.data.rideEarnings || 0);
        setTotalEarnings(balanceResponse.data.totalEarnings || 0);
      } else {
        console.error('❌ WalletScreen: Failed to fetch wallet balance:', balanceResponse.error);
      }

      // Fetch wallet transactions
      const transactionsResponse = await walletService.getWalletTransactions(driverId, token);
      
      if (transactionsResponse.success && transactionsResponse.data) {
        // The API returns { transactions: [], totalTransactions: 0, ... }
        const apiTransactions = (transactionsResponse.data as any).transactions || [];
        
        if (apiTransactions.length > 0) {
          // Ensure all transactions have unique IDs
          const transactionsWithIds = apiTransactions.map((transaction: any, index: number) => ({
            ...transaction,
            id: transaction.id || `api-transaction-${index}-${Date.now()}`,
            type: transaction.type as 'credit' | 'debit'
          })) as WalletTransaction[];
          setTransactions(transactionsWithIds);
        } else {
          // Use fallback transactions if API returns empty array
          setTransactions(initialWalletTransactions as WalletTransaction[]);
        }
      } else {
        console.error('❌ WalletScreen: Failed to fetch wallet transactions:', transactionsResponse.error);
        // Fallback to initial transactions if API fails
        setTransactions(initialWalletTransactions as WalletTransaction[]);
      }
      
    } catch (error) {
      console.error('❌ WalletScreen: Error fetching wallet data:', error);
      // Fallback to initial data if API fails
      setWalletBalance(1250);
      setRideEarnings(485);
      setTotalEarnings(1735);
      setTransactions(initialWalletTransactions as WalletTransaction[]);
    }
  };

  const initializeSocketConnection = async () => {
    try {
      // Use socketManager instead of direct functions
      await socketManager.ensureSocketConnected(getToken);
      
      // Listen for payment completed events
      socketManager.onPaymentCompleted((data: any) => {
        console.log('💰 Payment received:', data);
        handlePaymentReceived(data);
      });
    } catch (error) {
      console.error('❌ Failed to initialize socket connection:', error);
    }
  };

  const handlePaymentReceived = async (paymentData: any) => {
    const amount = paymentData.amount || 0;
    
    // Show payment notification immediately
    setLastPaymentAmount(amount);
    setShowPaymentNotification(true);
    
    // Animate notification
    Animated.sequence([
      Animated.timing(notificationAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(notificationAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowPaymentNotification(false);
    });

    // Refresh wallet data from API to get the latest balance
    if (driverId) {
      try {
        await fetchWalletData(driverId);
        console.log('✅ Wallet data refreshed after payment received');
      } catch (error) {
        console.error('❌ Failed to refresh wallet after payment:', error);
        // Fallback: update local state
        setWalletBalance(prev => prev + amount);
        setRideEarnings(prev => prev + amount);
        setTotalEarnings(prev => prev + amount);
        
        // Add new transaction locally
        const newTransaction: WalletTransaction = {
          id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'credit',
          amount: amount,
          description: `Ride payment - ${paymentData.rideId || 'Ride'}`,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: 'ride_earnings'
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
      }
    }
  };

  const handleWithdraw = async () => {
    if (walletBalance <= 0) {
      Alert.alert('Insufficient Balance', 'You need to have money in your wallet to withdraw.');
      return;
    }

    Alert.alert(
      'Withdraw Funds',
      `You have ₹${walletBalance} available for withdrawal. How much would you like to withdraw?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Withdraw All',
          onPress: () => processWithdrawal(walletBalance),
        },
        {
          text: 'Custom Amount',
          onPress: () => showCustomWithdrawalDialog(),
        },
      ]
    );
  };

  const showCustomWithdrawalDialog = () => {
    // For now, we'll use a simple alert with a fixed amount
    // In a real app, you'd use a modal with input field
    Alert.alert(
      'Custom Withdrawal',
      'Enter withdrawal amount (minimum ₹100)',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Withdraw ₹500',
          onPress: () => processWithdrawal(500),
        },
        {
          text: 'Withdraw ₹1000',
          onPress: () => processWithdrawal(1000),
        },
      ]
    );
  };

  const processWithdrawal = async (amount: number) => {
    if (!driverId) {
      Alert.alert('Error', 'Driver ID not available. Please try again.');
      return;
    }

    if (amount > walletBalance) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough balance for this withdrawal.');
      return;
    }

    if (amount < 100) {
      Alert.alert('Minimum Amount', 'Minimum withdrawal amount is ₹100.');
      return;
    }

    setIsWithdrawing(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Process withdrawal via API
      const withdrawalResponse = await walletService.withdrawFunds(driverId, amount, token);
      
      if (withdrawalResponse.success && withdrawalResponse.data) {
        // Update wallet balance with API response
        setWalletBalance(withdrawalResponse.data.balance || 0);
        setRideEarnings(withdrawalResponse.data.rideEarnings || 0);
        setTotalEarnings(withdrawalResponse.data.totalEarnings || 0);
        
        // Add withdrawal transaction to local state
        const newTransaction: WalletTransaction = {
          id: `withdrawal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'debit',
          amount: amount,
          description: 'Withdrawal to bank account',
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: 'withdrawal'
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
        
        Alert.alert(
          'Withdrawal Successful',
          `₹${amount} has been withdrawn to your bank account. It will be credited within 2-3 business days.`
        );
      } else {
        throw new Error(withdrawalResponse.error || 'Withdrawal failed');
      }
      
    } catch (error) {
      console.error('❌ Withdrawal error:', error);
      Alert.alert('Withdrawal Failed', error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const processRecharge = async (amount: number) => {
    if (!driverId) {
      Alert.alert('Error', 'Driver ID not available. Please try again.');
      return;
    }

    if (amount < 100) {
      Alert.alert('Minimum Amount', 'Minimum recharge amount is ₹100.');
      return;
    }

    setIsRecharging(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Step 1: Create recharge order via API
      console.log('💰 Creating recharge order for amount:', amount);
      const orderResponse = await walletService.createRechargeOrder(driverId, amount, token);
      
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.error || 'Failed to create recharge order');
      }

      console.log('✅ Recharge order created:', orderResponse.data);

      // Step 2: Initialize Razorpay payment
      const amountInPaise = convertRupeesToPaise(amount);
      const orderData = orderResponse.data || {};
      const paymentOptions: PaymentOptions = {
        key: orderData.keyId || getRazorpayKey(),
        amount: amountInPaise,
        currency: 'INR',
        name: PAYMENT_CONFIG.name,
        description: `Wallet recharge - ₹${amount}`,
        order_id: orderData.orderId || '',
        prefill: {
          name: 'Driver',
          email: 'driver@roqet.com',
          contact: '7731993656'
        },
        theme: PAYMENT_CONFIG.theme,
        handler: async (response: any) => {
          console.log('✅ Payment successful:', response);
          await handleRechargeSuccess(response, orderData.orderId || '');
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            setIsRecharging(false);
          },
        },
      };

      console.log('🔧 Razorpay options:', paymentOptions);

      const result = await initializePayment(paymentOptions);
      
      if (result.success) {
        console.log('✅ Payment completed successfully');
        console.log('💳 Payment result:', result);
        
        // Check if this is a development fallback
        const isDevFallback = result.message?.includes('development fallback');
        
        if (isDevFallback) {
          // For development fallback, skip backend callback and update wallet directly
          await handleDevelopmentRechargeSuccess(result, amount, orderData.orderId || '');
        } else {
          // For real payments, process through backend callback
          await handleRechargeSuccess(result, orderData.orderId || '');
        }
      } else if (result.error === 'USE_WEBVIEW') {
        console.log('🌐 Using WebView implementation for Razorpay');
        // Use WebView implementation
        setPendingAmount(amount);
        setWebViewOrderData({
          keyId: orderData.keyId || getRazorpayKey(),
          orderId: orderData.orderId || '',
          amount: convertRupeesToPaise(amount),
          currency: 'INR',
          name: PAYMENT_CONFIG.name,
          description: `Wallet recharge - ₹${amount}`,
          prefill: {
            name: 'Driver',
            email: 'driver@roqet.com',
            contact: '7731993656'
          },
          theme: PAYMENT_CONFIG.theme,
        });
        setShowRazorpayWebView(true);
        setIsRecharging(false); // Reset loading state
      } else {
        throw new Error(result.error || 'Payment failed');
      }
      
    } catch (error) {
      console.error('❌ Recharge error:', error);
      Alert.alert('Recharge Failed', error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      setIsRecharging(false);
    }
  };

  const handleWebViewSuccess = async (paymentData: any) => {
    try {
      console.log('🌐 WebView payment success:', paymentData);
      setShowRazorpayWebView(false);
      
      // Process through backend callback
      await handleRechargeSuccess(paymentData, webViewOrderData?.orderId || '');
    } catch (error) {
      console.error('❌ WebView payment success error:', error);
      Alert.alert('Payment Processing Failed', 'Payment completed but failed to update wallet. Please contact support.');
    }
  };

  const handleWebViewFailure = (error: any) => {
    console.error('🌐 WebView payment failed:', error);
    setShowRazorpayWebView(false);
    Alert.alert('Payment Failed', error?.error?.description || 'Payment was not completed. Please try again.');
  };

  const handleWebViewClose = () => {
    setShowRazorpayWebView(false);
    setWebViewOrderData(null);
    setPendingAmount(0);
  };

  const handleDevelopmentRechargeSuccess = async (paymentData: any, amount: number, orderId: string) => {
    try {
      console.log('🎯 Processing development recharge success...');
      
      // For development fallback, update wallet balance directly
      const newBalance = walletBalance + amount;
      setWalletBalance(newBalance);
      
      // Add recharge transaction to local state
      const newTransaction: WalletTransaction = {
        id: `recharge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'credit',
        amount: amount,
        description: 'Wallet recharge via Razorpay (Development Mode)',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'topup'
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      
      Alert.alert(
        'Recharge Successful',
        `₹${amount} has been added to your wallet successfully.\n\n(Development mode - simulated payment)`
      );
      
    } catch (error) {
      console.error('❌ Development recharge error:', error);
      Alert.alert('Recharge Failed', error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsRecharging(false);
    }
  };

  const handleRechargeSuccess = async (paymentData: any, orderId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Step 3: Process recharge callback
      console.log('💰 Processing recharge callback...');
      const callbackResponse = await walletService.processRechargeCallback(
        driverId,
        paymentData.paymentId || paymentData.razorpay_payment_id,
        orderId,
        paymentData.signature || paymentData.razorpay_signature,
        token
      );

      if (callbackResponse.success && callbackResponse.data) {
        const callbackData = callbackResponse.data;
        // Update wallet balance with API response
        setWalletBalance(callbackData.balance || 0);
        setRideEarnings(callbackData.rideEarnings || 0);
        setTotalEarnings(callbackData.totalEarnings || 0);
        
        // Add recharge transaction to local state
        const newTransaction: WalletTransaction = {
          id: `recharge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'credit',
          amount: callbackData.amount || 0,
          description: 'Wallet recharge via Razorpay',
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: 'topup'
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
        
        Alert.alert(
          'Recharge Successful',
          `₹${callbackData.amount || 0} has been added to your wallet successfully via Razorpay.`
        );
      } else {
        throw new Error(callbackResponse.error || 'Failed to process recharge');
      }
      
    } catch (error) {
      console.error('❌ Recharge callback error:', error);
      Alert.alert('Recharge Failed', error instanceof Error ? error.message : 'Payment completed but wallet update failed. Please contact support.');
    } finally {
      setIsRecharging(false);
    }
  };

  const refreshWallet = async () => {
    if (!driverId) {
      console.error('❌ No driver ID available for refresh');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch fresh wallet data from API
      await fetchWalletData(driverId);
      console.log('✅ Wallet data refreshed successfully');
      
    } catch (error) {
      console.error('❌ Failed to refresh wallet:', error);
      Alert.alert('Refresh Failed', 'Failed to refresh wallet data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPaymentMethod = ({ item }: any) => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={styles.paymentMethodCard} activeOpacity={0.7}>
      <View style={styles.paymentMethodLeft}>
        <View style={styles.paymentMethodIcon}>
          <Ionicons
            name={item.type === 'upi' ? 'card' : item.type === 'card' ? 'card' : 'cash'}
            size={24}
            color={Colors.primary}
          />
        </View>
        <View style={styles.paymentMethodInfo}>
          <Text style={styles.paymentMethodName}>{item.name}</Text>
          <Text style={styles.paymentMethodIdentifier}>{item.identifier}</Text>
        </View>
      </View>
      <View style={styles.paymentMethodActions}>
        {item.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
          <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.gray400} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );

  const renderTransaction = ({ item }: any) => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.transactionIcon,
            item.type === 'credit' ? styles.creditIcon : styles.debitIcon,
          ]}
        >
          <Ionicons
            name={item.type === 'credit' ? 'add' : 'remove'}
            size={20}
            color={Colors.white}
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>
            {item.date} • {item.time}
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          item.type === 'credit' ? styles.creditAmount : styles.debitAmount,
        ]}
      >
        {item.type === 'credit' ? '+' : '-'}₹{item.amount}
      </Text>
    </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Initial Loading State */}
      {isInitialLoading && (
        <View style={styles.fullScreenLoading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading wallet data...</Text>
        </View>
      )}

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity 
          style={styles.helpButton} 
          activeOpacity={0.7}
          onPress={async () => {
            console.log('🧪 WalletScreen: Manual API test triggered');
            console.log('🧪 WalletScreen: Current driverId:', driverId);
            console.log('🧪 WalletScreen: Current walletBalance:', walletBalance);
            
            if (driverId) {
              console.log('🧪 WalletScreen: Calling fetchWalletData with driverId:', driverId);
              await fetchWalletData(driverId);
            } else {
              console.log('❌ WalletScreen: No driver ID available for manual test');
              console.log('🧪 WalletScreen: Trying to get driver ID from JWT...');
              try {
                const token = await getToken();
                const userId = await getUserIdFromJWT(token);
                console.log('🧪 WalletScreen: Got driver ID from JWT:', userId);
                setDriverId(userId);
                await fetchWalletData(userId);
              } catch (error) {
                console.error('❌ WalletScreen: Failed to get driver ID:', error);
              }
            }
          }}
        >
          <Ionicons name="help-circle-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </Animated.View>

      {/* Tabs */}
      <Animated.View style={[styles.tabsContainer, { opacity: fadeAnim }]}>
        {/* <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'wallet' && styles.activeTab,
          ]}
          onPress={() => setSelectedTab('wallet')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'wallet' && styles.activeTabText,
            ]}
          >
            Wallet
          </Text>
        </TouchableOpacity> */}
        {/* <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'payments' && styles.activeTab,
          ]}
          onPress={() => setSelectedTab('payments')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'payments' && styles.activeTabText,
            ]}
          >
            Payment Methods
          </Text>
        </TouchableOpacity> */}
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'wallet' ? (
          <>
            {/* Payment Notification */}
            {showPaymentNotification && (
              <Animated.View 
                style={[
                  styles.paymentNotification,
                  { 
                    opacity: notificationAnim,
                    transform: [{ translateY: notificationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0]
                    })}]
                  }
                ]}
              >
                <View style={styles.notificationContent}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  <Text style={styles.notificationText}>
                    Payment Received! ₹{lastPaymentAmount}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Wallet Balance */}
            <Animated.View style={[styles.walletCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Wallet Balance</Text>
                <Text style={styles.balanceAmount}>₹{walletBalance}</Text>
              </View>
              <View style={styles.walletActions}>
                <TouchableOpacity 
                  style={styles.refreshButton} 
                  onPress={refreshWallet}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Ionicons name="refresh" size={20} color={Colors.white} />
                  )}
                </TouchableOpacity>
                <Button
                  title="Withdraw"
                  onPress={handleWithdraw}
                  disabled={isWithdrawing || walletBalance <= 0}
                  style={styles.withdrawButton}
                  loading={isWithdrawing}
                />
              </View>
            </Animated.View>

            {/* Earnings Summary */}
            <Animated.View style={[styles.earningsCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Text style={styles.earningsTitle}>Earnings Summary</Text>
              <View style={styles.earningsGrid}>
                <View style={styles.earningsItem}>
                  <Text style={styles.earningsLabel}>Today's Earnings</Text>
                  <Text style={styles.earningsAmount}>₹{rideEarnings}</Text>
                  <Text style={styles.earningsSubtext}>From rides</Text>
                </View>
                <View style={styles.earningsItem}>
                  <Text style={styles.earningsLabel}>Total Earnings</Text>
                  <Text style={styles.earningsAmount}>₹{totalEarnings}</Text>
                  <Text style={styles.earningsSubtext}>All time</Text>
                </View>
              </View>
            </Animated.View>

            {/* Custom Recharge Input */}
            <Animated.View style={[styles.rechargeCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Text style={styles.rechargeTitle}>Custom Recharge</Text>
              <View style={styles.rechargeInputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.rechargeInput}
                  placeholder="Enter amount"
                  placeholderTextColor={Colors.gray400}
                  value={rechargeAmount}
                  onChangeText={setRechargeAmount}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TouchableOpacity 
                  style={[styles.rechargeButton, isRecharging && styles.rechargeButtonDisabled]}
                  onPress={() => {
                    const amount = parseInt(rechargeAmount);
                    if (amount && amount >= 100) {
                      processRecharge(amount);
                      setRechargeAmount('');
                    } else {
                      Alert.alert('Invalid Amount', 'Please enter an amount of ₹100 or more.');
                    }
                  }}
                  disabled={isRecharging || !rechargeAmount}
                  activeOpacity={0.7}
                >
                  {isRecharging ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.rechargeButtonText}>Recharge</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Quick Add Amounts */}
            <Animated.View style={[styles.quickAddCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Text style={styles.quickAddTitle}>Quick Add</Text>
              <View style={styles.quickAddButtons}>
                {[100, 200, 500].map((amount, index) => (
                  <TouchableOpacity 
                    key={`quick-add-${amount}-${index}`} 
                    style={styles.quickAddButton} 
                    activeOpacity={0.7}
                    onPress={() => processRecharge(amount)}
                    disabled={isRecharging}
                  >
                    <Text style={styles.quickAddText}>₹{amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Recent Transactions */}
            <Animated.View style={[styles.transactionsCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.transactionsHeader}>
                <Text style={styles.transactionsTitle}>Recent Transactions</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              <View>
                {transactions.map((item, index) => {
                  const key = `transaction-${item.id || index}-${index}`;
                  return (
                    <View key={key}>
                      {renderTransaction({ item })}
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          </>
        ) : (
          <>
            {/* Payment Methods */}
            <View style={styles.paymentMethodsCard}>
              <View style={styles.paymentMethodsHeader}>
                <Text style={styles.paymentMethodsTitle}>Saved Payment Methods</Text>
                <TouchableOpacity style={styles.addPaymentButton}>
                  <Ionicons name="add" size={20} color={Colors.primary} />
                  <Text style={styles.addPaymentText}>Add</Text>
                </TouchableOpacity>
              </View>
              <View>
                {mockPaymentMethods.map((item, index) => {
                  const key = `payment-method-${item.id || item.name || index}-${index}`;
                  return (
                    <View key={key}>
                      {renderPaymentMethod({ item })}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Payment Settings */}
            <View style={styles.settingsCard}>
              <Text style={styles.settingsTitle}>Payment Settings</Text>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
                  <Text style={styles.settingText}>Auto-pay for rides</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="receipt" size={20} color={Colors.primary} />
                  <Text style={styles.settingText}>Payment receipts</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="lock-closed" size={20} color={Colors.accent} />
                  <Text style={styles.settingText}>Payment security</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Razorpay WebView Modal */}
      {showRazorpayWebView && webViewOrderData && (
        <RazorpayWebView
          visible={showRazorpayWebView}
          onClose={handleWebViewClose}
          onSuccess={handleWebViewSuccess}
          onFailure={handleWebViewFailure}
          orderData={webViewOrderData}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    padding: Layout.spacing.sm,
  },
  headerTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  helpButton: {
    padding: Layout.spacing.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  walletCard: {
    backgroundColor: Colors.primary,
    margin: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  balanceLabel: {
    fontSize: Layout.fontSize.md,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: Layout.spacing.sm,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Layout.spacing.xs,
  },
  walletActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginRight: Layout.spacing.md,
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  paymentNotification: {
    position: 'absolute',
    top: 20,
    left: Layout.spacing.lg,
    right: Layout.spacing.lg,
    backgroundColor: Colors.success,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    zIndex: 1000,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    marginLeft: Layout.spacing.sm,
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
  earningsCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  earningsTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  earningsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningsItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
  },
  earningsLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.xs,
  },
  earningsAmount: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Layout.spacing.xs,
  },
  earningsSubtext: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  quickAddCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickAddTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  quickAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAddButton: {
    backgroundColor: Colors.gray50,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    marginHorizontal: Layout.spacing.xs,
    alignItems: 'center',
  },
  quickAddText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  transactionsCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  transactionsTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  viewAllText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  creditIcon: {
    backgroundColor: Colors.success,
  },
  debitIcon: {
    backgroundColor: Colors.error,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  transactionDate: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: Layout.fontSize.md,
    fontWeight: 'bold',
  },
  creditAmount: {
    color: Colors.success,
  },
  debitAmount: {
    color: Colors.error,
  },
  paymentMethodsCard: {
    backgroundColor: Colors.white,
    margin: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentMethodsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  paymentMethodsTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.sm,
  },
  addPaymentText: {
    marginLeft: Layout.spacing.xs,
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentMethodIdentifier: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  paymentMethodActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.sm,
    marginRight: Layout.spacing.sm,
  },
  defaultText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    color: Colors.white,
  },
  moreButton: {
    padding: Layout.spacing.sm,
  },
  settingsCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingsTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    color: Colors.text,
  },
  fullScreenLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    marginTop: Layout.spacing.md,
  },
  rechargeCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rechargeTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  rechargeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  currencySymbol: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginRight: Layout.spacing.sm,
  },
  rechargeInput: {
    flex: 1,
    fontSize: Layout.fontSize.lg,
    color: Colors.text,
    paddingVertical: Layout.spacing.sm,
  },
  rechargeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginLeft: Layout.spacing.md,
  },
  rechargeButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  rechargeButtonText: {
    color: Colors.white,
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
});
