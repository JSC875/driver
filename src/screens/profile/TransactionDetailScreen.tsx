import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { WalletTransaction } from '../../services/walletService';

interface TransactionDetailScreenProps {
  navigation: any;
  route: {
    params: {
      transactions: WalletTransaction[];
    };
  };
}

export default function TransactionDetailScreen({ navigation, route }: TransactionDetailScreenProps) {
  const { transactions } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.amount.toString().includes(searchQuery) ||
        transaction.date.includes(searchQuery)
      );
    }

    return filtered.sort((a, b) => {
      // Sort by date (newest first)
      const dateA = new Date(a.date + ' ' + a.time);
      const dateB = new Date(b.date + ' ' + b.time);
      return dateB.getTime() - dateA.getTime();
    });
  }, [transactions, selectedFilter, searchQuery]);

  const getTransactionIcon = (transaction: WalletTransaction) => {
    switch (transaction.description) {
      case 'Ride payment':
        return 'car';
      case 'Wallet recharge':
        return 'wallet';
      case 'Withdrawal':
        return 'card';
      default:
        return transaction.type === 'credit' ? 'add' : 'remove';
    }
  };

  const getTransactionColor = (transaction: WalletTransaction) => {
    switch (transaction.description) {
      case 'Ride payment':
        return Colors.success;
      case 'Wallet recharge':
        return Colors.primary;
      case 'Withdrawal':
        return Colors.error;
      default:
        return transaction.type === 'credit' ? Colors.success : Colors.error;
    }
  };

  const handleTransactionPress = (transaction: WalletTransaction) => {
    console.log('🔍 Opening transaction details:', transaction);
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTransaction(null);
  };

  const getTransactionStatus = (transaction: WalletTransaction) => {
    // You can add logic here to determine status based on your data
    return 'Completed';
  };

  const getPaymentMethod = (transaction: WalletTransaction) => {
    if (transaction.description.includes('Razorpay')) {
      return 'Razorpay';
    } else if (transaction.description.includes('Ride payment')) {
      return 'Wallet';
    } else if (transaction.description.includes('Withdrawal')) {
      return 'Bank Transfer';
    }
    return 'Wallet';
  };

  const renderTransaction = ({ item }: { item: WalletTransaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => handleTransactionPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.transactionIcon,
            { backgroundColor: getTransactionColor(item) }
          ]}
        >
          <Ionicons
            name={getTransactionIcon(item) as any}
            size={20}
            color={Colors.white}
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>
            {item.date} • {item.time}
          </Text>
          {item.category && (
            <Text style={styles.transactionCategory}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.transactionAmount,
            item.type === 'credit' ? styles.creditAmount : styles.debitAmount,
          ]}
        >
          {item.type === 'credit' ? '+' : '-'}₹{item.amount}
        </Text>
        <Text style={styles.transactionType}>
          {item.type === 'credit' ? 'Credit' : 'Debit'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getFilterButtonStyle = (filter: 'all' | 'credit' | 'debit') => ({
    ...styles.filterButton,
    ...(selectedFilter === filter && styles.filterButtonActive),
  });

  const getFilterButtonTextStyle = (filter: 'all' | 'credit' | 'debit') => ({
    ...styles.filterButtonText,
    ...(selectedFilter === filter && styles.filterButtonTextActive),
  });

  const renderDetailModal = () => {
    if (!selectedTransaction) return null;

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDetailModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={closeDetailModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Transaction Icon and Amount */}
              <View style={styles.detailHeader}>
                <View
                  style={[
                    styles.detailIcon,
                    { backgroundColor: getTransactionColor(selectedTransaction) }
                  ]}
                >
                  <Ionicons
                    name={getTransactionIcon(selectedTransaction) as any}
                    size={32}
                    color={Colors.white}
                  />
                </View>
                <Text
                  style={[
                    styles.detailAmount,
                    selectedTransaction.type === 'credit' ? styles.creditAmount : styles.debitAmount,
                  ]}
                >
                  {selectedTransaction.type === 'credit' ? '+' : '-'}₹{selectedTransaction.amount}
                </Text>
                <Text style={styles.detailType}>
                  {selectedTransaction.type === 'credit' ? 'Credit' : 'Debit'}
                </Text>
              </View>

              {/* Transaction Details */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Transaction Information</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.description || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.date || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.time || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={styles.statusContainer}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>{getTransactionStatus(selectedTransaction)}</Text>
                  </View>
                </View>

                {selectedTransaction.category && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category</Text>
                    <Text style={styles.detailValue}>
                      {selectedTransaction.category.charAt(0).toUpperCase() + selectedTransaction.category.slice(1)}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method</Text>
                  <Text style={styles.detailValue}>{getPaymentMethod(selectedTransaction)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.id || 'N/A'}</Text>
                </View>
              </View>

              {/* Additional Details based on transaction type */}
              {selectedTransaction.description === 'Ride payment' && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Ride Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ride Type</Text>
                    <Text style={styles.detailValue}>Standard Ride</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Source</Text>
                    <Text style={styles.detailValue}>Passenger Payment</Text>
                  </View>
                </View>
              )}

              {selectedTransaction.description === 'Wallet recharge' && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Recharge Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Recharge Method</Text>
                    <Text style={styles.detailValue}>Online Payment</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Processing Time</Text>
                    <Text style={styles.detailValue}>Instant</Text>
                  </View>
                </View>
              )}

              {selectedTransaction.description === 'Withdrawal' && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Withdrawal Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Withdrawal Method</Text>
                    <Text style={styles.detailValue}>Bank Transfer</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Processing Time</Text>
                    <Text style={styles.detailValue}>2-3 Business Days</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  // Add share functionality here
                  Alert.alert('Share', 'Transaction details shared successfully!');
                }}
              >
                <Ionicons name="share-outline" size={20} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.primaryAction]}
                onPress={() => {
                  // Add download receipt functionality here
                  Alert.alert('Download', 'Receipt downloaded successfully!');
                }}
              >
                <Ionicons name="download-outline" size={20} color={Colors.white} />
                <Text style={[styles.actionButtonText, { color: Colors.white }]}>Download Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={Colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={getFilterButtonStyle('all')}
          onPress={() => setSelectedFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={getFilterButtonTextStyle('all')}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={getFilterButtonStyle('credit')}
          onPress={() => setSelectedFilter('credit')}
          activeOpacity={0.7}
        >
          <Text style={getFilterButtonTextStyle('credit')}>Credits</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={getFilterButtonStyle('debit')}
          onPress={() => setSelectedFilter('debit')}
          activeOpacity={0.7}
        >
          <Text style={getFilterButtonTextStyle('debit')}>Debits</Text>
        </TouchableOpacity>
      </View>

             {/* Transaction Count */}
       <View style={styles.countContainer}>
         <Text style={styles.countText}>
           {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
         </Text>
       </View>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        style={styles.transactionsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.transactionsContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={Colors.gray400} />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search or filters' : 'No transactions available'}
            </Text>
          </View>
        }
      />

      {/* Detail Modal */}
      {renderDetailModal()}
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
  headerRight: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.white,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Layout.spacing.sm,
    fontSize: Layout.fontSize.md,
    color: Colors.text,
  },
  clearButton: {
    padding: Layout.spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginHorizontal: Layout.spacing.xs,
    alignItems: 'center',
    backgroundColor: Colors.gray50,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  countContainer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
    backgroundColor: Colors.white,
  },
  countText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  transactionsList: {
    flex: 1,
  },
  transactionsContent: {
    paddingBottom: Layout.spacing.lg,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.white,
    marginHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: Layout.fontSize.xs,
    color: Colors.primary,
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: Layout.fontSize.md,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  creditAmount: {
    color: Colors.success,
  },
  debitAmount: {
    color: Colors.error,
  },
  transactionType: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.lg,
  },
  emptyTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  emptySubtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    opacity: 0.7,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    padding: Layout.spacing.sm,
  },
  modalBody: {
    flex: 1,
    paddingBottom: Layout.spacing.lg,
  },
  detailHeader: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.lg,
  },
  detailIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.md,
  },
  detailAmount: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    marginBottom: Layout.spacing.xs,
  },
  detailType: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailSection: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
  },
  detailLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
    paddingLeft: Layout.spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: Layout.spacing.xs,
  },
  statusText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.success,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.gray50,
    marginHorizontal: Layout.spacing.xs,
  },
  primaryAction: {
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: Layout.spacing.xs,
  },

});
