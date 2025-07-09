import React, { useState } from 'react';
import { Plus, Receipt, TrendingUp, Target, BarChart3, Settings, CreditCard } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useDarkMode } from './hooks/useDarkMode';
import { useSupabaseTransactions } from './hooks/useSupabaseTransactions';
import { useSupabaseBudgets } from './hooks/useSupabaseBudgets';
import { useSupabaseGoals } from './hooks/useSupabaseGoals';
import { useSupabaseDebts } from './hooks/useSupabaseDebts';
import AuthPage from './components/Auth/AuthPage';
import CustomUserProfile from './components/CustomUserProfile';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import BudgetManager from './components/BudgetManager';
import FinancialGoals from './components/FinancialGoals';
import Reports from './components/Reports';
import DebtManagement from './components/DebtManagement';
import MonthSelector from './components/MonthSelector';
import DarkModeToggle from './components/DarkModeToggle';
import { Transaction } from './types';

function App() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'budget' | 'goals' | 'debts' | 'reports'>('dashboard');

  const {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    forceRefresh
  } = useSupabaseTransactions(user?.id);

  const {
    budgets,
    loading: budgetsLoading,
    error: budgetsError,
    addBudget,
    updateBudget,
    deleteBudget
  } = useSupabaseBudgets(user?.id);

  const {
    goals,
    loading: goalsLoading,
    error: goalsError,
    addGoal,
    updateGoal,
    deleteGoal
  } = useSupabaseGoals(user?.id);

  const {
    debts,
    loading: debtsLoading,
    error: debtsError,
    addDebt,
    updateDebt,
    deleteDebt: removeDebt,
    addPayment
  } = useSupabaseDebts(user?.id);

  // Show auth page if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Memuat Aplikasi</h2>
          <p className="text-gray-600 dark:text-gray-300">Sedang menyiapkan data keuangan Anda...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  const handleSubmit = async (transactionData: Omit<Transaction, 'id'>) => {
    try {
      console.log('=== APP HANDLE SUBMIT START ===');
      console.log('Transaction data received:', transactionData);
      console.log('👤 User ID:', user?.id);
      console.log('🔐 Is authenticated:', isAuthenticated);
      console.log('✏️  Editing transaction:', editingTransaction?.id);
      
      // Additional validation before submitting
      if (!user?.id) {
        throw new Error('❌ User tidak ditemukan. Silakan login ulang.');
      }
      
      if (!isAuthenticated) {
        throw new Error('❌ Sesi login telah berakhir. Silakan login ulang.');
      }
      
      if (editingTransaction) {
        console.log('🔄 Updating existing transaction:', editingTransaction.id);
        console.log('📝 Original transaction:', editingTransaction);
        console.log('📝 Updates to apply:', transactionData);
        
        if (!editingTransaction.id) {
          throw new Error('❌ ID transaksi tidak valid untuk update');
        }
        
        await updateTransaction(editingTransaction.id, transactionData);
        console.log('✅ Transaction updated successfully');
        setEditingTransaction(null);
      } else {
        console.log('➕ Adding new transaction for user:', user?.id);
        await addTransaction(transactionData);
        console.log('✅ Transaction added successfully');
      }
      
      setShowForm(false);
      console.log('🎉 === APP HANDLE SUBMIT SUCCESS ===');
      
    } catch (error: any) {
      console.error('💥 === APP HANDLE SUBMIT ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      
      // More specific error messages
      let errorMessage = 'Gagal menyimpan transaksi';
      
      if (error.message.includes('tidak ditemukan') || error.message.includes('sudah dihapus')) {
        errorMessage = 'Transaksi tidak ditemukan atau sudah dihapus. Data akan dimuat ulang.';
        // Force refresh data
        setTimeout(() => {
          forceRefresh();
          setShowForm(false);
          setEditingTransaction(null);
        }, 1500);
      } else if (error.message.includes('tidak memiliki akses') || error.message.includes('akses ditolak') || error.message.includes('login ulang')) {
        errorMessage = 'Sesi login bermasalah. Silakan logout dan login ulang.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Masalah koneksi. Periksa internet Anda dan coba lagi.';
      } else if (error.message.includes('validation') || error.message.includes('wajib')) {
        errorMessage = error.message; // Show validation errors as-is
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show user-friendly error message
      alert(errorMessage);
      
      // Only close form for certain errors
      if (error.message.includes('tidak ditemukan') || error.message.includes('login ulang')) {
        setShowForm(false);
        setEditingTransaction(null);
      }
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        await deleteTransaction(id);
        console.log('Transaction deleted successfully');
      } catch (error: any) {
        console.error('Error deleting transaction:', error);
        alert(error.message || 'Gagal menghapus transaksi');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  // Budget handlers with database integration
  const handleAddBudget = async (budget: any) => {
    try {
      await addBudget(budget);
      console.log('✅ Budget added successfully');
    } catch (error: any) {
      console.error('❌ Error adding budget:', error);
      alert(error.message || 'Gagal menambah anggaran');
    }
  };

  const handleUpdateBudget = async (id: string, updates: any) => {
    try {
      await updateBudget(id, updates);
      console.log('✅ Budget updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating budget:', error);
      alert(error.message || 'Gagal mengupdate anggaran');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus anggaran ini?')) {
      try {
        await deleteBudget(id);
        console.log('✅ Budget deleted successfully');
      } catch (error: any) {
        console.error('❌ Error deleting budget:', error);
        alert(error.message || 'Gagal menghapus anggaran');
      }
    }
  };

  // Goal handlers with database integration
  const handleAddGoal = async (goal: any) => {
    try {
      await addGoal(goal);
      console.log('✅ Goal added successfully');
    } catch (error: any) {
      console.error('❌ Error adding goal:', error);
      alert(error.message || 'Gagal menambah target keuangan');
    }
  };

  const handleUpdateGoal = async (id: string, updates: any) => {
    try {
      await updateGoal(id, updates);
      console.log('✅ Goal updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating goal:', error);
      alert(error.message || 'Gagal mengupdate target keuangan');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus target ini?')) {
      try {
        await deleteGoal(id);
        console.log('✅ Goal deleted successfully');
      } catch (error: any) {
        console.error('❌ Error deleting goal:', error);
        alert(error.message || 'Gagal menghapus target keuangan');
      }
    }
  };

  if (loading || budgetsLoading || goalsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Memuat Aplikasi</h2>
          <p className="text-gray-600 dark:text-gray-300">Sedang menyiapkan data keuangan Anda...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'transactions', label: 'Transaksi', icon: Receipt },
    { id: 'budget', label: 'Anggaran', icon: Target },
    { id: 'goals', label: 'Target', icon: Settings },
    { id: 'debts', label: 'Hutang', icon: CreditCard },
    { id: 'reports', label: 'Laporan', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-3 shadow-lg">
                <Receipt className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                  Akuntansi Keuangan
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Sistem manajemen keuangan personal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <DarkModeToggle />
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium text-sm">Tambah</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-2 border border-gray-200 dark:border-gray-700">
              <div className="flex space-x-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white shadow-lg'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <CustomUserProfile />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Month Selector - Only show for dashboard and transactions */}
        {(activeTab === 'dashboard' || activeTab === 'transactions') && (
          <div className="mb-8">
            <MonthSelector
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
            />
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            currentMonth={currentMonth}
            error={error}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentMonth={currentMonth}
            error={error}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetManager
            budgets={budgets}
            loading={budgetsLoading}
            error={budgetsError}
            onAddBudget={handleAddBudget}
            onUpdateBudget={handleUpdateBudget}
            onDeleteBudget={handleDeleteBudget}
          />
        )}

        {activeTab === 'goals' && (
          <FinancialGoals
            goals={goals}
            loading={goalsLoading}
            error={goalsError}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {activeTab === 'reports' && (
          <Reports transactions={transactions} />
        )}

        {activeTab === 'debts' && (
          <DebtManagement />
        )}
      </main>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          editTransaction={editingTransaction}
        />
      )}
    </div>
  );
}

export default App;