import { useState, useEffect } from 'react';
import { api, tokenStorage } from '../lib/api';
import { FinancialGoal } from '../types';

export const useGoals = () => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tokenStorage.get()) {
      fetchGoals();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchGoals = async () => {
    try {
      setError(null);
      const data = await api.get('/goals');
      setGoals(data || []);
    } catch (err: any) {
      setError(`Gagal memuat target keuangan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (goal: Omit<FinancialGoal, 'id'>) => {
    if (!goal.title?.trim()) throw new Error('Nama target keuangan wajib diisi');
    if (!goal.target_amount || goal.target_amount <= 0) throw new Error('Target jumlah harus lebih dari 0');
    if ((goal.current_amount || 0) < 0) throw new Error('Jumlah saat ini tidak boleh negatif');
    if (!goal.deadline) throw new Error('Target tanggal wajib diisi');
    if (!goal.category?.trim()) throw new Error('Kategori target wajib dipilih');

    try {
      const data = await api.post('/goals', {
        title: goal.title.trim(),
        target_amount: Number(goal.target_amount),
        current_amount: Number(goal.current_amount || 0),
        deadline: goal.deadline,
        category: goal.category.trim(),
        priority: goal.priority || 'medium'
      });
      setGoals(prev => [data, ...prev]);
      setError(null);
      return data;
    } catch (err: any) {
      setError(err.message || 'Gagal menambah target keuangan');
      throw err;
    }
  };

  const updateGoal = async (id: string, updates: Partial<FinancialGoal>) => {
    if (updates.target_amount !== undefined && updates.target_amount <= 0) throw new Error('Target jumlah harus lebih dari 0');
    if (updates.current_amount !== undefined && updates.current_amount < 0) throw new Error('Jumlah saat ini tidak boleh negatif');
    if (updates.title !== undefined && !updates.title.trim()) throw new Error('Nama target tidak boleh kosong');

    try {
      const data = await api.put(`/goals/${id}`, updates);
      setGoals(prev => prev.map(g => g.id === id ? data : g));
      setError(null);
      return data;
    } catch (err: any) {
      setError(err.message || 'Gagal mengupdate target keuangan');
      throw err;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await api.delete(`/goals/${id}`);
      setGoals(prev => prev.filter(g => g.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus target keuangan');
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
