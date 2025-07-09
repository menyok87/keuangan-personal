import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useDarkMode } from './hooks/useDarkMode';
import { useSupabaseTransactions } from './hooks/useSupabaseTransactions';
import { useSupabaseBudgets } from './hooks/useSupabaseBudgets';
import { useSupabaseGoals } from './hooks/useSupabaseGoals';
import { useSupabaseDebts } from './hooks/useSupabaseDebts';
import AuthPage from './components/Auth/AuthPage';
import MainLayout from './components/MainLayout';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import BudgetManager from './components/BudgetManager';
import FinancialGoals from './components/FinancialGoals';
import ReportsWithProfile from './components/ReportsWithProfile';
import DebtManagement from './components/DebtManagement';
import MonthSelector from './components/MonthSelector';
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

      if (!user?.id) {
    <MainLayout 
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as any)}
      showProfile={activeTab === 'reports'}
    >
      <div>
        {/* Add Transaction Button */}
        {activeTab !== 'reports' && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Tambah Transaksi</span>
            </button>
          </div>
        )}
      

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
    <MainLayout 
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as any)}
      showProfile={activeTab === 'reports'}
    >
      <div>
        {/* Add Transaction Button */}
        {activeTab !== 'reports' && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Tambah Transaksi</span>
            </button>
          </div>
        )}
      
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
          <ReportsWithProfile transactions={transactions} />
        )}

        {activeTab === 'debts' && (
          <DebtManagement />
        )}

        {/* Transaction Form Modal */}
        {showForm && (
          <TransactionForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            editTransaction={editingTransaction}
          />
        )}
      </div>
    </MainLayout>
  );
}

export default App;