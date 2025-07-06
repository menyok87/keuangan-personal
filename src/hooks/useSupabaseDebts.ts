import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
    if (!userId) {
      console.log('❌ No user ID provided for fetchDebts');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Fetching debts for user:', userId);
      setError(null);
      
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching debts:', error);
        setError(`Gagal memuat data hutang: ${error.message}`);
      } else {
        console.log('✅ Debts fetched successfully:', data?.length || 0, 'items');
        setDebts(data || []);
      }
    } catch (error: any) {
      console.error('❌ Error in fetchDebts:', error);
      setError('Terjadi kesalahan saat memuat data hutang');
    } finally {
      setLoading(false);
    }
  };

  const addDebt = async (debt: Omit<Debt, 'id' | 'user_id' | 'remaining_amount' | 'created_at' | 'updated_at'>) => {
    if (!userId) {
      throw new Error('❌ User tidak ditemukan. Silakan login ulang.');
    }

    try {
      console.log('🚀 === ADDING DEBT START ===');
      console.log('👤 User ID:', userId);
      console.log('📝 Debt data received:', debt);
      
      // Enhanced validation
      const validationErrors = [];
      
      if (!debt.creditor_name?.trim()) {
        validationErrors.push('Nama kreditor wajib diisi');
      }
      
      if (!debt.amount || debt.amount <= 0) {
        validationErrors.push('Jumlah hutang harus lebih dari 0');
      }
      
      if (!debt.description?.trim()) {
        validationErrors.push('Deskripsi hutang wajib diisi');
      }
      
      if (!debt.type || !['debt', 'receivable'].includes(debt.type)) {
        validationErrors.push('Tipe hutang wajib dipilih');
      }

      if (validationErrors.length > 0) {
        console.log('❌ Validation failed with errors:', validationErrors);
        throw new Error(validationErrors.join(', '));
      }

      // Prepare debt data
      const debtData = {
        user_id: userId,
        creditor_name: debt.creditor_name.trim(),
        debtor_name: debt.debtor_name?.trim() || null,
        amount: Number(debt.amount),
        remaining_amount: Number(debt.amount), // Initially, remaining = total
        description: debt.description.trim(),
        due_date: debt.due_date || null,
        status: debt.status || 'pending',
        type: debt.type,
        interest_rate: Number(debt.interest_rate || 0)
      };

      console.log('📋 Prepared debt data:', debtData);

      // Insert debt
      const { data, error } = await supabase
        .from('debts')
        .insert([debtData])
        .select()
        .single();

      if (error) {
        console.error('❌ Insert error details:', error);
        
        if (error.code === '23503') {
          throw new Error('❌ User profile tidak valid. Silakan logout dan login ulang.');
        } else if (error.code === '42501') {
          throw new Error('❌ Tidak memiliki izin untuk menambah hutang.');
        } else if (error.message.includes('violates row-level security')) {
          throw new Error('❌ Akses ditolak oleh sistem keamanan. Silakan login ulang.');
        } else {
          throw new Error(`❌ Gagal menyimpan hutang: ${error.message}`);
        }
      }
      
      if (!data) {
        throw new Error('❌ Tidak ada data yang dikembalikan setelah insert.');
      }

      console.log('✅ Debt inserted successfully:', data);
      
      // Update local state
      setDebts(prev => [data, ...prev]);
      setError(null);
      
      console.log('🎉 === ADDING DEBT SUCCESS ===');
      return data;
      
    } catch (error: any) {
      console.error('💥 === ADDING DEBT ERROR ===');
      console.error('Error message:', error.message);
      setError(error.message || 'Gagal menambah hutang');
      throw error;
    }
  };

  const updateDebt = async (id: string, updates: Partial<Debt>) => {
    if (!userId) {
      throw new Error('❌ User tidak ditemukan. Silakan login ulang.');
    }

    try {
      console.log('🔄 === UPDATING DEBT ===');
      console.log('🆔 Debt ID:', id);
      console.log('📝 Updates:', updates);
      
      // Validate updates
      if (updates.amount !== undefined && updates.amount <= 0) {
        throw new Error('Jumlah hutang harus lebih dari 0');
      }
      
      if (updates.creditor_name !== undefined && !updates.creditor_name.trim()) {
        throw new Error('Nama kreditor tidak boleh kosong');
      }

      // Prepare update data
      const updateData = {
        updated_at: new Date().toISOString(),
        ...(updates.creditor_name !== undefined && { creditor_name: updates.creditor_name.trim() }),
        ...(updates.debtor_name !== undefined && { debtor_name: updates.debtor_name?.trim() || null }),
        ...(updates.amount !== undefined && { amount: Number(updates.amount) }),
        ...(updates.description !== undefined && { description: updates.description.trim() }),
        ...(updates.due_date !== undefined && { due_date: updates.due_date }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.type !== undefined && { type: updates.type }),
        ...(updates.interest_rate !== undefined && { interest_rate: Number(updates.interest_rate) })
      };

      console.log('📋 Prepared update data:', updateData);

      // Update the debt
      const { data, error } = await supabase
        .from('debts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating debt:', error);
        
        if (error.code === 'PGRST116') {
          throw new Error('❌ Hutang tidak ditemukan atau sudah dihapus');
        } else if (error.code === '42501') {
          throw new Error('❌ Tidak memiliki izin untuk mengupdate hutang');
        } else if (error.message.includes('violates row-level security')) {
          throw new Error('❌ Akses ditolak oleh sistem keamanan');
        } else {
          throw new Error(`❌ Gagal mengupdate hutang: ${error.message}`);
        }
      }
      
      if (!data) {
        throw new Error('❌ Hutang tidak ditemukan atau tidak dapat diupdate');
      }

      console.log('✅ Debt updated successfully:', data);
      
      // Update local state
      setDebts(prev => prev.map(d => d.id === id ? data : d));
      setError(null);
      
      console.log('🎉 === UPDATING DEBT SUCCESS ===');
      return data;
    } catch (error: any) {
      console.error('💥 === UPDATING DEBT ERROR ===');
      console.error('Error message:', error.message);
      setError(error.message || 'Gagal mengupdate hutang');
      throw error;
    }
  };

  const deleteDebt = async (id: string) => {
    if (!userId) {
      throw new Error('❌ User tidak ditemukan. Silakan login ulang.');
    }

    try {
      console.log('🗑️ === DELETING DEBT ===');
      console.log('🆔 Debt ID:', id);
      
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error deleting debt:', error);
        
        if (error.code === 'PGRST116') {
          throw new Error('❌ Hutang tidak ditemukan atau sudah dihapus');
        } else if (error.code === '42501') {
          throw new Error('❌ Tidak memiliki izin untuk menghapus hutang');
        } else {
          throw new Error(`❌ Gagal menghapus hutang: ${error.message}`);
        }
      }

      console.log('✅ Debt deleted successfully from database');
      
      // Remove from local state
      setDebts(prev => prev.filter(d => d.id !== id));
      setError(null);
      
      console.log('🎉 === DELETING DEBT SUCCESS ===');
      
    } catch (error: any) {
      console.error('💥 === DELETING DEBT ERROR ===');
      console.error('Error message:', error.message);
      setError(error.message || 'Gagal menghapus hutang');
      throw error;
    }
  };

  const addPayment = async (debtId: string, payment: Omit<DebtPayment, 'id' | 'debt_id' | 'created_at'>) => {
    if (!userId) {
      throw new Error('❌ User tidak ditemukan. Silakan login ulang.');
    }

    try {
      console.log('💰 === ADDING DEBT PAYMENT ===');
      console.log('🆔 Debt ID:', debtId);
      console.log('💵 Payment data:', payment);

      // Validate payment
      if (!payment.amount || payment.amount <= 0) {
        throw new Error('Jumlah pembayaran harus lebih dari 0');
      }

      if (!payment.payment_date) {
        throw new Error('Tanggal pembayaran wajib diisi');
      }

      // Check if debt exists and get remaining amount
      const { data: debt, error: debtError } = await supabase
        .from('debts')
        .select('remaining_amount')
        .eq('id', debtId)
        .eq('user_id', userId)
        .single();

      if (debtError || !debt) {
        throw new Error('❌ Hutang tidak ditemukan');
      }

      if (payment.amount > debt.remaining_amount) {
        throw new Error(`Jumlah pembayaran tidak boleh lebih dari sisa hutang (${debt.remaining_amount})`);
      }

      // Insert payment
      const { data, error } = await supabase
        .from('debt_payments')
        .insert([{
          debt_id: debtId,
          amount: Number(payment.amount),
          payment_date: payment.payment_date,
          notes: payment.notes?.trim() || null
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding payment:', error);
        throw new Error(`❌ Gagal menambah pembayaran: ${error.message}`);
      }

      console.log('✅ Payment added successfully:', data);
      
      // Refresh debts to get updated status
      await fetchDebts();
      
      return data;
    } catch (error: any) {
      console.error('💥 === ADDING PAYMENT ERROR ===');
      console.error('Error message:', error.message);
      setError(error.message || 'Gagal menambah pembayaran');
      throw error;
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