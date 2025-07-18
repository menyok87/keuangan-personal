import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
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
}

interface MonthlyStats {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
}

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<MonthlyStats>({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', `${currentMonth}-01`)
        .order('date', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
      
      // Calculate stats
      const totalIncome = data?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalExpenses = data?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      setStats({
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        transactionCount: data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getBalanceColor = (balance: number) => {
    return balance >= 0 ? '#10B981' : '#EF4444';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard Keuangan</Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString('id-ID', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </Text>
        </View>

        {/* Main Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo Bersih</Text>
          <Text style={[styles.balanceAmount, { color: getBalanceColor(stats.netBalance) }]}>
            {formatCurrency(stats.netBalance)}
          </Text>
          <View style={styles.balanceDetails}>
            <View style={styles.balanceItem}>
              <Icon name="trending-up" size={16} color="#10B981" />
              <Text style={styles.balanceItemText}>
                Pemasukan: {formatCurrency(stats.totalIncome)}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Icon name="trending-down" size={16} color="#EF4444" />
              <Text style={styles.balanceItemText}>
                Pengeluaran: {formatCurrency(stats.totalExpenses)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="account-balance-wallet" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.transactionCount}</Text>
            <Text style={styles.statLabel}>Transaksi</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name="savings" size={24} color="#10B981" />
            <Text style={styles.statValue}>
              {stats.totalIncome > 0 ? ((stats.netBalance / stats.totalIncome) * 100).toFixed(1) : 0}%
            </Text>
            <Text style={styles.statLabel}>Tingkat Tabungan</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AddTransaction' as never)}
            >
              <Icon name="add" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Tambah Transaksi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => navigation.navigate('Anggaran' as never)}
            >
              <Icon name="pie-chart" size={24} color="#3B82F6" />
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                Kelola Anggaran
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentTransactions}>
          <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
          {transactions.slice(0, 5).map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <Icon
                  name={transaction.type === 'income' ? 'trending-up' : 'trending-down'}
                  size={20}
                  color={transaction.type === 'income' ? '#10B981' : '#EF4444'}
                />
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
                <Text style={styles.transactionCategory}>
                  {transaction.category}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'income' ? '#10B981' : '#EF4444' }
                ]}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))}
          
          {transactions.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="receipt" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>Belum ada transaksi bulan ini</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#3B82F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#BFDBFE',
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItemText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  actionButtonTextSecondary: {
    color: '#3B82F6',
  },
  recentTransactions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
});

export default DashboardScreen;