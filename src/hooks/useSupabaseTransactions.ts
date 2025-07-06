import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
    if (!userId) {
      console.log('❌ No user ID provided for fetchTransactions');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Fetching transactions for user:', userId);
      setError(null);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching transactions:', error);
        setError(`Gagal memuat transaksi: ${error.message}`);
      } else {
        console.log('✅ Transactions fetched successfully:', data?.length || 0, 'items');
        setTransactions(data || []);
      }
    } catch (error: any) {
      console.error('❌ Error in fetchTransactions:', error);
      setError('Terjadi kesalahan saat memuat transaksi');
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!userId) {
      throw new Error('❌ User tidak ditemukan. Silakan login ulang.');
    }

    try {
      console.log('🚀 === ADDING TRANSACTION START ===');
      console.log('👤 User ID:', userId);
      console.log('📝 Transaction data received:', transaction);
      
      // Enhanced validation with detailed logging
      const validationErrors = [];
      
      console.log('🔍 Validating transaction data...');
      
      if (!transaction.amount || transaction.amount <= 0) {
        validationErrors.push('Jumlah transaksi harus lebih dari 0');
        console.log('❌ Amount validation failed:', transaction.amount);
      }
      
      if (!transaction.description?.trim()) {
        validationErrors.push('Deskripsi transaksi wajib diisi');
        console.log('❌ Description validation failed:', transaction.description);
      }
      
      if (!transaction.category?.trim()) {
        validationErrors.push('Kategori transaksi wajib dipilih');
        console.log('❌ Category validation failed:', transaction.category);
      }
      
      if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
        validationErrors.push('Tipe transaksi wajib dipilih (income/expense)');
        console.log('❌ Type validation failed:', transaction.type);
      }
      
      if (!transaction.date) {
        validationErrors.push('Tanggal transaksi wajib diisi');
        console.log('❌ Date validation failed:', transaction.date);
      }

      if (validationErrors.length > 0) {
        console.log('❌ Validation failed with errors:', validationErrors);
        throw new Error(validationErrors.join(', '));
      }

      console.log('✅ Validation passed');

      // Prepare transaction data with enhanced logging
      const transactionData = {
        user_id: userId,
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
      };

      console.log('📋 Prepared transaction data:', transactionData);
      console.log('💰 Amount type:', typeof transactionData.amount, 'Value:', transactionData.amount);
      console.log('📅 Date type:', typeof transactionData.date, 'Value:', transactionData.date);
      console.log('🏷️ Type:', transactionData.type);

      // Test database connection and permissions
      console.log('🔐 Testing database permissions...');
      
      const { data: permissionTest, error: permissionError } = await supabase
        .from('transactions')
        .select('count')
        .eq('user_id', userId)
        .limit(1);

      if (permissionError) {
        console.error('❌ Permission test failed:', permissionError);
        throw new Error(`Tidak memiliki izin akses database: ${permissionError.message}`);
      }

      console.log('✅ Permission test passed:', permissionTest);

      // Test user profile exists
      console.log('👤 Checking user profile...');
      
      const { data: profileCheck, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Profile check failed:', profileError);
        throw new Error(`User profile tidak ditemukan: ${profileError.message}`);
      }

      console.log('✅ User profile found:', profileCheck);

      // Insert transaction with detailed error handling
      console.log('💾 Inserting transaction to database...');
      
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) {
        console.error('❌ Insert error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Handle specific error cases with better messages
        if (error.code === '23503') {
          throw new Error('❌ User profile tidak valid. Silakan logout dan login ulang.');
        } else if (error.code === '42501') {
          throw new Error('❌ Tidak memiliki izin untuk menambah transaksi. Periksa pengaturan akun Anda.');
        } else if (error.message.includes('violates row-level security')) {
          throw new Error('❌ Akses ditolak oleh sistem keamanan. Silakan login ulang.');
        } else if (error.message.includes('invalid input syntax')) {
          throw new Error('❌ Format data tidak valid. Periksa kembali input Anda.');
        } else if (error.code === '23514') {
          throw new Error('❌ Data tidak memenuhi constraint database. Periksa nilai yang dimasukkan.');
        } else {
          throw new Error(`❌ Gagal menyimpan transaksi: ${error.message} (Code: ${error.code})`);
        }
      }
      
      if (!data) {
        console.error('❌ No data returned after insert');
        throw new Error('❌ Tidak ada data yang dikembalikan setelah insert. Transaksi mungkin tidak tersimpan.');
      }

      console.log('✅ Transaction inserted successfully:', data);
      console.log('🆔 New transaction ID:', data.id);
      console.log('💰 Saved amount:', data.amount);
      console.log('🏷️ Saved type:', data.type);
      
      // Update local state immediately
      setTransactions(prev => {
        console.log('🔄 Updating local state. Previous count:', prev.length);
        const newState = [data, ...prev];
        console.log('🔄 New state count:', newState.length);
        return newState;
      });
      
      // Clear any previous errors
      setError(null);
      
      console.log('🎉 === ADDING TRANSACTION SUCCESS ===');
      return data;
      
    } catch (error: any) {
      console.error('💥 === ADDING TRANSACTION ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      
      setError(error.message || 'Gagal menambah transaksi');
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!userId) {
      throw new Error('❌ User tidak ditemukan. Silakan login ulang.');
    }

    try {
      console.log('🔄 === UPDATING TRANSACTION ===');
      console.log('🆔 Transaction ID:', id);
      console.log('👤 User ID:', userId);
      console.log('📝 Updates:', updates);
      
      // Validate that we have the transaction to update
      const existingTransaction = transactions.find(t => t.id === id);
      if (!existingTransaction) {
        console.log('⚠️  Transaction not found in local state, fetching from database...');
        
        // Try to fetch from database
        const { data: dbTransaction, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single();
        
        if (fetchError || !dbTransaction) {
          throw new Error('❌ Transaksi tidak ditemukan atau sudah dihapus');
        }
        
        console.log('✅ Transaction found in database:', dbTransaction);
      }
      
      console.log('✅ Transaction validation passed');
      
      // Validate required fields if they're being updated
      if (updates.amount !== undefined && updates.amount <= 0) {
        throw new Error('Jumlah transaksi harus lebih dari 0');
      }
      
      if (updates.description !== undefined && !updates.description.trim()) {
        throw new Error('Deskripsi transaksi tidak boleh kosong');
      }
      
      if (updates.category !== undefined && !updates.category.trim()) {
        throw new Error('Kategori transaksi harus dipilih');
      }

      // Prepare update data
      const updateData = {
        updated_at: new Date().toISOString(),
        ...(updates.amount !== undefined && { amount: Number(updates.amount) }),
        ...(updates.description !== undefined && { description: updates.description.trim() }),
        ...(updates.category !== undefined && { category: updates.category.trim() }),
        ...(updates.subcategory !== undefined && { subcategory: updates.subcategory?.trim() || null }),
        ...(updates.type !== undefined && { type: updates.type }),
        ...(updates.date !== undefined && { date: updates.date }),
        ...(updates.paymentMethod !== undefined && { payment_method: updates.paymentMethod }),
        ...(updates.notes !== undefined && { notes: updates.notes?.trim() || null }),
        ...(updates.location !== undefined && { location: updates.location?.trim() || null }),
        ...(updates.tags !== undefined && { tags: Array.isArray(updates.tags) ? updates.tags : [] }),
        ...(updates.is_recurring !== undefined && { is_recurring: Boolean(updates.is_recurring) }),
        ...(updates.recurring_frequency !== undefined && { recurring_frequency: updates.is_recurring ? updates.recurring_frequency : null })
      };
      

      // Update the transaction
      console.log('💾 Updating transaction in database...');
      
      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating transaction:', error);
        
        // Handle specific error cases
        if (error.code === 'PGRST116') {
          throw new Error('❌ Transaksi tidak ditemukan atau sudah dihapus');
        } else if (error.code === '23503') {
          throw new Error('❌ Referensi data tidak valid');
        } else if (error.code === '42501') {
          throw new Error('❌ Tidak memiliki izin untuk mengupdate transaksi');
        } else if (error.message.includes('violates row-level security')) {
          throw new Error('❌ Akses ditolak oleh sistem keamanan. Silakan login ulang.');
        } else if (error.message.includes('invalid input syntax')) {
          throw new Error('❌ Format data tidak valid. Periksa kembali input Anda.');
        } else {
          throw new Error(`❌ Gagal mengupdate transaksi: ${error.message} (Code: ${error.code})`);
        }
      }
      
      if (!data) {
        throw new Error('❌ Transaksi tidak ditemukan atau tidak dapat diupdate');
      }

      console.log('✅ Transaction updated successfully:', data);
      
      // Update local state
      setTransactions(prev => {
        const updated = prev.map(t => t.id === id ? data : t);
        console.log('🔄 Local state updated. Transaction count:', updated.length);
        return updated;
      });
      
      // Clear any previous errors
      setError(null);
      
      console.log('🎉 === UPDATING TRANSACTION SUCCESS ===');
      return data;
    } catch (error: any) {
      console.error('💥 === UPDATING TRANSACTION ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      setError(error.message || 'Gagal mengupdate transaksi');
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!userId) {
      throw new Error('❌ User tidak ditemukan. Silakan login ulang.');
    }

    try {
      console.log('🗑️ === DELETING TRANSACTION ===');
      console.log('🆔 Transaction ID:', id);
      console.log('👤 User ID:', userId);
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error deleting transaction:', error);
        
        if (error.code === 'PGRST116') {
          throw new Error('❌ Transaksi tidak ditemukan atau sudah dihapus');
        } else if (error.code === '42501') {
          throw new Error('❌ Tidak memiliki izin untuk menghapus transaksi');
        } else if (error.message.includes('violates row-level security')) {
          throw new Error('❌ Akses ditolak oleh sistem keamanan');
        } else {
          throw new Error(`❌ Gagal menghapus transaksi: ${error.message}`);
        }
      }

      console.log('✅ Transaction deleted successfully from database');
      
      // Remove from local state
      setTransactions(prev => {
        const filtered = prev.filter(t => t.id !== id);
        console.log('🔄 Local state updated. Remaining transactions:', filtered.length);
        return filtered;
      });
      
      // Clear any previous errors
      setError(null);
      
      console.log('🎉 === DELETING TRANSACTION SUCCESS ===');
      
    } catch (error: any) {
      console.error('💥 === DELETING TRANSACTION ERROR ===');
      console.error('Error message:', error.message);
      setError(error.message || 'Gagal menghapus transaksi');
      throw error;
    }
  };

  // Enhanced debug function
  const debugConnection = async () => {
    if (!userId) {
      console.log('❌ No user ID for debug');
      return;
    }
    
    try {
      console.log('🔍 === ENHANCED DEBUG CONNECTION ===');
      console.log('👤 User ID:', userId);
      
      // Test 1: Check current auth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.log('❌ Session check failed:', sessionError);
      } else {
        console.log('✅ Current session:', {
          user_id: session?.user?.id,
          email: session?.user?.email,
          expires_at: session?.expires_at,
          access_token: session?.access_token ? 'Present' : 'Missing'
        });
        console.log('✅ Session user ID match:', session?.user?.id === userId);
      }
      
      // Test 2: Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.log('❌ Profile check failed:', profileError);
      } else {
        console.log('✅ User profile found:', profile);
      }
      
      // Test 3: Check RLS policies
      const { data: readTest, error: readError } = await supabase
        .from('transactions')
        .select('count')
        .eq('user_id', userId)
        .limit(1);
      
      if (readError) {
        console.log('❌ Read permission failed:', readError);
      } else {
        console.log('✅ Read permission OK:', readTest);
      }
      
      // Test 4: Try a simple insert test (dry run)
      const testData = {
        user_id: userId,
        amount: 1000,
        description: 'Test Transaction',
        category: 'Test',
        type: 'expense' as const,
        date: new Date().toISOString().split('T')[0],
        payment_method: 'cash' as const,
        tags: [],
        notes: 'Debug test transaction',
        location: null,
        is_recurring: false,
        recurring_frequency: null
      };
      
      console.log('🧪 Testing insert permissions with data:', testData);
      
      // Don't actually insert, just test the query structure
      const { error: insertTestError } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('description', 'Non-existent test')
        .limit(1);
      
      if (insertTestError) {
        console.log('❌ Insert test failed:', insertTestError);
      } else {
        console.log('✅ Insert test structure OK');
      }
      
      // Test 5: Check database connection
      const { data: dbTest, error: dbError } = await supabase
        .from('transactions')
        .select('count')
        .limit(1);
      
      if (dbError) {
        console.log('❌ Database connection failed:', dbError);
      } else {
        console.log('✅ Database connection OK:', dbTest);
      }
      
      console.log('🔍 === END ENHANCED DEBUG ===');
      
    } catch (error) {
      console.error('❌ Debug failed:', error);
    }
  };

  // Run debug on mount and when userId changes
  useEffect(() => {
    if (userId) {
      debugConnection();
    }
  }, [userId]);

  // Force refresh function
  const forceRefresh = async () => {
    console.log('🔄 Force refreshing transactions...');
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
    forceRefresh,
    debugConnection
  };
};