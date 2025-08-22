import React, { useState } from 'react';
import { Modal, View, StyleSheet, Alert, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface RazorpayWebViewProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
  onFailure: (error: any) => void;
  orderData: {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    prefill: {
      name?: string;
      email?: string;
      contact?: string;
    };
    theme: {
      color: string;
    };
  };
}

export default function RazorpayWebView({
  visible,
  onClose,
  onSuccess,
  onFailure,
  orderData,
}: RazorpayWebViewProps) {
  const [loading, setLoading] = useState(true);

  const generateRazorpayHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Razorpay Payment</title>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            padding: 20px;
            background-color: #f5f5f5;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #007AFF;
            margin-bottom: 20px;
        }
        .amount {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .description {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .pay-button {
            background: linear-gradient(135deg, #007AFF, #0056CC);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s ease;
        }
        .pay-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 122, 255, 0.3);
        }
        .pay-button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        .loading {
            color: #666;
            margin-top: 20px;
        }
        .secure-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 20px;
            color: #666;
            font-size: 14px;
        }
        .secure-icon {
            margin-right: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">${orderData.name}</div>
        <div class="amount">₹${(orderData.amount / 100).toFixed(2)}</div>
        <div class="description">${orderData.description}</div>
        <button id="payButton" class="pay-button" onclick="openRazorpay()">
            Pay Now
        </button>
        <div class="secure-badge">
            <span class="secure-icon">🔒</span>
            Secured by Razorpay
        </div>
    </div>

    <script>
        function openRazorpay() {
            const button = document.getElementById('payButton');
            button.disabled = true;
            button.innerHTML = 'Processing...';
            
            const options = {
                key: '${orderData.keyId}',
                amount: ${orderData.amount},
                currency: '${orderData.currency}',
                name: '${orderData.name}',
                description: '${orderData.description}',
                order_id: '${orderData.orderId}',
                prefill: {
                    name: '${orderData.prefill.name || ''}',
                    email: '${orderData.prefill.email || ''}',
                    contact: '${orderData.prefill.contact || ''}'
                },
                theme: {
                    color: '${orderData.theme.color}'
                },
                handler: function(response) {
                    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'payment_success',
                        data: response
                    }));
                },
                modal: {
                    ondismiss: function() {
                        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'payment_dismissed'
                        }));
                    }
                }
            };

            try {
                const rzp = new Razorpay(options);
                rzp.on('payment.failed', function(response) {
                    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'payment_failed',
                        data: response
                    }));
                });
                rzp.open();
            } catch (error) {
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'payment_error',
                    error: error.message || 'Unknown error'
                }));
            }
        }

        // Auto-open payment on load
        setTimeout(() => {
            openRazorpay();
        }, 1000);
    </script>
</body>
</html>`;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', message);

      switch (message.type) {
        case 'payment_success':
          onSuccess(message.data);
          onClose();
          break;
        case 'payment_failed':
          onFailure(message.data);
          break;
        case 'payment_dismissed':
          onClose();
          break;
        case 'payment_error':
          onFailure({ error: message.error });
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
      onFailure({ error: 'Failed to parse payment response' });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Complete Payment</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <WebView
          source={{ html: generateRazorpayHTML() }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          bounces={false}
          scrollEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  webview: {
    flex: 1,
  },
});
