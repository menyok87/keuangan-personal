import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
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
    if (!userId) { setLoading(false); return; }
    try {
      setError(null);
      const { data, error } = await apiClient.get<any[]>('/budgets');
      if (error) {
        setError(`Gagal memuat anggaran: ${error.message}`);
      } else {
        setBudgets((data || []).map(mapBudget));
      }
    } catch (err: any) {
      setError('Terjadi kesalahan saat memuat anggaran');
    } finally {
      setLoading(false);
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'spent' | 'remaining' | 'percentage'>) => {
    if (!userId) throw new Error('User tidak ditemukan. Silakan login ulang.');

    if (!budget.category?.trim()) throw new Error('Kategori anggaran wajib dipilih');
    if (!budget.amount || budget.amount <= 0) throw new Error('Jumlah anggaran harus lebih dari 0');

    try {
      const { data, error } = await apiClient.post('/budgets', {
        category: budget.category.trim(),
        amount: Number(budget.amount),
        period: budget.period || 'monthly'
      });

      if (error) throw new Error(`Gagal menyimpan anggaran: ${error.message}`);

      const mapped = mapBudget(data);
      setBudgets(prev => [mapped, ...prev]);
      setError(null);
      return mapped;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    if (!userId) throw new Error('User tidak ditemukan. Silakan login ulang.');

    if (updates.amount !== undefined && updates.amount <= 0) throw new Error('Jumlah anggaran harus lebih dari 0');
    if (updates.category !== undefined && !updates.category.trim()) throw new Error('Kategori tidak boleh kosong');

    try {
      const { data, error } = await apiClient.put(`/budgets/${id}`, {
        ...(updates.category !== undefined && { category: updates.category.trim() }),
        ...(updates.amount !== undefined && { amount: Number(updates.amount) }),
        ...(updates.period !== undefined && { period: updates.period })
      });

      if (error) throw new Error(`Gagal mengupdate anggaran: ${error.message}`);

      const mapped = mapBudget(data);
      setBudgets(prev => prev.map(b => b.id === id ? mapped : b));
      setError(null);
      return mapped;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteBudget = async (id: string) => {
    if (!userId) throw new Error('User tidak ditemukan. Silakan login ulang.');

    try {
      const { error } = await apiClient.delete(`/budgets/${id}`);
      if (error) throw new Error(`Gagal menghapus anggaran: ${error.message}`);

      setBudgets(prev => prev.filter(b => b.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
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

function mapBudget(row: any): Budget {
  return {
    id: row.id,
    category: row.category,
    amount: parseFloat(row.amount),
    period: row.period || 'monthly',
    spent: parseFloat(row.spent || 0),
    remaining: parseFloat(row.remaining ?? row.amount),
    percentage: parseFloat(row.percentage || 0)
  };
}
