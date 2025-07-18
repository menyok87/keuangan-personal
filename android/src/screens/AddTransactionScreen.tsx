import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const AddTransactionScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const expenseCategories = [
    'Makanan & Minuman',
    'Transportasi',
    'Belanja',
    'Tagihan',
    'Kesehatan',
    'Hiburan',
    'Pendidikan',
    'Lainnya',
  ];

  const incomeCategories = [
    'Gaji',
    'Freelance',
    'Bisnis',
    'Investasi',
    'Lainnya',
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Tunai' },
    { value: 'credit_card', label: 'Kartu Kredit' },
    { value: 'debit_card', label: 'Kartu Debit' },
    { value: 'bank_transfer', label: 'Transfer Bank' },
    { value: 'e_wallet', label: 'E-Wallet' },
  ];

  const handleSubmit = async () => {
    if (!amount || !description || !category) {
      Alert.alert('Error', 'Mohon lengkapi semua field yang wajib');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User tidak ditemukan');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            amount: parseFloat(amount),
            description: description.trim(),
            category: category,
            type: type,
            date: date.toISOString().split('T')[0],
            payment_method: paymentMethod,
            notes: notes.trim() || null,
            tags: [],
            is_recurring: false,
          },
        ]);

      if (error) throw error;

      Alert.alert('Sukses', 'Transaksi berhasil ditambahkan', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal menambah transaksi');
    } finally {
      setLoading(false);
    }
  };

  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Transaction Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipe Transaksi</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && styles.typeButtonActive,
                type === 'expense' && styles.typeButtonExpense,
              ]}
              onPress={() => {
                setType('expense');
                setCategory('');
              }}
            >
              <Icon name="trending-down" size={24} color={type === 'expense' ? '#FFFFFF' : '#EF4444'} />
              <Text style={[
                styles.typeButtonText,
                type === 'expense' && styles.typeButtonTextActive,
              ]}>
                Pengeluaran
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && styles.typeButtonActive,
                type === 'income' && styles.typeButtonIncome,
              ]}
              onPress={() => {
                setType('income');
                setCategory('');
              }}
            >
              <Icon name="trending-up" size={24} color={type === 'income' ? '#FFFFFF' : '#10B981'} />
              <Text style={[
                styles.typeButtonText,
                type === 'income' && styles.typeButtonTextActive,
              ]}>
                Pemasukan
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jumlah (IDR) *</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deskripsi *</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Contoh: Makan siang di restoran"
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategori *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryContainer}>
              {currentCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    category === cat && styles.categoryButtonTextActive,
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tanggal</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar-today" size={20} color="#6B7280" />
            <Text style={styles.dateButtonText}>
              {date.toLocaleDateString('id-ID')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.paymentContainer}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.paymentButton,
                    paymentMethod === method.value && styles.paymentButtonActive,
                  ]}
                  onPress={() => setPaymentMethod(method.value)}
                >
                  <Text style={[
                    styles.paymentButtonText,
                    paymentMethod === method.value && styles.paymentButtonTextActive,
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catatan</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Catatan tambahan..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Menyimpan...' : 'Tambah Transaksi'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker Modal */}
      <DatePicker
        modal
        open={showDatePicker}
        date={date}
        mode="date"
        onConfirm={(selectedDate) => {
          setShowDatePicker(false);
          setDate(selectedDate);
        }}
        onCancel={() => setShowDatePicker(false)}
        title="Pilih Tanggal"
        confirmText="Pilih"
        cancelText="Batal"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  typeButtonActive: {
    borderColor: 'transparent',
  },
  typeButtonExpense: {
    backgroundColor: '#EF4444',
  },
  typeButtonIncome: {
    backgroundColor: '#10B981',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 16,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    height: 50,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  categoryButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  paymentContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  paymentButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  paymentButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  paymentButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddTransactionScreen;