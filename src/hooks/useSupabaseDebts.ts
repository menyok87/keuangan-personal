import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Debt, DebtPayment } from '../types/debt';

export const useSupabaseDebts = (userId: string | undefined) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchDebts();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchDebts = async () => {
    if (!userId) { setLoading(false); return; }
    try {
      setError(null);
      const { data, error } = await apiClient.get<Debt[]>('/debts');
      if (error) {
        setError(`Gagal memuat data hutang: ${error.message}`);
      } else {
        setDebts((data || []).map(mapDebt));
      }
    } catch (err: any) {
      setError('Terjadi kesalahan saat memuat data hutang');
    } finally {
      setLoading(false);
    }
  };

  const addDebt = async (debt: Omit<Debt, 'id' | 'user_id' | 'remaining_amount' | 'created_at' | 'updated_at'>) => {
    if (!userId) throw new Error('User tidak ditemukan. Silakan login ulang.');

    if (!debt.creditor_name?.trim()) throw new Error('Nama kreditor wajib diisi');
    if (!debt.amount || debt.amount <= 0) throw new Error('Jumlah hutang harus lebih dari 0');
    if (!debt.description?.trim()) throw new Error('Deskripsi hutang wajib diisi');
    if (!debt.type) throw new Error('Tipe hutang wajib dipilih');

    try {
      const { data, error } = await apiClient.post('/debts', {
        creditor_name: debt.creditor_name.trim(),
        debtor_name: debt.debtor_name?.trim() || null,
        amount: Number(debt.amount),
        description: debt.description.trim(),
        due_date: debt.due_date || null,
        status: debt.status || 'pending',
        type: debt.type,
        interest_rate: Number(debt.interest_rate || 0)
      });

      if (error) throw new Error(`Gagal menyimpan hutang: ${error.message}`);

      const mapped = mapDebt(data);
      setDebts(prev => [mapped, ...prev]);
      setError(null);
      return mapped;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateDebt = async (id: string, updates: Partial<Debt>) => {
    if (!userId) throw new Error('User tidak ditemukan. Silakan login ulang.');

    if (updates.amount !== undefined && updates.amount <= 0) throw new Error('Jumlah hutang harus lebih dari 0');
    if (updates.creditor_name !== undefined && !updates.creditor_name.trim()) throw new Error('Nama kreditor tidak boleh kosong');

    try {
      const { data, error } = await apiClient.put(`/debts/${id}`, {
        ...(updates.creditor_name !== undefined && { creditor_name: updates.creditor_name.trim() }),
        ...(updates.debtor_name !== undefined && { debtor_name: updates.debtor_name?.trim() || null }),
        ...(updates.amount !== undefined && { amount: Number(updates.amount) }),
        ...(updates.description !== undefined && { description: updates.description.trim() }),
        ...(updates.due_date !== undefined && { due_date: updates.due_date }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.type !== undefined && { type: updates.type }),
        ...(updates.interest_rate !== undefined && { interest_rate: Number(updates.interest_rate) })
      });

      if (error) throw new Error(`Gagal mengupdate hutang: ${error.message}`);

      const mapped = mapDebt(data);
      setDebts(prev => prev.map(d => d.id === id ? mapped : d));
      setError(null);
      return mapped;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteDebt = async (id: string) => {
    if (!userId) throw new Error('User tidak ditemukan. Silakan login ulang.');

    try {
      const { error } = await apiClient.delete(`/debts/${id}`);
      if (error) throw new Error(`Gagal menghapus hutang: ${error.message}`);

      setDebts(prev => prev.filter(d => d.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const addPayment = async (debtId: string, payment: Omit<DebtPayment, 'id' | 'debt_id' | 'created_at'>) => {
    if (!userId) throw new Error('User tidak ditemukan. Silakan login ulang.');

    if (!payment.amount || payment.amount <= 0) throw new Error('Jumlah pembayaran harus lebih dari 0');
    if (!payment.payment_date) throw new Error('Tanggal pembayaran wajib diisi');

    try {
      const { data, error } = await apiClient.post(`/debts/${debtId}/payments`, {
        amount: Number(payment.amount),
        payment_date: payment.payment_date,
        notes: payment.notes?.trim() || null
      });

      if (error) throw new Error(`Gagal menambah pembayaran: ${error.message}`);

      // Refresh debts untuk mendapatkan status & remaining yang terupdate
      await fetchDebts();
      return data;
    } catch (err: any) {
      setError(err.message);
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

function mapDebt(row: any): Debt {
  return {
    ...row,
    amount: parseFloat(row.amount),
    remaining_amount: parseFloat(row.remaining_amount),
    interest_rate: parseFloat(row.interest_rate || 0)
  };
}
