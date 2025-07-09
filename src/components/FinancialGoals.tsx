import React, { useState } from 'react';
import { Target, Plus, Edit2, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { FinancialGoal } from '../types';

interface FinancialGoalsProps {
  goals: FinancialGoal[];
  loading?: boolean;
  error?: string | null;
  onAddGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  onUpdateGoal: (id: string, goal: Partial<FinancialGoal>) => void;
  onDeleteGoal: (id: string) => void;
}

const FinancialGoals: React.FC<FinancialGoalsProps> = ({
  goals,
  loading = false,
  error,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    target_amount: 0,
    current_amount: 0,
    deadline: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const categories = [
    'Dana Darurat',
    'Liburan',
    'Kendaraan',
    'Rumah',
    'Pendidikan',
    'Investasi',
    'Gadget',
    'Lainnya'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 === GOAL FORM SUBMIT START ===');
    console.log('Form data:', formData);
    
    if (!formData.title || formData.target_amount <= 0 || !formData.deadline) {
      console.log('❌ Validation failed:', formData);
      alert('Mohon lengkapi semua field yang wajib');
      return;
    }

    try {
      console.log('✅ Validation passed, submitting goal');
      
      if (editingGoal) {
        console.log('Updating existing goal:', editingGoal.id);
        onUpdateGoal(editingGoal.id, formData);
        setEditingGoal(null);
      } else {
        console.log('Adding new goal');
        onAddGoal(formData);
      }

      setFormData({
        title: '',
        target_amount: 0,
        current_amount: 0,
        deadline: '',
        category: '',
        priority: 'medium'
      });
      setShowForm(false);
      
      console.log('🎉 === GOAL FORM SUBMIT SUCCESS ===');
      
    } catch (error: any) {
      console.error('❌ Error submitting goal form:', error);
      alert(error.message || 'Gagal menyimpan target keuangan');
    }
  };

  const handleEdit = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline,
      category: goal.category,
      priority: goal.priority
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingGoal(null);
    setFormData({
      title: '',
      target_amount: 0,
      current_amount: 0,
      deadline: '',
      category: '',
      priority: 'medium'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      case 'low': return 'Rendah';
      default: return priority;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Memuat Target Keuangan</h3>
          <p className="text-gray-600 dark:text-gray-300">Sedang mengambil data target keuangan Anda...</p>
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
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">Error Memuat Target Keuangan</h3>
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Target Keuangan</h2>
          <p className="text-gray-600 dark:text-gray-300">Tetapkan dan pantau target keuangan Anda</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Tambah Target</span>
        </button>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
          const daysRemaining = getDaysRemaining(goal.deadline);
          const isOverdue = daysRemaining < 0;
          
          return (
            <div key={goal.id} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-white">{goal.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(goal.priority)} dark:bg-opacity-20`}>
                      {getPriorityLabel(goal.priority)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{goal.category}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-medium text-gray-800 dark:text-white">{progress.toFixed(1)}%</span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      progress >= 100 ? 'bg-emerald-500' :
                      progress >= 75 ? 'bg-blue-500' :
                      progress >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Terkumpul</span>
                  <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(goal.current_amount)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Target</span>
                  <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(goal.target_amount)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Sisa</span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {formatCurrency(Math.max(goal.target_amount - goal.current_amount, 0))}
                  </span>
                </div>
                
                <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {new Date(goal.deadline).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <span className={`font-medium ${
                      isOverdue ? 'text-red-600 dark:text-red-400' :
                      daysRemaining <= 30 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {isOverdue ? `${Math.abs(daysRemaining)} hari terlambat` :
                       daysRemaining === 0 ? 'Hari ini' :
                       `${daysRemaining} hari lagi`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Belum ada target keuangan</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Mulai merencanakan masa depan dengan menetapkan target keuangan</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
          >
            Buat Target
          </button>
        </div>
      )}

      {/* Goal Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editingGoal ? 'Edit Target' : 'Tambah Target'}
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
                    Nama Target *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Contoh: Dana Darurat"
                  />
                </div>

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
                    Target Jumlah (IDR) *
                  </label>
                  <input
                    type="number"
                    value={formData.target_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_amount: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="100000"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jumlah Saat Ini (IDR)
                  </label>
                  <input
                    type="number"
                    value={formData.current_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, current_amount: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="10000"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Tanggal *
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prioritas
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi</option>
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
                    {editingGoal ? 'Update' : 'Tambah'}
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

export default FinancialGoals;