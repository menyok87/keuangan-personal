import { useState, useEffect } from 'react';
import { api, tokenStorage } from '../lib/api';
import { Budget } from '../types';

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tokenStorage.get()) {
      fetchBudgets();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchBudgets = async () => {
    try {
      setError(null);
      // Backend sudah hitung spent, remaining, percentage via SQL JOIN
      const data = await api.get('/budgets');
      setBudgets(data || []);
    } catch (err: any) {
      setError(`Gagal memuat anggaran: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'spent' | 'remaining' | 'percentage'>) => {
    if (!budget.category?.trim()) throw new Error('Kategori anggaran wajib dipilih');
    if (!budget.amount || budget.amount <= 0) throw new Error('Jumlah anggaran harus lebih dari 0');
    if (!budget.period || !['monthly', 'yearly'].includes(budget.period)) throw new Error('Periode anggaran wajib dipilih');

    try {
      await api.post('/budgets', {
        category: budget.category.trim(),
        amount: Number(budget.amount),
        period: budget.period
      });
      // Fetch ulang untuk dapat data dengan spent/remaining/percentage yang akurat
      await fetchBudgets();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal menambah anggaran');
      throw err;
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    if (updates.amount !== undefined && updates.amount <= 0) throw new Error('Jumlah anggaran harus lebih dari 0');
    if (updates.category !== undefined && !updates.category.trim()) throw new Error('Kategori anggaran tidak boleh kosong');

    try {
      await api.put(`/budgets/${id}`, updates);
      // Fetch ulang untuk dapat data dengan spent/remaining/percentage yang akurat
      await fetchBudgets();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal mengupdate anggaran');
      throw err;
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await api.delete(`/budgets/${id}`);
      setBudgets(prev => prev.filter(b => b.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus anggaran');
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
