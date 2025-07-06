import React, { useState } from 'react';
import { X, User, DollarSign, Calendar, FileText, Percent } from 'lucide-react';
import { Debt } from '../types/debt';

interface DebtFormProps {
  onSubmit: (debt: Omit<Debt, 'id' | 'user_id' | 'remaining_amount' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  editDebt?: Debt | null;
}

const DebtForm: React.FC<DebtFormProps> = ({ onSubmit, onCancel, editDebt }) => {
  const [formData, setFormData] = useState({
    creditor_name: editDebt?.creditor_name || '',
    debtor_name: editDebt?.debtor_name || '',
    amount: editDebt?.amount || 0,
    description: editDebt?.description || '',
    due_date: editDebt?.due_date || '',
    status: editDebt?.status || 'pending' as 'pending' | 'partial' | 'paid',
    type: editDebt?.type || 'debt' as 'debt' | 'receivable',
    interest_rate: editDebt?.interest_rate || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.creditor_name.trim() || !formData.description.trim() || formData.amount <= 0) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {editDebt ? 'Edit Hutang/Piutang' : 'Tambah Hutang/Piutang'}
              </h2>
              <p className="text-gray-600 mt-1">
                {editDebt ? 'Perbarui informasi hutang/piutang' : 'Catat hutang atau piutang baru'}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-xl"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tipe *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'debt' }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.type === 'debt'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">💸</div>
                    <div className="font-medium">Hutang</div>
                    <div className="text-xs text-gray-500">Uang yang saya pinjam</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'receivable' }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.type === 'receivable'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">💰</div>
                    <div className="font-medium">Piutang</div>
                    <div className="text-xs text-gray-500">Uang yang dipinjam orang</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Amount and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Jumlah (IDR) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Jatuh Tempo
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <User className="inline h-4 w-4 mr-1" />
                  {formData.type === 'debt' ? 'Nama Pemberi Pinjaman *' : 'Nama Peminjam *'}
                </label>
                <input
                  type="text"
                  name="creditor_name"
                  value={formData.creditor_name}
                  onChange={handleChange}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={formData.type === 'debt' ? 'Contoh: Bank BCA' : 'Contoh: John Doe'}
                />
              </div>

              {formData.type === 'receivable' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Nama Alternatif
                  </label>
                  <input
                    type="text"
                    name="debtor_name"
                    value={formData.debtor_name}
                    onChange={handleChange}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nama lain (opsional)"
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <FileText className="inline h-4 w-4 mr-1" />
                Deskripsi *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Contoh: Pinjaman untuk modal usaha"
              />
            </div>

            {/* Interest Rate and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Percent className="inline h-4 w-4 mr-1" />
                  Bunga (% per tahun)
                </label>
                <input
                  type="number"
                  name="interest_rate"
                  value={formData.interest_rate}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Belum Bayar</option>
                  <option value="partial">Sebagian</option>
                  <option value="paid">Lunas</option>
                </select>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                {editDebt ? 'Update' : 'Tambah'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DebtForm;