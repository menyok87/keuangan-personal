import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Transaction } from '../types';

export const useSupabaseTransactions = (userId: string | undefined) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchTransactions();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchTransactions = async () => {
    if (!userId) { setLoading(false); return; }
    try {
      setError(null);
      const { data, error } = await apiClient.get<any[]>('/transactions');
      if (error) {
        setError(`Gagal memuat transaksi: ${error.message}`);
      } else {
        // Map snake_case dari DB ke camelCase yang dipakai frontend
        setTransactions((data || []).map(mapTransaction));
      }
    } catch (err: any) {
      setError('Terjadi kesalahan saat memuat transaksi');
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!userId) throw new Error('User tidak ditemukan. Silakan login ulang.');

    if (!transaction.amount || transaction.amount <= 0) throw new Error('Jumlah transaksi harus lebih dari 0');
    if (!transaction.description?.trim()) throw new Error('Deskripsi transaksi wajib diisi');
    if (!transaction.category?.trim()) throw new Error('Kategori transaksi wajib dipilih');
    if (!transaction.type) throw new Error('Tipe transaksi wajib dipilih');
    if (!transaction.date) throw new Error('Tanggal transaksi wajib diisi');

    try {
      const { data, error } = await apiClient.post('/transactions', {
        amount: Number(transaction.amount),
        description: transaction.description.trim(),
        category: transaction.category.trim(),
        subcategory: transaction.subcategory?.trim() || null,
        type: transaction.type,
        date: transaction.date,
        payment_method: transaction.paymentMethod || 'cash',
        tags: Array.isArray(transaction.tags) ? transaction.tags : [],
        notes: transaction.notes?.trim() || null,
        location: transaction.location?.trim() || null,
        is_recurring: Boolean(transaction.is_recurring),
        recurring_frequency: transaction.is_recurring ? transaction.recurring_frequency : null
      });

      if (error) throw new Error(`Gagal menyimpan transaksi: ${error.message}`);

      const mapped = mapTransaction(data);
      setTransactions(prev => [mapped, ...prev]);
      setError(null);
      return mapped;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!userId) throw new Error('User tidak ditemukan. Silakan login ulang.');

    if (updates.amount !== undefined && updates.amount <= 0) throw new Error('Jumlah harus lebih dari 0');

    try {
      const { data, error } = await apiClient.put(`/transactions/${id}`, {
        ...(updates.amount !== undefined && { amount: Number(updates.amount) }),
        ...(updates.description !== undefined && { description: updates.description.trim() }),
        ...(updates.category !== undefined && { category: updates.category.trim() }),
        ...(updates.subcategory !== undefined && { subcategory: updates.subcategory?.trim() || null }),
        ...(updates.type !== undefined && { type: updates.type }),
        ...(updates.date !== undefined && { date: updates.date }),
        ...(updates.paymentMethod !== undefined && { payment_method: updates.paymentMethod }),
        ...(updates.notes !== undefined && { notes: updates.notes?.trim() || null }),
        ...(updates.location !== undefined && { location: updates.location?.trim() || null }),
        ...(updates.tags !== undefined && { tags: updates.tags }),
        ...(updates.is_recurring !== undefined && { is_recurring: updates.is_recurring }),
        ...(updates.recurring_frequency !== undefined && { recurring_frequency: updates.recurring_frequency })
      });

      if (error) throw new Error(`Gagal mengupdate transaksi: ${error.message}`);

      const mapped = mapTransaction(data);
      setTransactions(prev => prev.map(t => t.id === id ? mapped : t));
      setError(null);
      return mapped;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!userId) throw new Error('User tidak ditemukan. Silakan login ulang.');

    try {
      const { error } = await apiClient.delete(`/transactions/${id}`);
      if (error) throw new Error(`Gagal menghapus transaksi: ${error.message}`);

      setTransactions(prev => prev.filter(t => t.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.message);
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

// DB menggunakan payment_method, frontend menggunakan paymentMethod
function mapTransaction(row: any): Transaction {
  return {
    ...row,
    paymentMethod: row.payment_method || row.paymentMethod || 'cash',
    amount: parseFloat(row.amount),
    tags: row.tags || [],
    is_recurring: Boolean(row.is_recurring)
  };
}
