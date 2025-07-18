import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  payment_method: string;
  notes?: string;
}

const TransactionScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Gagal memuat transaksi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const deleteTransaction = async (id: string) => {
    Alert.alert(
      'Hapus Transaksi',
      'Apakah Anda yakin ingin menghapus transaksi ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

              if (error) throw error;
              
              setTransactions(prev => prev.filter(t => t.id !== id));
              Alert.alert('Sukses', 'Transaksi berhasil dihapus');
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus transaksi');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      cash: 'Tunai',
      credit_card: 'Kartu Kredit',
      debit_card: 'Kartu Debit',
      bank_transfer: 'Transfer Bank',
      e_wallet: 'E-Wallet',
    };
    return labels[method] || method;
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionIcon}>
          <Icon
            name={item.type === 'income' ? 'trending-up' : 'trending-down'}
            size={24}
            color={item.type === 'income' ? '#10B981' : '#EF4444'}
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionCategory}>{item.category}</Text>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.transactionAmount}>
          <Text
            style={[
              styles.amountText,
              { color: item.type === 'income' ? '#10B981' : '#EF4444' }
            ]}
          >
            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
          </Text>
          <Text style={styles.paymentMethod}>
            {getPaymentMethodLabel(item.payment_method)}
          </Text>
        </View>
      </View>
      
      {item.notes && (
        <Text style={styles.transactionNotes}>{item.notes}</Text>
      )}
      
      <View style={styles.transactionActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => deleteTransaction(item.id)}
        >
          <Icon name="delete" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daftar Transaksi</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddTransaction' as never)}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="receipt" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>Belum ada transaksi</Text>
            <Text style={styles.emptyStateSubtext}>
              Tambah transaksi pertama Anda
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  transactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionNotes: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  transactionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

export default TransactionScreen;