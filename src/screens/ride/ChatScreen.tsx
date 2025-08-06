
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import socketManager from '../../utils/socket';
import { useAuth } from '@clerk/clerk-expo';
import { getUserIdFromJWT } from '../../utils/jwtDecoder';

interface ChatMessage {
  id: string;
  rideId: string;
  senderId: string;
  senderType: 'user' | 'driver';
  message: string;
  timestamp: string;
  isRead: boolean;
}

const quickReplies = [
  'I\'m here',
  'Running 2 mins late',
  'Can you wait?',
  'Thank you',
];

export default function ChatScreen({ navigation, route }: any) {
  const { ride, user } = route.params;
  const { getToken, isLoaded } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [driverId, setDriverId] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const rideId = ride?.rideId || '';

  // Get driver ID from JWT when component mounts
  useEffect(() => {
    const getDriverId = async () => {
      if (isLoaded) {
        try {
          const id = await getUserIdFromJWT(getToken);
          console.log('🔑 Got driver ID from JWT:', id);
          setDriverId(id);
        } catch (error) {
          console.error('❌ Error getting driver ID from JWT:', error);
          // Try to get from route params as fallback
          const fallbackId = route.params?.driverId || 'driver123';
          console.log('🔄 Using fallback driver ID:', fallbackId);
          setDriverId(fallbackId);
        }
      }
    };

    getDriverId();
  }, [isLoaded, getToken, route.params]);

  console.log('🔍 Driver ChatScreen Debug:', {
    routeParams: route.params,
    ride,
    user,
    driverId,
    rideId,
    isLoaded
  });

  // Add more detailed debugging
  useEffect(() => {
    console.log('🔍 Driver ChatScreen Mount Debug:', {
      routeParams: route.params,
      ride: ride,
      rideId: ride?.rideId,
      user: user,
      driverId: driverId,
      isLoaded: isLoaded
    });
  }, [route.params, driverId, isLoaded]);

  useEffect(() => {
    // Wait for auth to be loaded and driverId to be set
    if (!isLoaded) {
      console.log('⏳ Waiting for auth to load...');
      return;
    }

    if (!driverId) {
      console.log('⏳ Waiting for driver ID to be set...');
      return;
    }

    if (!rideId) {
      console.error('❌ Missing ride ID:', { rideId });
      Alert.alert('Error', 'Missing ride information');
      navigation.goBack();
      return;
    }

    console.log('✅ All data available, setting up chat:', { driverId, rideId });

    // Set up chat event listeners
    socketManager.onChatMessage((message) => {
      console.log('💬 Received chat message:', message);
      setMessages(prev => [...prev, message]);
      
      // Mark message as read if it's from user
      if (message.senderType === 'user') {
        socketManager.markMessagesAsRead({
          rideId: message.rideId,
          readerId: driverId,
          readerType: 'driver'
        });
      }
    });

    socketManager.onChatHistory((data) => {
      console.log('📚 Received chat history:', data);
      setMessages(data.messages);
      setIsLoading(false);
    });

    socketManager.onTypingIndicator((data) => {
      console.log('⌨️ Typing indicator:', data);
      if (data.senderType === 'user') {
        setIsUserTyping(data.isTyping);
      }
    });

    socketManager.onMessagesRead((data) => {
      console.log('👁️ Messages read:', data);
      // Update read status for messages
      setMessages(prev => prev.map(msg => ({
        ...msg,
        isRead: msg.senderType === 'driver' ? true : msg.isRead
      })));
    });

    // Load chat history
    loadChatHistory();

    return () => {
      // Clean up typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [driverId, rideId, isLoaded]);

  const loadChatHistory = () => {
    if (driverId && rideId) {
      socketManager.getChatHistory({
        rideId: rideId,
        requesterId: driverId,
        requesterType: 'driver'
      });
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && driverId && rideId) {
      const messageData = {
        rideId: rideId,
        senderId: driverId,
        senderType: 'driver' as const,
        message: newMessage.trim()
      };

      socketManager.sendChatMessage(messageData);
      setNewMessage('');
      
      // Stop typing indicator
      socketManager.sendTypingStop({
        rideId: rideId,
        senderId: driverId,
        senderType: 'driver'
      });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const handleQuickReply = (reply: string) => {
    setNewMessage(reply);
    handleSendMessage();
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    // Send typing start
    if (text.length === 1 && driverId && rideId) {
      socketManager.sendTypingStart({
        rideId: rideId,
        senderId: driverId,
        senderType: 'driver'
      });
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout for typing stop
    typingTimeoutRef.current = setTimeout(() => {
      if (driverId && rideId) {
        socketManager.sendTypingStop({
          rideId: rideId,
          senderId: driverId,
          senderType: 'driver'
        });
      }
    }, 1000);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.senderType === 'driver' ? styles.driverMessage : styles.userMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.senderType === 'driver' ? styles.driverMessageText : styles.userMessageText,
        ]}
      >
        {item.message}
      </Text>
      <View style={styles.messageFooter}>
        <Text
          style={[
            styles.timestamp,
            item.senderType === 'driver' ? styles.driverTimestamp : styles.userTimestamp,
          ]}
        >
          {item.timestamp}
        </Text>
        {item.senderType === 'driver' && (
          <Ionicons 
            name={item.isRead ? "checkmark-done" : "checkmark"} 
            size={12} 
            color={item.isRead ? Colors.success : Colors.gray400} 
            style={styles.readIndicator}
          />
        )}
      </View>
    </View>
  );

  const renderTypingIndicator = () => {
    if (!isUserTyping) return null;
    
    return (
      <View style={[styles.messageContainer, styles.userMessage]}>
        <View style={styles.typingIndicator}>
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
        </View>
      </View>
    );
  };

  // Show loading if auth is not loaded yet or driver ID is not set
  if (!isLoaded || !driverId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {!isLoaded ? 'Loading chat...' : 'Getting driver information...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
          <Text style={styles.userStatus}>
            {isUserTyping ? 'Typing...' : 'Online'}
          </Text>
        </View>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={renderTypingIndicator}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation with your customer</Text>
            </View>
          )
        }
      />

      {/* Quick Replies */}
      <View style={styles.quickRepliesContainer}>
        <FlatList
          data={quickReplies}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.quickReplyButton}
              onPress={() => handleQuickReply(item)}
            >
              <Text style={styles.quickReplyText}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.quickRepliesContent}
        />
      </View>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={handleTyping}
            multiline
            maxLength={500}
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              newMessage.trim() && styles.sendButtonActive,
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={newMessage.trim() ? Colors.white : Colors.gray400}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    marginRight: Layout.spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  userStatus: {
    fontSize: Layout.fontSize.sm,
    color: Colors.success,
  },
  callButton: {
    padding: Layout.spacing.sm,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: Layout.spacing.xs,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Layout.borderRadius.sm,
  },
  driverMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderBottomLeftRadius: Layout.borderRadius.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: Layout.fontSize.md,
    lineHeight: 20,
  },
  userMessageText: {
    color: Colors.white,
  },
  driverMessageText: {
    color: Colors.text,
  },
  timestamp: {
    fontSize: Layout.fontSize.xs,
    marginTop: Layout.spacing.xs,
  },
  userTimestamp: {
    color: Colors.white,
    opacity: 0.8,
    textAlign: 'right',
  },
  driverTimestamp: {
    color: Colors.textSecondary,
  },
  quickRepliesContainer: {
    backgroundColor: Colors.white,
    paddingVertical: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  quickRepliesContent: {
    paddingHorizontal: Layout.spacing.lg,
  },
  quickReplyButton: {
    backgroundColor: Colors.gray50,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 50,
    marginRight: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickReplyText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.gray50,
    borderRadius: Layout.borderRadius.lg,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    maxHeight: 100,
    marginRight: Layout.spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Layout.spacing.xs,
  },
  readIndicator: {
    marginLeft: Layout.spacing.xs,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginTop: Layout.spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary,
    marginHorizontal: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.lg,
  },
  emptyText: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  emptySubtext: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
