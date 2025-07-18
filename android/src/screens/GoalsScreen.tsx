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

interface FinancialGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

const GoalsScreen = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      Alert.alert('Error', 'Gagal memuat target keuangan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGoals();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      case 'low': return 'Rendah';
      default: return priority;
    }
  };

  const renderGoal = ({ item }: { item: FinancialGoal }) => {
    const progress = getProgressPercentage(item.current_amount, item.target_amount);
    const daysRemaining = getDaysRemaining(item.deadline);
    const isOverdue = daysRemaining < 0;
    const priorityColor = getPriorityColor(item.priority);
    
    return (
      <View style={styles.goalItem}>
        <View style={styles.goalHeader}>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{item.title}</Text>
            <Text style={styles.goalCategory}>{item.category}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {getPriorityLabel(item.priority)}
            </Text>
          </View>
        </View>

        <View style={styles.goalProgress}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercentage}>{progress.toFixed(1)}%</Text>
          </View>
          
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: progress >= 100 ? '#10B981' :
                                 progress >= 75 ? '#3B82F6' :
                                 progress >= 50 ? '#F59E0B' : '#EF4444',
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.goalDetails}>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Terkumpul</Text>
            <Text style={styles.goalValue}>{formatCurrency(item.current_amount)}</Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Target</Text>
            <Text style={styles.goalValue}>{formatCurrency(item.target_amount)}</Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Sisa</Text>
            <Text style={styles.goalValue}>
              {formatCurrency(Math.max(item.target_amount - item.current_amount, 0))}
            </Text>
          </View>
        </View>

        <View style={styles.goalFooter}>
          <View style={styles.deadlineInfo}>
            <Icon name="schedule" size={16} color="#6B7280" />
            <Text style={styles.deadlineText}>
              {new Date(item.deadline).toLocaleDateString('id-ID')}
            </Text>
          </View>
          <Text style={[
            styles.daysRemaining,
            { color: isOverdue ? '#EF4444' : daysRemaining <= 30 ? '#F59E0B' : '#6B7280' }
          ]}>
            {isOverdue ? `${Math.abs(daysRemaining)} hari terlambat` :
             daysRemaining === 0 ? 'Hari ini' :
             `${daysRemaining} hari lagi`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Target Keuangan</Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="flag" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>Belum ada target keuangan</Text>
            <Text style={styles.emptyStateSubtext}>
              Tetapkan target untuk mencapai impian Anda
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
  goalItem: {
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
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  goalCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  goalProgress: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalDetails: {
    marginBottom: 16,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  deadlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  daysRemaining: {
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

export default GoalsScreen;