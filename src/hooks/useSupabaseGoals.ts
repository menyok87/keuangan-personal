import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FinancialGoal } from '../types';

export const useSupabaseGoals = (userId: string | undefined) => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchGoals();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchGoals = async () => {
    if (!userId) {
      console.log('❌ No user ID provided for fetchGoals');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Fetching financial goals for user:', userId);
      setError(null);
      
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching goals:', error);
        setError(`Gagal memuat target keuangan: ${error.message}`);
      } else {
        console.log('✅ Goals fetched successfully:', data?.length || 0, 'items');
        setGoals(data || []);
      }
    } catch (error: any) {
      console.error('❌ Error in fetchGoals:', error);
      setError('Terjadi kesalahan saat memuat target keuangan');
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (goal: Omit<FinancialGoal, 'id'>) => {
    if (!userId) {
      throw new Error('❌ User tidak ditemukan. Silakan login ulang.');
    }

    try {
      console.log('🚀 === ADDING FINANCIAL GOAL START ===');
      console.log('👤 User ID:', userId);
      console.log('📝 Goal data received:', goal);
      
      // Enhanced validation
      const validationErrors = [];
      
      if (!goal.title?.trim()) {
        validationErrors.push('Nama target keuangan wajib diisi');
      }
      
      if (!goal.target_amount || goal.target_amount <= 0) {
        validationErrors.push('Target jumlah harus lebih dari 0');
      }
      
      if (goal.current_amount < 0) {
        validationErrors.push('Jumlah saat ini tidak boleh negatif');
      }
      
      if (goal.current_amount > goal.target_amount) {
        validationErrors.push('Jumlah saat ini tidak boleh lebih dari target');
      }
      
      if (!goal.deadline) {
        validationErrors.push('Target tanggal wajib diisi');
      } else {
        const deadlineDate = new Date(goal.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (deadlineDate < today) {
          validationErrors.push('Target tanggal tidak boleh di masa lalu');
        }
      }
      
      if (!goal.category?.trim()) {
        validationErrors.push('Kategori target wajib dipilih');
      }
      
      if (!goal.priority || !['low', 'medium', 'high'].includes(goal.priority)) {
        validationErrors.push('Prioritas target wajib dipilih');
      }

      if (validationErrors.length > 0) {
        console.log('❌ Validation failed with errors:', validationErrors);
        throw new Error(validationErrors.join(', '));
      }

      // Prepare goal data
      const goalData = {
        user_id: userId,
        title: goal.title.trim(),
        target_amount: Number(goal.target_amount),
        current_amount: Number(goal.current_amount || 0),
        deadline: goal.deadline,
        category: goal.category.trim(),
        priority: goal.priority
      };

      console.log('📋 Prepared goal data:', goalData);

      // Insert goal
      const { data, error } = await supabase
        .from('financial_goals')
        .insert([goalData])
        .select()
        .single();

      if (error) {
        console.error('❌ Insert error details:', error);
        
        if (error.code === '23503') {
          throw new Error('❌ User profile tidak valid. Silakan logout dan login ulang.');
        } else if (error.code === '42501') {
          throw new Error('❌ Tidak memiliki izin untuk menambah target keuangan.');
        } else if (error.message.includes('violates row-level security')) {
          throw new Error('❌ Akses ditolak oleh sistem keamanan. Silakan login ulang.');
        } else {
          throw new Error(`❌ Gagal menyimpan target keuangan: ${error.message}`);
        }
      }
      
      if (!data) {
        throw new Error('❌ Tidak ada data yang dikembalikan setelah insert.');
      }

      console.log('✅ Goal inserted successfully:', data);
      
      // Update local state
      setGoals(prev => [data, ...prev]);
      setError(null);
      
      console.log('🎉 === ADDING FINANCIAL GOAL SUCCESS ===');
      return data;
      
    } catch (error: any) {
      console.error('💥 === ADDING FINANCIAL GOAL ERROR ===');
      console.error('Error message:', error.message);
      setError(error.message || 'Gagal menambah target keuangan');
      throw error;
    }
  };

  const updateGoal = async (id: string, updates: Partial<FinancialGoal>) => {
    if (!userId) {
      throw new Error('❌ User tidak ditemukan. Silakan login ulang.');
    }

    try {
      console.log('🔄 === UPDATING FINANCIAL GOAL ===');
      console.log('🆔 Goal ID:', id);
      console.log('📝 Updates:', updates);
      
      // Validate updates
      if (updates.target_amount !== undefined && updates.target_amount <= 0) {
        throw new Error('Target jumlah harus lebih dari 0');
      }
      
      if (updates.current_amount !== undefined && updates.current_amount < 0) {
        throw new Error('Jumlah saat ini tidak boleh negatif');
      }
      
      if (updates.title !== undefined && !updates.title.trim()) {
        throw new Error('Nama target tidak boleh kosong');
      }
      
      if (updates.deadline !== undefined) {
        const deadlineDate = new Date(updates.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (deadlineDate < today) {
          throw new Error('Target tanggal tidak boleh di masa lalu');
        }
      }

      // Prepare update data
      const updateData = {
        updated_at: new Date().toISOString(),
        ...(updates.target_amount !== undefined && { target_amount: Number(updates.target_amount) }),
        ...(updates.current_amount !== undefined && { current_amount: Number(updates.current_amount) }),
        ...(updates.title !== undefined && { title: updates.title.trim() }),
        ...(updates.category !== undefined && { category: updates.category.trim() }),
        ...(updates.deadline !== undefined && { deadline: updates.deadline }),
        ...(updates.priority !== undefined && { priority: updates.priority })
      };

      console.log('📋 Prepared update data:', updateData);

      // Update the goal
      const { data, error } = await supabase
        .from('financial_goals')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating goal:', error);
        
        if (error.code === 'PGRST116') {
          throw new Error('❌ Target keuangan tidak ditemukan atau sudah dihapus');
        } else if (error.code === '42501') {
          throw new Error('❌ Tidak memiliki izin untuk mengupdate target keuangan');
        } else if (error.message.includes('violates row-level security')) {
          throw new Error('❌ Akses ditolak oleh sistem keamanan');
        } else {
          throw new Error(`❌ Gagal mengupdate target keuangan: ${error.message}`);
        }
      }
      
      if (!data) {
        throw new Error('❌ Target keuangan tidak ditemukan atau tidak dapat diupdate');
      }

      console.log('✅ Goal updated successfully:', data);
      
      // Update local state
      setGoals(prev => prev.map(g => g.id === id ? data : g));
      setError(null);
      
      console.log('🎉 === UPDATING GOAL SUCCESS ===');
      return data;
    } catch (error: any) {
      console.error('💥 === UPDATING GOAL ERROR ===');
      console.error('Error message:', error.message);
      setError(error.message || 'Gagal mengupdate target keuangan');
      throw error;
    }
  };

  const deleteGoal = async (id: string) => {
    if (!userId) {
      throw new Error('❌ User tidak ditemukan. Silakan login ulang.');
    }

    try {
      console.log('🗑️ === DELETING FINANCIAL GOAL ===');
      console.log('🆔 Goal ID:', id);
      
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error deleting goal:', error);
        
        if (error.code === 'PGRST116') {
          throw new Error('❌ Target keuangan tidak ditemukan atau sudah dihapus');
        } else if (error.code === '42501') {
          throw new Error('❌ Tidak memiliki izin untuk menghapus target keuangan');
        } else {
          throw new Error(`❌ Gagal menghapus target keuangan: ${error.message}`);
        }
      }

      console.log('✅ Goal deleted successfully from database');
      
      // Remove from local state
      setGoals(prev => prev.filter(g => g.id !== id));
      setError(null);
      
      console.log('🎉 === DELETING GOAL SUCCESS ===');
      
    } catch (error: any) {
      console.error('💥 === DELETING GOAL ERROR ===');
      console.error('Error message:', error.message);
      setError(error.message || 'Gagal menghapus target keuangan');
      throw error;
    }
  };

  const updateGoalProgress = async (id: string, newAmount: number) => {
    return updateGoal(id, { current_amount: newAmount });
  };

  return {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
    refetch: fetchGoals
  };
};