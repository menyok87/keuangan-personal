import { useState, useEffect } from 'react';
import { api, tokenStorage } from '../lib/api';
import { Debt, DebtPayment } from '../types/debt';

export const useDebts = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tokenStorage.get()) {
      fetchDebts();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDebts = async () => {
    try {
      setError(null);
      const data = await api.get('/debts');
      setDebts(data || []);
    } catch (err: any) {
      setError(`Gagal memuat data hutang: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addDebt = async (debt: Omit<Debt, 'id' | 'user_id' | 'remaining_amount' | 'created_at' | 'updated_at'>) => {
    if (!debt.creditor_name?.trim()) throw new Error('Nama kreditor wajib diisi');
    if (!debt.amount || debt.amount <= 0) throw new Error('Jumlah hutang harus lebih dari 0');
    if (!debt.description?.trim()) throw new Error('Deskripsi hutang wajib diisi');
    if (!debt.type || !['debt', 'receivable'].includes(debt.type)) throw new Error('Tipe hutang wajib dipilih');

    try {
      const data = await api.post('/debts', {
        creditor_name: debt.creditor_name.trim(),
        debtor_name: debt.debtor_name?.trim() || null,
        amount: Number(debt.amount),
        description: debt.description.trim(),
        due_date: debt.due_date || null,
        status: debt.status || 'pending',
        type: debt.type,
        interest_rate: Number(debt.interest_rate || 0)
      });
      setDebts(prev => [data, ...prev]);
      setError(null);
      return data;
    } catch (err: any) {
      setError(err.message || 'Gagal menambah hutang');
      throw err;
    }
  };

  const updateDebt = async (id: string, updates: Partial<Debt>) => {
    if (updates.amount !== undefined && updates.amount <= 0) throw new Error('Jumlah hutang harus lebih dari 0');
    if (updates.creditor_name !== undefined && !updates.creditor_name.trim()) throw new Error('Nama kreditor tidak boleh kosong');

    try {
      const data = await api.put(`/debts/${id}`, updates);
      setDebts(prev => prev.map(d => d.id === id ? data : d));
      setError(null);
      return data;
    } catch (err: any) {
      setError(err.message || 'Gagal mengupdate hutang');
      throw err;
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      await api.delete(`/debts/${id}`);
      setDebts(prev => prev.filter(d => d.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus hutang');
      throw err;
    }
  };

  const addPayment = async (debtId: string, payment: Omit<DebtPayment, 'id' | 'debt_id' | 'created_at'>) => {
    if (!payment.amount || payment.amount <= 0) throw new Error('Jumlah pembayaran harus lebih dari 0');
    if (!payment.payment_date) throw new Error('Tanggal pembayaran wajib diisi');

    // Cek sisa hutang dari state lokal
    const debt = debts.find(d => d.id === debtId);
    if (debt && payment.amount > debt.remaining_amount) {
      throw new Error(`Jumlah pembayaran tidak boleh lebih dari sisa hutang (${debt.remaining_amount})`);
    }

    try {
      await api.post(`/debts/${debtId}/payments`, {
        amount: Number(payment.amount),
        payment_date: payment.payment_date,
        notes: payment.notes?.trim() || null
      });
      // Refresh debts untuk mendapatkan status & remaining_amount terbaru
      await fetchDebts();
    } catch (err: any) {
      setError(err.message || 'Gagal menambah pembayaran');
      throw err;
    }
  };

  return {
    debts,
    loading,
    error,
    addDebt,
    updateDebt,
    deleteDebt,
    addPayment,
    refetch: fetchDebts
  };
};
