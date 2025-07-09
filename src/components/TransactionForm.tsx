import React, { useState } from 'react';
import { Plus, X, Tag, MapPin, CreditCard, FileText, Calendar, Repeat } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
  editTransaction?: Transaction | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onSubmit, 
  onCancel, 
  editTransaction 
}) => {
  const [formData, setFormData] = useState({
    amount: editTransaction?.amount || 0,
    description: editTransaction?.description || '',
    category: editTransaction?.category || '',
    subcategory: editTransaction?.subcategory || '',
    type: editTransaction?.type || 'expense' as 'income' | 'expense',
    date: editTransaction?.date || new Date().toISOString().split('T')[0],
    paymentMethod: editTransaction?.paymentMethod || 'cash' as 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'e_wallet',
    tags: editTransaction?.tags || [],
    notes: editTransaction?.notes || '',
    location: editTransaction?.location || '',
    is_recurring: editTransaction?.is_recurring || false,
    recurring_frequency: editTransaction?.recurring_frequency || 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly'
  });

  const [newTag, setNewTag] = useState('');

  const expenseCategories = {
    'Makanan & Minuman': ['Restoran', 'Groceries', 'Kafe', 'Delivery', 'Snack'],
    'Transportasi': ['Bensin', 'Parkir', 'Tol', 'Ojek Online', 'Taksi', 'Servis Kendaraan'],
    'Belanja': ['Pakaian', 'Elektronik', 'Rumah Tangga', 'Kosmetik', 'Buku'],
    'Tagihan': ['Listrik', 'Air', 'Internet', 'Telepon', 'TV Kabel', 'Asuransi'],
    'Kesehatan': ['Dokter', 'Obat', 'Rumah Sakit', 'Vitamin', 'Olahraga'],
    'Hiburan': ['Bioskop', 'Konser', 'Game', 'Streaming', 'Hobi'],
    'Pendidikan': ['Kursus', 'Buku', 'Seminar', 'Sertifikasi'],
    'Investasi': ['Saham', 'Reksadana', 'Emas', 'Crypto', 'Deposito'],
    'Lainnya': ['Gift', 'Donasi', 'Emergency', 'Misc']
  };

  const incomeCategories = {
    'Gaji': ['Gaji Pokok', 'Bonus', 'Tunjangan', 'Overtime'],
    'Freelance': ['Konsultasi', 'Proyek', 'Desain', 'Programming'],
    'Bisnis': ['Penjualan', 'Komisi', 'Profit', 'Royalti'],
    'Investasi': ['Dividen', 'Capital Gain', 'Bunga', 'Rental'],
    'Lainnya': ['Gift', 'Cashback', 'Refund', 'Misc']
  };

  const paymentMethods = [
    { value: 'cash', label: 'Tunai', icon: '💵' },
    { value: 'credit_card', label: 'Kartu Kredit', icon: '💳' },
    { value: 'debit_card', label: 'Kartu Debit', icon: '💳' },
    { value: 'bank_transfer', label: 'Transfer Bank', icon: '🏦' },
    { value: 'e_wallet', label: 'E-Wallet', icon: '📱' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 === TRANSACTION FORM SUBMIT START ===');
    console.log('Form data:', formData);
    console.log('Is editing:', !!editTransaction);
    console.log('Edit transaction ID:', editTransaction?.id);
    console.log('Transaction type:', formData.type);
    console.log('Amount:', formData.amount, 'Type:', typeof formData.amount);
    console.log('Description:', formData.description);
    console.log('Category:', formData.category);
    console.log('Date:', formData.date);
    
    // Enhanced validation with detailed logging
    if (formData.amount <= 0 || !formData.description || !formData.category) {
      console.log('❌ Validation failed:', {
        amount: formData.amount,
        description: formData.description,
        category: formData.category
      });
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }
    
    if (!formData.description.trim()) {
      console.log('❌ Description is empty');
      alert('Deskripsi tidak boleh kosong');
      return;
    }
    
    if (!formData.category.trim()) {
      console.log('❌ Category is empty');
      alert('Kategori harus dipilih');
      return;
    }
    
    if (!formData.type) {
      console.log('❌ Type is empty');
      alert('Tipe transaksi harus dipilih');
      return;
    }
    
    if (!formData.date) {
      console.log('❌ Date is empty');
      alert('Tanggal harus diisi');
      return;
    }
    
    // Additional validation for edit mode
    if (editTransaction && !editTransaction.id) {
      console.log('❌ Edit transaction missing ID');
      alert('Error: ID transaksi tidak ditemukan');
      return;
    }
    
    try {
      console.log('✅ All validation passed, preparing to submit transaction');
      console.log('Final form data:', {
        ...formData,
        amount: Number(formData.amount),
        description: formData.description.trim(),
        category: formData.category.trim(),
        type: formData.type,
        date: formData.date,
        paymentMethod: formData.paymentMethod
      });
      
      // Create clean transaction object
      const cleanFormData = {
        ...formData,
        amount: Number(formData.amount),
        description: formData.description.trim(),
        category: formData.category.trim(),
        subcategory: formData.subcategory?.trim() || '',
        notes: formData.notes?.trim() || '',
        location: formData.location?.trim() || ''
      };
      
      console.log('📤 Submitting clean form data:', cleanFormData);
      onSubmit(cleanFormData);
      
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      alert('Gagal menyimpan transaksi. Silakan coba lagi.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const currentCategories = formData.type === 'expense' ? expenseCategories : incomeCategories;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {editTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {editTransaction ? 'Perbarui detail transaksi' : 'Catat transaksi keuangan baru'}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Tipe Transaksi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: '', subcategory: '' }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.type === 'expense'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">💸</div>
                    <div className="font-medium">Pengeluaran</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: '', subcategory: '' }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.type === 'income'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">💰</div>
                    <div className="font-medium">Pemasukan</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Jumlah (IDR) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">Rp</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Tanggal *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <FileText className="inline h-4 w-4 mr-1" />
                Deskripsi *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Contoh: Makan siang di restoran"
              />
            </div>

            {/* Category and Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Kategori *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Pilih kategori</option>
                  {Object.keys(currentCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {formData.category && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Sub Kategori
                  </label>
                  <select
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleChange}
                    className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Pilih sub kategori</option>
                    {currentCategories[formData.category as keyof typeof currentCategories]?.map(subcat => (
                      <option key={subcat} value={subcat}>{subcat}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <CreditCard className="inline h-4 w-4 mr-1" />
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {paymentMethods.map(method => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.value as any }))}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      formData.paymentMethod === method.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="text-lg mb-1">{method.icon}</div>
                  <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{method.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <MapPin className="inline h-4 w-4 mr-1" />
                Lokasi
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Contoh: Mall Taman Anggrek"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <Tag className="inline h-4 w-4 mr-1" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Tambah tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Recurring Transaction */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  name="is_recurring"
                  checked={formData.is_recurring}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 dark:text-blue-500 rounded focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500"
                />
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Repeat className="inline h-4 w-4 mr-1" />
                  Transaksi Berulang
                </label>
              </div>
              
              {formData.is_recurring && (
                <select
                  name="recurring_frequency"
                  value={formData.recurring_frequency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="daily">Harian</option>
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                </select>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Catatan
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Catatan tambahan..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-semibold flex items-center justify-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>{editTransaction ? 'Update' : 'Tambah'} Transaksi</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;