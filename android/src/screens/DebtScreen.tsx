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
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Debt {
  id: string;
  creditor_name: string;
  debtor_name?: string;
  amount: number;
  remaining_amount: number;
  description: string;
  due_date?: string;
  status: 'pending' | 'partial' | 'paid';
  type: 'debt' | 'receivable';
  interest_rate: number;
}

const DebtScreen = () => {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'debt' | 'receivable'>('all');

  const fetchDebts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDebts(data || []);
    } catch (error) {
      console.error('Error fetching debts:', error);
      Alert.alert('Error', 'Gagal memuat data hutang');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDebts();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'partial': return '#F59E0B';
      case 'pending': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Lunas';
      case 'partial': return 'Sebagian';
      case 'pending': return 'Belum Bayar';
      default: return status;
    }
  };

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const filteredDebts = debts.filter(debt => 
    filter === 'all' || debt.type === filter
  );

  const renderDebt = ({ item }: { item: Debt }) => {
    const statusColor = getStatusColor(item.status);
    const isDebtOverdue = item.due_date && isOverdue(item.due_date) && item.status !== 'paid';
    
    return (
      <View style={styles.debtItem}>
        <View style={styles.debtHeader}>
          <View style={[
            styles.typeIcon,
            { backgroundColor: item.type === 'debt' ? '#FEE2E2' : '#DCFCE7' }
          ]}>
            <Icon
              name={item.type === 'debt' ? 'trending-down' : 'trending-up'}
              size={24}
              color={item.type === 'debt' ? '#EF4444' : '#10B981'}
            />
          </View>
          <View style={styles.debtInfo}>
            <Text style={styles.debtDescription}>{item.description}</Text>
            <Text style={styles.debtCreditor}>
              {item.type === 'debt' 
                ? `Kepada: ${item.creditor_name}` 
                : `Dari: ${item.debtor_name || item.creditor_name}`
              }
            </Text>
            {item.due_date && (
              <Text style={[
                styles.debtDueDate,
                { color: isDebtOverdue ? '#EF4444' : '#6B7280' }
              ]}>
                Jatuh tempo: {formatDate(item.due_date)}
                {isDebtOverdue && ' (Terlambat)'}
              </Text>
            )}
          </View>
          <View style={styles.debtAmount}>
            <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
            {item.status !== 'paid' && (
              <Text style={styles.remainingText}>
                Sisa: {formatCurrency(item.remaining_amount)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.debtFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          
          {item.status !== 'paid' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${((item.amount - item.remaining_amount) / item.amount) * 100}%`,
                      backgroundColor: statusColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {(((item.amount - item.remaining_amount) / item.amount) * 100).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        {item.interest_rate > 0 && (
          <View style={styles.interestBadge}>
            <Text style={styles.interestText}>Bunga: {item.interest_rate}%</Text>
          </View>
        )}
      </View>
    );
  };

  // Calculate summary
  const summary = debts.reduce((acc, debt) => {
    if (debt.type === 'debt') {
      acc.totalDebts += debt.remaining_amount;
    } else {
      acc.totalReceivables += debt.remaining_amount;
    }
    return acc;
  }, { totalDebts: 0, totalReceivables: 0 });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hutang & Piutang</Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Icon name="trending-down" size={24} color="#EF4444" />
          <Text style={styles.summaryLabel}>Total Hutang</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalDebts)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Icon name="trending-up" size={24} color="#10B981" />
          <Text style={styles.summaryLabel}>Total Piutang</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalReceivables)}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Semua
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'debt' && styles.filterTabActive]}
          onPress={() => setFilter('debt')}
        >
          <Text style={[styles.filterText, filter === 'debt' && styles.filterTextActive]}>
            Hutang
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'receivable' && styles.filterTabActive]}
          onPress={() => setFilter('receivable')}
        >
          <Text style={[styles.filterText, filter === 'receivable' && styles.filterTextActive]}>
            Piutang
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredDebts}
        renderItem={renderDebt}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="credit-card" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>Tidak ada data hutang</Text>
            <Text style={styles.emptyStateSubtext}>
              Belum ada data hutang atau piutang
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 2,
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  debtItem: {
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
  debtHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  debtInfo: {
    flex: 1,
  },
  debtDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  debtCreditor: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  debtDueDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  debtAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  remainingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  debtFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  interestBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  interestText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
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
    textAlign: 'center',
  },
});

export default DebtScreen;