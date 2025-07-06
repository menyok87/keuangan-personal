import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  User, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Receipt,
  Filter
} from 'lucide-react';
import { Debt, DebtSummary } from '../types/debt';
import { useSupabaseDebts } from '../hooks/useSupabaseDebts';
import { useAuth } from '../hooks/useAuth';
import DebtForm from './DebtForm';
import PaymentForm from './PaymentForm';

const DebtManagement: React.FC = () => {
  const { user } = useAuth();
  const { debts, loading, error, addDebt, updateDebt, deleteDebt, addPayment } = useSupabaseDebts(user?.id);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [filter, setFilter] = useState<'all' | 'debt' | 'receivable'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial' | 'paid'>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-emerald-600 bg-emerald-100';
      case 'partial': return 'text-orange-600 bg-orange-100';
      case 'pending': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Lunas';
      case 'partial': return 'Sebagian';
      case 'pending': return 'Belum Bayar';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'partial': return Clock;
      case 'pending': return AlertTriangle;
      default: return Clock;
    }
  };

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Calculate summary
  const summary: DebtSummary = debts.reduce((acc, debt) => {
    if (debt.type === 'debt') {
      acc.totalDebts += debt.amount;
      if (debt.status === 'paid') acc.paidDebts += debt.amount;
      else acc.pendingDebts += debt.remaining_amount;
      if (debt.due_date && isOverdue(debt.due_date) && debt.status !== 'paid') {
        acc.overdueDebts += debt.remaining_amount;
      }
    } else {
      acc.totalReceivables += debt.amount;
      if (debt.status === 'paid') acc.paidReceivables += debt.amount;
      else acc.pendingReceivables += debt.remaining_amount;
      if (debt.due_date && isOverdue(debt.due_date) && debt.status !== 'paid') {
        acc.overdueReceivables += debt.remaining_amount;
      }
    }
    return acc;
  }, {
    totalDebts: 0,
    totalReceivables: 0,
    paidDebts: 0,
    paidReceivables: 0,
    pendingDebts: 0,
    pendingReceivables: 0,
    overdueDebts: 0,
    overdueReceivables: 0
  });

  // Filter debts
  const filteredDebts = debts
    .filter(debt => filter === 'all' || debt.type === filter)
    .filter(debt => statusFilter === 'all' || debt.status === statusFilter);

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setShowForm(true);
  };

  const handleAddPayment = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowPaymentForm(true);
  };

  const handleSubmit = async (debtData: any) => {
    try {
      if (editingDebt) {
        await updateDebt(editingDebt.id, debtData);
        setEditingDebt(null);
      } else {
        await addDebt(debtData);
      }
      setShowForm(false);
    } catch (error: any) {
      alert(error.message || 'Gagal menyimpan data hutang');
    }
  };

  const handlePaymentSubmit = async (paymentData: any) => {
    try {
      if (selectedDebt) {
        await addPayment(selectedDebt.id, paymentData);
        setSelectedDebt(null);
        setShowPaymentForm(false);
      }
    } catch (error: any) {
      alert(error.message || 'Gagal menambah pembayaran');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data hutang ini?')) {
      try {
        await deleteDebt(id);
      } catch (error: any) {
        alert(error.message || 'Gagal menghapus data hutang');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Memuat Data Hutang</h3>
          <p className="text-gray-600">Sedang mengambil data hutang dan piutang Anda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center py-12">
          <div className="bg-red-100 rounded-xl p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Memuat Data Hutang</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Manajemen Hutang & Piutang</h2>
            <p className="text-gray-600">Kelola dan pantau hutang serta piutang Anda</p>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Tambah Hutang/Piutang</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Hutang</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.pendingDebts)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Dari {formatCurrency(summary.totalDebts)}
              </p>
            </div>
            <div className="bg-red-100 rounded-2xl p-4">
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Piutang</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(summary.pendingReceivables)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Dari {formatCurrency(summary.totalReceivables)}
              </p>
            </div>
            <div className="bg-emerald-100 rounded-2xl p-4">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Hutang Jatuh Tempo</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.overdueDebts)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Perlu segera dibayar</p>
            </div>
            <div className="bg-orange-100 rounded-2xl p-4">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Sudah Lunas</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.paidDebts + summary.paidReceivables)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total terbayar</p>
            </div>
            <div className="bg-blue-100 rounded-2xl p-4">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline h-4 w-4 mr-1" />
              Tipe
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua</option>
              <option value="debt">Hutang</option>
              <option value="receivable">Piutang</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Belum Bayar</option>
              <option value="partial">Sebagian</option>
              <option value="paid">Lunas</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Menampilkan {filteredDebts.length} dari {debts.length} data
            </div>
          </div>
        </div>
      </div>

      {/* Debt List */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="divide-y divide-gray-100">
          {filteredDebts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Tidak ada data hutang</h3>
              <p>Belum ada data hutang atau piutang yang sesuai dengan filter</p>
            </div>
          ) : (
            filteredDebts.map((debt) => {
              const StatusIcon = getStatusIcon(debt.status);
              const isDebtOverdue = debt.due_date && isOverdue(debt.due_date) && debt.status !== 'paid';
              
              return (
                <div key={debt.id} className="p-6 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Type Icon */}
                      <div className={`rounded-2xl p-3 ${
                        debt.type === 'debt' 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {debt.type === 'debt' ? (
                          <TrendingDown className="h-6 w-6" />
                        ) : (
                          <TrendingUp className="h-6 w-6" />
                        )}
                      </div>
                      
                      {/* Debt Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-800 text-lg">
                              {debt.description}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <div className="flex items-center space-x-1">
                                <User className="h-4 w-4" />
                                <span>
                                  {debt.type === 'debt' 
                                    ? `Kepada: ${debt.creditor_name}` 
                                    : `Dari: ${debt.debtor_name || debt.creditor_name}`
                                  }
                                </span>
                              </div>
                              {debt.due_date && (
                                <div className={`flex items-center space-x-1 ${
                                  isDebtOverdue ? 'text-red-600 font-medium' : ''
                                }`}>
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    Jatuh tempo: {formatDate(debt.due_date)}
                                    {isDebtOverdue && ' (Terlambat)'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right flex-shrink-0 ml-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(debt.status)}`}>
                                {getStatusLabel(debt.status)}
                              </span>
                              <StatusIcon className={`h-4 w-4 ${
                                debt.status === 'paid' ? 'text-emerald-600' :
                                debt.status === 'partial' ? 'text-orange-600' : 'text-red-600'
                              }`} />
                            </div>
                            <p className="text-lg font-bold text-gray-800">
                              {formatCurrency(debt.amount)}
                            </p>
                            {debt.status !== 'paid' && (
                              <p className="text-sm text-gray-600">
                                Sisa: {formatCurrency(debt.remaining_amount)}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        {debt.status !== 'paid' && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Progress Pembayaran</span>
                              <span>{((debt.amount - debt.remaining_amount) / debt.amount * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  debt.status === 'partial' ? 'bg-orange-500' : 'bg-gray-300'
                                }`}
                                style={{ width: `${(debt.amount - debt.remaining_amount) / debt.amount * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Interest Rate */}
                        {debt.interest_rate > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                              Bunga: {debt.interest_rate}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                      {debt.status !== 'paid' && (
                        <button
                          onClick={() => handleAddPayment(debt)}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                          title="Tambah Pembayaran"
                        >
                          <Receipt className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(debt)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(debt.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Forms */}
      {showForm && (
        <DebtForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingDebt(null);
          }}
          editDebt={editingDebt}
        />
      )}

      {showPaymentForm && selectedDebt && (
        <PaymentForm
          debt={selectedDebt}
          onSubmit={handlePaymentSubmit}
          onCancel={() => {
            setShowPaymentForm(false);
            setSelectedDebt(null);
          }}
        />
      )}
    </div>
  );
};

export default DebtManagement;