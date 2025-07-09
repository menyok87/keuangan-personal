import React, { useState } from 'react';
import { Target, Plus, Edit2, Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Budget } from '../types';

interface BudgetManagerProps {
  budgets: Budget[];
  loading?: boolean;
  error?: string | null;
  onAddBudget: (budget: Omit<Budget, 'id' | 'spent' | 'remaining' | 'percentage'>) => void;
  onUpdateBudget: (id: string, budget: Partial<Budget>) => void;
  onDeleteBudget: (id: string) => void;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({
  budgets,
  loading = false,
  error,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: 0,
    period: 'monthly' as 'monthly' | 'yearly'
  });

  const categories = [
    'Makanan & Minuman',
    'Transportasi',
    'Belanja',
    'Tagihan',
    'Kesehatan',
    'Hiburan',
    'Pendidikan',
    'Investasi',
    'Lainnya'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 === BUDGET FORM SUBMIT START ===');
    console.log('Form data:', formData);
    
    if (!formData.category || formData.amount <= 0) {
      console.log('❌ Validation failed:', formData);
      alert('Mohon lengkapi semua field');
      return;
    }

    try {
      console.log('✅ Validation passed, submitting budget');
      
      if (editingBudget) {
        console.log('Updating existing budget:', editingBudget.id);
        onUpdateBudget(editingBudget.id, formData);
        setEditingBudget(null);
      } else {
        console.log('Adding new budget');
        onAddBudget(formData);
      }

      setFormData({ category: '', amount: 0, period: 'monthly' });
      setShowForm(false);
      
      console.log('🎉 === BUDGET FORM SUBMIT SUCCESS ===');
      
    } catch (error: any) {
      console.error('❌ Error submitting budget form:', error);
      alert(error.message || 'Gagal menyimpan anggaran');
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount,
      period: budget.period
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBudget(null);
    setFormData({ category: '', amount: 0, period: 'monthly' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getBudgetStatus = (percentage: number) => {
    if (percentage >= 100) return { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle, status: 'Melebihi' };
    if (percentage >= 80) return { color: 'text-orange-600', bg: 'bg-orange-100', icon: Clock, status: 'Hampir Habis' };
    return { color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle, status: 'Aman' };
  };

  // Show loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Memuat Anggaran</h3>
          <p className="text-gray-600 dark:text-gray-300">Sedang mengambil data anggaran Anda...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="text-center py-12">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-xl p-6">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">Error Memuat Anggaran</h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors"
              >
                Muat Ulang
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Manajemen Anggaran</h2>
          <p className="text-gray-600 dark:text-gray-300">Kelola dan pantau anggaran bulanan Anda</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Tambah Anggaran</span>
        </button>
      </div>

      {/* Budget List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map((budget) => {
          const status = getBudgetStatus(budget.percentage);
          const StatusIcon = status.icon;
          
          return (
            <div key={budget.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <h3 className="font-semibold text-gray-800 dark:text-white">{budget.category}</h3>
                    <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                  <h3 className="font-semibold text-gray-800">{budget.category}</h3>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {budget.period === 'monthly' ? 'Bulanan' : 'Tahunan'}
                  <p className="text-sm text-gray-600 dark:text-gray-400">{budget.category}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`${status.bg} rounded-full p-2`}>
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(budget)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteBudget(budget.id)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Terpakai</span>
                  <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(budget.spent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Anggaran</span>
                  <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(budget.amount)}</span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      budget.percentage >= 100 ? 'bg-red-500' :
                      budget.percentage >= 80 ? 'bg-orange-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${status.color}`}>
                    {budget.percentage.toFixed(1)}% • {status.status}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Sisa: {formatCurrency(Math.max(budget.remaining, 0))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Belum ada anggaran</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Mulai kelola keuangan dengan membuat anggaran pertama Anda</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
          >
            Buat Anggaran
          </button>
        </div>
      )}

      {/* Budget Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editingBudget ? 'Edit Anggaran' : 'Tambah Anggaran'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <Plus className="h-6 w-6 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jumlah Anggaran (IDR)
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="10000"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Periode
                  </label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value as 'monthly' | 'yearly' }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="monthly">Bulanan</option>
                    <option value="yearly">Tahunan</option>
                  </select>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-medium"
                  >
                    {editingBudget ? 'Update' : 'Tambah'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManager;