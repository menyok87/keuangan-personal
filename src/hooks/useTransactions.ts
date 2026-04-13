import { useState, useEffect } from 'react';
import { api, tokenStorage } from '../lib/api';
import { Transaction } from '../types';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tokenStorage.get()) {
      fetchTransactions();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = async () => {
    try {
      setError(null);
      const data = await api.get('/transactions');
      setTransactions(data || []);
    } catch (err: any) {
      setError(`Gagal memuat transaksi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!transaction.amount || transaction.amount <= 0) throw new Error('Jumlah transaksi harus lebih dari 0');
    if (!transaction.description?.trim()) throw new Error('Deskripsi transaksi wajib diisi');
    if (!transaction.category?.trim()) throw new Error('Kategori transaksi wajib dipilih');
    if (!transaction.type || !['income', 'expense'].includes(transaction.type)) throw new Error('Tipe transaksi wajib dipilih');
    if (!transaction.date) throw new Error('Tanggal transaksi wajib diisi');

    try {
      const payload = {
        amount: Number(transaction.amount),
        description: transaction.description.trim(),
        category: transaction.category.trim(),
        subcategory: transaction.subcategory?.trim() || null,
        type: transaction.type,
        date: transaction.date,
        payment_method: (transaction as any).payment_method || (transaction as any).paymentMethod || 'cash',
        tags: Array.isArray(transaction.tags) ? transaction.tags : [],
        notes: transaction.notes?.trim() || null,
        location: transaction.location?.trim() || null,
        is_recurring: Boolean(transaction.is_recurring),
        recurring_frequency: transaction.is_recurring ? transaction.recurring_frequency : null
      };

      const data = await api.post('/transactions', payload);
      setTransactions(prev => [data, ...prev]);
      setError(null);
      return data;
    } catch (err: any) {
      setError(err.message || 'Gagal menambah transaksi');
      throw err;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (updates.amount !== undefined && updates.amount <= 0) throw new Error('Jumlah transaksi harus lebih dari 0');

    try {
      const payload: Record<string, any> = {};
      if (updates.amount !== undefined) payload.amount = Number(updates.amount);
      if (updates.description !== undefined) payload.description = updates.description.trim();
      if (updates.category !== undefined) payload.category = updates.category.trim();
      if (updates.subcategory !== undefined) payload.subcategory = updates.subcategory?.trim() || null;
      if (updates.type !== undefined) payload.type = updates.type;
      if (updates.date !== undefined) payload.date = updates.date;
      if ((updates as any).paymentMethod !== undefined) payload.payment_method = (updates as any).paymentMethod;
      if ((updates as any).payment_method !== undefined) payload.payment_method = (updates as any).payment_method;
      if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;
      if (updates.location !== undefined) payload.location = updates.location?.trim() || null;
      if (updates.tags !== undefined) payload.tags = Array.isArray(updates.tags) ? updates.tags : [];
      if (updates.is_recurring !== undefined) payload.is_recurring = Boolean(updates.is_recurring);
      if (updates.recurring_frequency !== undefined) payload.recurring_frequency = updates.is_recurring ? updates.recurring_frequency : null;

      const data = await api.put(`/transactions/${id}`, payload);
      setTransactions(prev => prev.map(t => t.id === id ? data : t));
      setError(null);
      return data;
    } catch (err: any) {
      setError(err.message || 'Gagal mengupdate transaksi');
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus transaksi');
      throw err;
    }
  };

  const forceRefresh = async () => {
    setLoading(true);
    setError(null);
    await fetchTransactions();
  };

  return {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
    forceRefresh
  };
};
