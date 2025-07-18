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

interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'yearly';
  spent: number;
  remaining: number;
  percentage: number;
}

const BudgetScreen = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBudgets = async () => {
    if (!user) return;

    try {
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (budgetError) throw budgetError;

      // Calculate spent amount for each budget
      const budgetsWithSpent = await Promise.all(
        (budgetData || []).map(async (budget) => {
          const startDate = budget.period === 'monthly' 
            ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
            : new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

          const { data: transactions, error: transError } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('category', budget.category)
            .eq('type', 'expense')
            .gte('date', startDate);

          if (transError) {
            console.error('Error fetching transactions:', transError);
          }

          const spent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
          const remaining = Math.max(budget.amount - spent, 0);
          const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

          return {
            ...budget,
            spent,
            remaining,
            percentage,
          };
        })
      );

      setBudgets(budgetsWithSpent);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      Alert.alert('Error', 'Gagal memuat anggaran');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBudgets();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getBudgetStatus = (percentage: number) => {
    if (percentage >= 100) return { color: '#EF4444', status: 'Melebihi', icon: 'warning' };
    if (percentage >= 80) return { color: '#F59E0B', status: 'Hampir Habis', icon: 'schedule' };
    return { color: '#10B981', status: 'Aman', icon: 'check-circle' };
  };

  const renderBudget = ({ item }: { item: Budget }) => {
    const status = getBudgetStatus(item.percentage);
    
    return (
      <View style={styles.budgetItem}>
        <View style={styles.budgetHeader}>
          <View style={styles.budgetInfo}>
            <Text style={styles.budgetCategory}>{item.category}</Text>
            <Text style={styles.budgetPeriod}>
              {item.period === 'monthly' ? 'Bulanan' : 'Tahunan'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Icon name={status.icon} size={16} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.status}
            </Text>
          </View>
        </View>

        <View style={styles.budgetDetails}>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Terpakai</Text>
            <Text style={styles.budgetValue}>{formatCurrency(item.spent)}</Text>
          </View>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Anggaran</Text>
            <Text style={styles.budgetValue}>{formatCurrency(item.amount)}</Text>
          </View>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Sisa</Text>
            <Text style={styles.budgetValue}>{formatCurrency(item.remaining)}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(item.percentage, 100)}%`,
                  backgroundColor: status.color,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: status.color }]}>
            {item.percentage.toFixed(1)}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manajemen Anggaran</Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgets}
        renderItem={renderBudget}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="pie-chart" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>Belum ada anggaran</Text>
            <Text style={styles.emptyStateSubtext}>
              Buat anggaran untuk mengontrol pengeluaran
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
  budgetItem: {
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
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  budgetPeriod: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  budgetDetails: {
    marginBottom: 16,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
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

export default BudgetScreen;