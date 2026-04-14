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
import { useDebts } from '../hooks/useDebts';
import { useAuth } from '../contexts/AuthContext';
import DebtForm from './DebtForm';
import PaymentForm from './PaymentForm';
import DebtReports from './DebtReports';

const DebtManagement: React.FC = () => {
  const { user } = useAuth();
  const { debts, loading, error, addDebt, updateDebt, deleteDebt, addPayment } = useDebts();
  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [filter, setFilter] = useState<'all' | 'debt' | 'receivable'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial' | 'paid'>('all');
  const [activeView, setActiveView] = useState<'list' | 'reports'>('list');

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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Memuat Data Hutang</h3>
          <p className="text-gray-600 dark:text-gray-300">Sedang mengambil data hutang dan piutang Anda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="text-center py-12">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-xl p-6">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">Error Memuat Data Hutang</h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-4 sm:p-8 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white mb-1">Hutang & Piutang</h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Kelola dan pantau hutang serta piutang Anda</p>
          </div>

          <div className="flex space-x-2 sm:space-x-4 w-full sm:w-auto">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg sm:rounded-xl p-1">
              <button
                onClick={() => setActiveView('list')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  activeView === 'list'
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                Daftar
              </button>
              <button
                onClick={() => setActiveView('reports')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  activeView === 'reports'
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                Laporan
              </button>
            </div>

            {activeView === 'list' && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-3 sm:px-6 py-1.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm ml-auto"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Tambah</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Show Reports or List based on active view */}
      {activeView === 'reports' ? (
        <DebtReports />
      ) : (
        <>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-3 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Hutang</p>
              <p className="text-base sm:text-2xl font-bold text-red-600 truncate">
                {formatCurrency(summary.pendingDebts)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate hidden sm:block">
                Dari {formatCurrency(summary.totalDebts)}
              </p>
            </div>
            <div className="bg-red-100 rounded-xl sm:rounded-2xl p-2 sm:p-4 ml-2 flex-shrink-0">
              <TrendingDown className="h-5 w-5 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-3 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Piutang</p>
              <p className="text-base sm:text-2xl font-bold text-emerald-600 truncate">
                {formatCurrency(summary.pendingReceivables)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate hidden sm:block">
                Dari {formatCurrency(summary.totalReceivables)}
              </p>
            </div>
            <div className="bg-emerald-100 rounded-xl sm:rounded-2xl p-2 sm:p-4 ml-2 flex-shrink-0">
              <TrendingUp className="h-5 w-5 sm:h-8 sm:w-8 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-3 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Jatuh Tempo</p>
              <p className="text-base sm:text-2xl font-bold text-orange-600 truncate">
                {formatCurrency(summary.overdueDebts)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">Perlu segera dibayar</p>
            </div>
            <div className="bg-orange-100 rounded-xl sm:rounded-2xl p-2 sm:p-4 ml-2 flex-shrink-0">
              <AlertTriangle className="h-5 w-5 sm:h-8 sm:w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-3 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sudah Lunas</p>
              <p className="text-base sm:text-2xl font-bold text-blue-600 truncate">
                {formatCurrency(summary.paidDebts + summary.paidReceivables)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">Total terbayar</p>
            </div>
            <div className="bg-blue-100 rounded-xl sm:rounded-2xl p-2 sm:p-4 ml-2 flex-shrink-0">
              <CheckCircle className="h-5 w-5 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl border border-gray-100 dark:border-gray-700 p-3 sm:p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              <Filter className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Tipe
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Semua</option>
              <option value="debt">Hutang</option>
              <option value="receivable">Piutang</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Belum Bayar</option>
              <option value="partial">Sebagian</option>
              <option value="paid">Lunas</option>
            </select>
          </div>

          <div className="col-span-2 md:col-span-1 flex items-end">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              {filteredDebts.length} dari {debts.length} data
            </div>
          </div>
        </div>
      </div>

      {/* Debt List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {filteredDebts.length === 0 ? (
            <div className="p-6 sm:p-12 text-center text-gray-500 dark:text-gray-400">
              <CreditCard className="h-10 w-10 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-sm sm:text-lg font-medium text-gray-800 dark:text-white mb-1 sm:mb-2">Tidak ada data hutang</h3>
              <p className="text-xs sm:text-sm">Belum ada data hutang atau piutang yang sesuai dengan filter</p>
            </div>
          ) : (
            filteredDebts.map((debt) => {
              const StatusIcon = getStatusIcon(debt.status);
              const isDebtOverdue = debt.due_date && isOverdue(debt.due_date) && debt.status !== 'paid';

              return (
                <div key={debt.id} className="p-3 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 sm:space-x-4 flex-1 min-w-0">
                      {/* Type Icon */}
                      <div className={`rounded-xl sm:rounded-2xl p-2 sm:p-3 flex-shrink-0 ${
                        debt.type === 'debt'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {debt.type === 'debt' ? (
                          <TrendingDown className="h-4 w-4 sm:h-6 sm:w-6" />
                        ) : (
                          <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6" />
                        )}
                      </div>

                      {/* Debt Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1 sm:mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-lg truncate">
                              {debt.description}
                            </h3>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-300 mt-1">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">
                                  {debt.type === 'debt'
                                    ? debt.creditor_name
                                    : (debt.debtor_name || debt.creditor_name)
                                  }
                                </span>
                              </div>
                              {debt.due_date && (
                                <div className={`flex items-center space-x-1 ${
                                  isDebtOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''
                                }`}>
                                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span>{formatDate(debt.due_date)}{isDebtOverdue && ' !'}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 ml-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(debt.status)}`}>
                              {getStatusLabel(debt.status)}
                            </span>
                            <p className="text-sm sm:text-lg font-bold text-gray-800 dark:text-white mt-1">
                              {formatCurrency(debt.amount)}
                            </p>
                            {debt.status !== 'paid' && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Sisa: {formatCurrency(debt.remaining_amount)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {debt.status !== 'paid' && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                              <span>Progress</span>
                              <span>{((debt.amount - debt.remaining_amount) / debt.amount * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                  debt.status === 'partial' ? 'bg-orange-500' : 'bg-gray-300'
                                }`}
                                style={{ width: `${(debt.amount - debt.remaining_amount) / debt.amount * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Interest + Actions row */}
                        <div className="flex items-center justify-between mt-2">
                          {debt.interest_rate > 0 ? (
                            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full text-xs">
                              Bunga: {debt.interest_rate}%
                            </span>
                          ) : <div />}

                          {/* Action Buttons — always visible on mobile */}
                          <div className="flex space-x-1 sm:space-x-2">
                            {debt.status !== 'paid' && (
                              <button
                                onClick={() => handleAddPayment(debt)}
                                className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg sm:rounded-xl transition-colors"
                                title="Tambah Pembayaran"
                              >
                                <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(debt)}
                              className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg sm:rounded-xl transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(debt.id)}
                              className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg sm:rounded-xl transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
        </>
      )}

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