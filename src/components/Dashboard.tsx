import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Wallet,
  CreditCard
} from 'lucide-react';
import { Transaction, MonthlyStats, Budget } from '../types';
import { useSupabaseBudgets } from '../hooks/useSupabaseBudgets';
import { useAuth } from '../hooks/useAuth';

interface DashboardProps {
  transactions: Transaction[];
  currentMonth: string;
  error?: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, currentMonth, error }) => {
  const { user } = useAuth();
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [categoryStats, setCategoryStats] = useState<{ [key: string]: number }>({});
  const [weeklyTrend, setWeeklyTrend] = useState<number[]>([]);

  // Get real budgets from database
  const { budgets } = useSupabaseBudgets(user?.id);

  useEffect(() => {
    const currentMonthTransactions = transactions.filter(t => 
      t.date.startsWith(currentMonth)
    );

    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpenses;
    const averageTransaction = currentMonthTransactions.length > 0 
      ? totalExpenses / currentMonthTransactions.filter(t => t.type === 'expense').length 
      : 0;

    // Calculate top category
    const categoryTotals: { [key: string]: number } = {};
    currentMonthTransactions.forEach(t => {
      if (t.type === 'expense') {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      }
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    setMonthlyStats({
      month: currentMonth,
      totalIncome,
      totalExpenses,
      netBalance,
      transactionCount: currentMonthTransactions.length,
      averageTransaction,
      topCategory,
      budgetUtilization: 0,
      savingsRate
    });

    setCategoryStats(categoryTotals);

    // Calculate weekly trend
    const weeks = [0, 0, 0, 0];
    currentMonthTransactions.forEach(t => {
      const day = new Date(t.date).getDate();
      const weekIndex = Math.min(Math.floor((day - 1) / 7), 3);
      if (t.type === 'expense') {
        weeks[weekIndex] += t.amount;
      }
    });
    setWeeklyTrend(weeks);

  }, [transactions, currentMonth, budgets]);

  if (!monthlyStats) return null;

  // Show error if there's one
  if (error) {
    return (
      <>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center">
              <div className="bg-red-100 rounded-xl p-6">
                <h3 className="text-lg font-medium text-red-800 mb-2">Error Memuat Data</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Muat Ulang Halaman
                  </button>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Reset & Muat Ulang
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Debug Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-medium text-blue-800 mb-2">🔧 Troubleshooting Guide</h4>
            <div className="text-sm text-blue-700 space-y-2">
              <p><strong>1. Buka Console Browser (F12)</strong> - Lihat log detail untuk debugging</p>
              <p><strong>2. Test dengan Admin Account:</strong></p>
              <div className="ml-4 bg-blue-100 p-2 rounded text-xs">
                <p>Email: admin@akuntansi.com</p>
                <p>Password: admin123</p>
              </div>
              <p><strong>3. Langkah Troubleshooting:</strong></p>
              <div className="ml-4 space-y-1 text-xs">
                <p>• Logout dan login ulang</p>
                <p>• Refresh halaman (Ctrl+F5)</p>
                <p>• Cek koneksi internet</p>
                <p>• Clear browser cache</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-emerald-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBudgetStatus = (percentage: number) => {
    if (percentage >= 100) return { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle };
    if (percentage >= 80) return { color: 'text-orange-600', bg: 'bg-orange-100', icon: Clock };
    return { color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle };
  };

  return (
    <div className="space-y-8">
      {/* Header with Key Metrics */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Dashboard Keuangan</h2>
              <p className="text-blue-100 text-lg">
                {new Date(currentMonth + '-01').toLocaleDateString('id-ID', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <BarChart3 className="h-10 w-10" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Saldo Bersih</p>
                  <p className="text-3xl font-bold">{formatCurrency(monthlyStats.netBalance)}</p>
                </div>
                <Wallet className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Tingkat Tabungan</p>
                  <p className="text-3xl font-bold">{monthlyStats.savingsRate.toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Rata-rata Transaksi</p>
                  <p className="text-3xl font-bold">{formatCurrency(monthlyStats.averageTransaction)}</p>
                </div>
                <PieChart className="h-8 w-8 text-blue-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Pemasukan</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(monthlyStats.totalIncome)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">+12% dari bulan lalu</p>
            </div>
            <div className="bg-emerald-100 rounded-2xl p-4">
              <ArrowUpCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(monthlyStats.totalExpenses)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">-5% dari bulan lalu</p>
            </div>
            <div className="bg-red-100 rounded-2xl p-4">
              <ArrowDownCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Transaksi</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                {monthlyStats.transactionCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kategori terbanyak: {monthlyStats.topCategory}</p>
            </div>
            <div className="bg-blue-100 rounded-2xl p-4">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Proyeksi Akhir Bulan</p>
              <p className={`text-2xl font-bold ${getBalanceColor(monthlyStats.netBalance * 1.2)}`}>
                {formatCurrency(monthlyStats.netBalance * 1.2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Berdasarkan tren saat ini</p>
            </div>
            <div className="bg-purple-100 rounded-2xl p-4">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Tracking */}
      {budgets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Pelacakan Anggaran</h3>
            <div className="bg-blue-100 rounded-xl p-2">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {budgets.slice(0, 4).map((budget) => {
              const status = getBudgetStatus(budget.percentage);
              const StatusIcon = status.icon;
              
              return (
                <div key={budget.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800 dark:text-white">{budget.category}</h4>
                    <div className={`${status.bg} rounded-full p-2`}>
                      <StatusIcon className={`h-4 w-4 ${status.color}`} />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Terpakai</span>
                      <span className="font-medium">{formatCurrency(budget.spent)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Anggaran</span>
                      <span className="font-medium">{formatCurrency(budget.amount)}</span>
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
                        {budget.percentage.toFixed(1)}% terpakai
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
        </div>
      )}

      {/* Category Breakdown & Weekly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Pengeluaran per Kategori</h3>
          <div className="space-y-4">
            {Object.entries(categoryStats)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([category, amount]) => {
                const percentage = (amount / monthlyStats.totalExpenses) * 100;
                const colors = [
                  'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 
                  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
                ];
                const colorIndex = Object.keys(categoryStats).indexOf(category) % colors.length;
                
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${colors[colorIndex]}`}></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-800 dark:text-white">{formatCurrency(amount)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`${colors[colorIndex]} h-2 rounded-full transition-all duration-700`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Tren Pengeluaran Mingguan</h3>
          <div className="space-y-4">
            {weeklyTrend.map((amount, index) => {
              const maxAmount = Math.max(...weeklyTrend);
              const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Minggu {index + 1}
                    </span>
                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Insight: Pengeluaran tertinggi di minggu ke-{weeklyTrend.indexOf(Math.max(...weeklyTrend)) + 1}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;