import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Budget } from '../types';

export const useSupabaseBudgets = (userId: string | undefined) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchBudgets();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchBudgets = async () => {
    if (!userId) {
      console.log('❌ No user ID provided for fetchBudgets');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Fetching budgets for user:', userId);
      setError(null);
      
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching budgets:', error);
        setError(`Gagal memuat anggaran: ${error.message}`);
      } else {
        console.log('✅ Budgets fetched successfully:', data?.length || 0, 'items');
        
        // Calculate spent, remaining, and percentage for each budget
        const budgetsWithCalculations = await Promise.all(
          (data || []).map(async (budget) => {
            // Get transactions for this category in the current period
            const { data: transactions, error: transError } = await supabase
              .from('transactions')
              .select('amount')
              .eq('user_id', userId)
              .eq('category', budget.category)
              .eq('type', 'expense')
              .gte('date', getStartOfPeriod(budget.period));

            if (transError) {
              console.error('Error fetching transactions for budget:', transError);
            }

            const spent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
            const remaining = Math.max(budget.amount - spent, 0);
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

            return {
              ...budget,
              spent,
              remaining,
              percentage
            };
          })
        );

        setBudgets(budgetsWithCalculations);
      }
    } catch (error: any) {
      console.error('❌ Error in fetchBudgets:', error);
      setError('Terjadi kesalahan saat memuat anggaran');
    } finally {
      setLoading(false);
    }
  };

  const getStartOfPeriod = (period: 'monthly' | 'yearly') => {
    const now = new Date();
    if (period === 'monthly') {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else {
      return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'spent' | 'remaining' | 'percentage'>) => {
    if (!userId) {
      throw new Error('❌ User tidak ditemukan. Silakan login ulang.');
    }

    try {
      console.log('🚀 === ADDING BUDGET START ===');
      console.log('👤 User ID:', userId);
      console.log('📝 Budget data received:', budget);
      
      // Enhanced validation
      const validationErrors = [];
      
      if (!budget.category?.trim()) {
        validationErrors.push('Kategori anggaran wajib dipilih');
      }
      
      if (!budget.amount || budget.amount <= 0) {
        validationErrors.push('Jumlah anggaran harus lebih dari 0');
      }
      
      if (!budget.period || !['monthly', 'yearly'].includes(budget.period)) {
        validationErrors.push('Periode anggaran wajib dipilih');
      }

      if (validationErrors.length > 0) {
        console.log('❌ Validation failed with errors:', validationErrors);
        throw new Error(validationErrors.join(', '));
      }

      // Check if budget already exists for this category and period
      const { data: existingBudget, error: checkError } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', userId)
        .eq('category', budget.category.trim())
        .eq('period', budget.period)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing budget:', checkError);
        throw new Error('Gagal memeriksa anggaran yang sudah ada');
      }

      if (existingBudget) {
        throw new Error(`Anggaran untuk kategori "${budget.category}" dengan periode ${budget.period} sudah ada`);
      }

      // Prepare budget data
      const budgetData = {
        user_id: userId,
        category: budget.category.trim(),
        amount: Number(budget.amount),
        period: budget.period
      };

      console.log('📋 Prepared budget data:', budgetData);

      // Insert budget
      const { data, error } = await supabase
        .from('budgets')
        .insert([budgetData])
        .select()
        .single();

      if (error) {
        console.error('❌ Insert error details:', error);
        
        if (error.code === '23503') {
          throw new Error('❌ User profile tidak valid. Silakan logout dan login ulang.');
        } else if (error.code === '42501') {
          throw new Error('❌ Tidak memiliki izin untuk menambah anggaran.');
        } else if (error.message.includes('violates row-level security')) {
          throw new Error('❌ Akses ditolak oleh sistem keamanan. Silakan login ulang.');
        } else {
          throw new Error(`❌ Gagal menyimpan anggaran: ${error.message}`);
        }
      }
      
      if (!data) {
        throw new Error('❌ Tidak ada data yang dikembalikan setelah insert.');
      }

      console.log('✅ Budget inserted successfully:', data);
      
      // Calculate initial values
      const budgetWithCalculations = {
        ...data,
        spent: 0,
        remaining: data.amount,
        percentage: 0
      };
      
      // Update local state
      setBudgets(prev => [budgetWithCalculations, ...prev]);
      setError(null);
      
      console.log('🎉 === ADDING BUDGET SUCCESS ===');
      return budgetWithCalculations;
      
    } catch (error: any) {
      console.error('💥 === ADDING BUDGET ERROR ===');
      console.error('Error message:', error.message);
      setError(error.message || 'Gagal menambah anggaran');
      throw error;
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    if (!userId) {
      throw new Error('❌ User tidak ditemukan. Silakan login ulang.');
    }

    try {
      console.log('🔄 === UPDATING BUDGET ===');
      console.log('🆔 Budget ID:', id);
      console.log('📝 Updates:', updates);
      
      // Validate updates
      if (updates.amount !== undefined && updates.amount <= 0) {
        throw new Error('Jumlah anggaran harus lebih dari 0');
      }
      
      if (updates.category !== undefined && !updates.category.trim()) {
        throw new Error('Kategori anggaran tidak boleh kosong');
      }

      // Prepare update data
      const updateData = {
        updated_at: new Date().toISOString(),
        ...(updates.amount !== undefined && { amount: Number(updates.amount) }),
        ...(updates.category !== undefined && { category: updates.category.trim() }),
        ...(updates.period !== undefined && { period: updates.period })
      };

      console.log('📋 Prepared update data:', updateData);

      // Update the budget
      const { data, error } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating budget:', error);
        
        if (error.code === 'PGRST116') {
          throw new Error('❌ Anggaran tidak ditemukan atau sudah dihapus');
        } else if (error.code === '42501') {
          throw new Error('❌ Tidak memiliki izin untuk mengupdate anggaran');
        } else if (error.message.includes('violates row-level security')) {
          throw new Error('❌ Akses ditolak oleh sistem keamanan');
        } else {
          throw new Error(`❌ Gagal mengupdate anggaran: ${error.message}`);
        }
      }
      
      if (!data) {
        throw new Error('❌ Anggaran tidak ditemukan atau tidak dapat diupdate');
      }

      console.log('✅ Budget updated successfully:', data);
      
      // Recalculate spent, remaining, and percentage
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('category', data.category)
        .eq('type', 'expense')
        .gte('date', getStartOfPeriod(data.period));

      const spent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const remaining = Math.max(data.amount - spent, 0);
      const percentage = data.amount > 0 ? (spent / data.amount) * 100 : 0;

      const updatedBudget = {
        ...data,
        spent,
        remaining,
        percentage
      };
      
      // Update local state
      setBudgets(prev => prev.map(b => b.id === id ? updatedBudget : b));
      setError(null);
      
      console.log('🎉 === UPDATING BUDGET SUCCESS ===');
      return updatedBudget;
    } catch (error: any) {
      console.error('💥 === UPDATING BUDGET ERROR ===');
      console.error('Error message:', error.message);
      setError(error.message || 'Gagal mengupdate anggaran');
      throw error;
    }
  };

  const deleteBudget = async (id: string) => {
    if (!userId) {
      throw new Error('❌ User tidak ditemukan. Silakan login ulang.');
    }

    try {
      console.log('🗑️ === DELETING BUDGET ===');
      console.log('🆔 Budget ID:', id);
      
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error deleting budget:', error);
        
        if (error.code === 'PGRST116') {
          throw new Error('❌ Anggaran tidak ditemukan atau sudah dihapus');
        } else if (error.code === '42501') {
          throw new Error('❌ Tidak memiliki izin untuk menghapus anggaran');
        } else {
          throw new Error(`❌ Gagal menghapus anggaran: ${error.message}`);
        }
      }

      console.log('✅ Budget deleted successfully from database');
      
      // Remove from local state
      setBudgets(prev => prev.filter(b => b.id !== id));
      setError(null);
      
      console.log('🎉 === DELETING BUDGET SUCCESS ===');
      
    } catch (error: any) {
      console.error('💥 === DELETING BUDGET ERROR ===');
      console.error('Error message:', error.message);
      setError(error.message || 'Gagal menghapus anggaran');
      throw error;
    }
  };

  return {
    budgets,
    loading,
    error,
    addBudget,
    updateBudget,
    deleteBudget,
    refetch: fetchBudgets
  };
};