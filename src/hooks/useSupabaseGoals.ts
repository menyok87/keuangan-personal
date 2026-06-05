import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
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
    if (!userId) { setLoading(false); return; }
    try {
      setError(null);
      const { data, error } = await apiClient.get<FinancialGoal[]>('/goals');
      if (error) {
        setError(`Gagal memuat target keuangan: ${error.message}`);
      } else {
        setGoals((data || []).map(g => ({
          ...g,
          target_amount: parseFloat(String(g.target_amount)),
          current_amount: parseFloat(String(g.current_amount || 0))
        })));
      }
    } catch (err: any) {
      setError('Terjadi kesalahan saat memuat target keuangan');
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (goal: Omit<FinancialGoal, 'id'>) => {
    if (!userId) throw new Error('User tidak ditemukan. Silakan login ulang.');

    if (!goal.title?.trim()) throw new Error('Nama target keuangan wajib diisi');
    if (!goal.target_amount || goal.target_amount <= 0) throw new Error('Target jumlah harus lebih dari 0');
    if (!goal.deadline) throw new Error('Target tanggal wajib diisi');
    if (!goal.category?.trim()) throw new Error('Kategori target wajib dipilih');

    try {
      const { data, error } = await apiClient.post('/goals', {
        title: goal.title.trim(),
        target_amount: Number(goal.target_amount),
        current_amount: Number(goal.current_amount || 0),
        deadline: goal.deadline,
        category: goal.category.trim(),
        priority: goal.priority || 'medium'
      });

      if (error) throw new Error(`Gagal menyimpan target keuangan: ${error.message}`);

      const mapped = mapGoal(data);
      setGoals(prev => [mapped, ...prev]);
      setError(null);
      return mapped;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateGoal = async (id: string, updates: Partial<FinancialGoal>) => {
    if (!userId) throw new Error('User tidak ditemukan. Silakan login ulang.');

    if (updates.target_amount !== undefined && updates.target_amount <= 0) throw new Error('Target jumlah harus lebih dari 0');
    if (updates.title !== undefined && !updates.title.trim()) throw new Error('Nama target tidak boleh kosong');

    try {
      const { data, error } = await apiClient.put(`/goals/${id}`, {
        ...(updates.title !== undefined && { title: updates.title.trim() }),
        ...(updates.target_amount !== undefined && { target_amount: Number(updates.target_amount) }),
        ...(updates.current_amount !== undefined && { current_amount: Number(updates.current_amount) }),
        ...(updates.deadline !== undefined && { deadline: updates.deadline }),
        ...(updates.category !== undefined && { category: updates.category.trim() }),
        ...(updates.priority !== undefined && { priority: updates.priority })
      });

      if (error) throw new Error(`Gagal mengupdate target keuangan: ${error.message}`);

      const mapped = mapGoal(data);
      setGoals(prev => prev.map(g => g.id === id ? mapped : g));
      setError(null);
      return mapped;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteGoal = async (id: string) => {
    if (!userId) throw new Error('User tidak ditemukan. Silakan login ulang.');

    try {
      const { error } = await apiClient.delete(`/goals/${id}`);
      if (error) throw new Error(`Gagal menghapus target keuangan: ${error.message}`);

      setGoals(prev => prev.filter(g => g.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
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

function mapGoal(row: any): FinancialGoal {
  return {
    id: row.id,
    title: row.title,
    target_amount: parseFloat(row.target_amount),
    current_amount: parseFloat(row.current_amount || 0),
    deadline: row.deadline,
    category: row.category,
    priority: row.priority || 'medium'
  };
}
