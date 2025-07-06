import React, { useState } from 'react';
import { X, DollarSign, Calendar, FileText } from 'lucide-react';
import { Debt, DebtPayment } from '../types/debt';

interface PaymentFormProps {
  debt: Debt;
  onSubmit: (payment: Omit<DebtPayment, 'id' | 'debt_id' | 'created_at'>) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ debt, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      alert('Jumlah pembayaran harus lebih dari 0');
      return;
    }

    if (formData.amount > debt.remaining_amount) {
      alert(`Jumlah pembayaran tidak boleh lebih dari sisa hutang (${formatCurrency(debt.remaining_amount)})`);
      return;
    }

    if (!formData.payment_date) {
      alert('Tanggal pembayaran wajib diisi');
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const setFullPayment = () => {
    setFormData(prev => ({
      ...prev,
      amount: debt.remaining_amount
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Tambah Pembayaran</h2>
              <p className="text-gray-600 mt-1">
                {debt.type === 'debt' ? 'Bayar hutang' : 'Terima pembayaran piutang'}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-xl"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Debt Info */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">{debt.description}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total:</span>
                <span className="font-medium ml-2">{formatCurrency(debt.amount)}</span>
              </div>
              <div>
                <span className="text-gray-600">Sisa:</span>
                <span className="font-medium ml-2 text-red-600">{formatCurrency(debt.remaining_amount)}</span>
              </div>
              <div>
                <span className="text-gray-600">
                  {debt.type === 'debt' ? 'Kepada:' : 'Dari:'}
                </span>
                <span className="font-medium ml-2">{debt.creditor_name}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  debt.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                  debt.status === 'partial' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {debt.status === 'paid' ? 'Lunas' :
                   debt.status === 'partial' ? 'Sebagian' : 'Belum Bayar'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Jumlah Pembayaran (IDR) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="0"
                  max={debt.remaining_amount}
                  step="1000"
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
                  placeholder="0"
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  Maksimal: {formatCurrency(debt.remaining_amount)}
                </span>
                <button
                  type="button"
                  onClick={setFullPayment}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Bayar Lunas
                </button>
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Calendar className="inline h-4 w-4 mr-1" />
                Tanggal Pembayaran *
              </label>
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleChange}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <FileText className="inline h-4 w-4 mr-1" />
                Catatan
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Catatan pembayaran (opsional)"
              />
            </div>

            {/* Payment Preview */}
            {formData.amount > 0 && (
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 mb-2">Preview Pembayaran:</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Jumlah Bayar:</span>
                    <span className="font-medium">{formatCurrency(formData.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Sisa Setelah Bayar:</span>
                    <span className="font-medium">{formatCurrency(debt.remaining_amount - formData.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Status Baru:</span>
                    <span className="font-medium">
                      {debt.remaining_amount - formData.amount <= 0 ? 'Lunas' : 'Sebagian'}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
                Tambah Pembayaran
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;