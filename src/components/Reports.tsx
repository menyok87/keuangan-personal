import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, Download, Calendar, Filter } from 'lucide-react';
import { Transaction } from '../types';

interface ReportsProps {
  transactions: Transaction[];
}

const Reports: React.FC<ReportsProps> = ({ transactions }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [reportType, setReportType] = useState<'overview' | 'category' | 'trend'>('overview');
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    generateReportData();
  }, [transactions, selectedPeriod]);

  const generateReportData = () => {
    const now = new Date();
    const months = selectedPeriod === '6months' ? 6 : selectedPeriod === '12months' ? 12 : 3;
    
    const monthlyStats = [];
    const categoryStats: { [key: string]: { income: number; expense: number } } = {};

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthTransactions = transactions.filter(t => t.date.startsWith(monthKey));
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      monthlyStats.push({
        month: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        income,
        expense,
        net: income - expense
      });

      // Category stats
      monthTransactions.forEach(t => {
        if (!categoryStats[t.category]) {
          categoryStats[t.category] = { income: 0, expense: 0 };
        }
        categoryStats[t.category][t.type] += t.amount;
      });
    }

    setMonthlyData(monthlyStats);
    setCategoryData(Object.entries(categoryStats).map(([category, data]) => ({
      category,
      ...data,
      total: data.income + data.expense
    })).sort((a, b) => b.total - a.total));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const exportReport = () => {
    const data = reportType === 'overview' ? monthlyData : categoryData;
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-keuangan-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalIncome = monthlyData.reduce((sum, month) => sum + month.income, 0);
  const totalExpense = monthlyData.reduce((sum, month) => sum + month.expense, 0);
  const averageMonthlyIncome = totalIncome / monthlyData.length || 0;
  const averageMonthlyExpense = totalExpense / monthlyData.length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Laporan Keuangan</h2>
            <p className="text-gray-600">Analisis mendalam tentang pola keuangan Anda</p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="3months">3 Bulan Terakhir</option>
              <option value="6months">6 Bulan Terakhir</option>
              <option value="12months">12 Bulan Terakhir</option>
            </select>
            
            <button
              onClick={exportReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setReportType('overview')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              reportType === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <BarChart3 className="h-5 w-5 mx-auto mb-1" />
            Overview
          </button>
          <button
            onClick={() => setReportType('category')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              reportType === 'category'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <PieChart className="h-5 w-5 mx-auto mb-1" />
            Kategori
          </button>
          <button
            onClick={() => setReportType('trend')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              reportType === 'trend'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <TrendingUp className="h-5 w-5 mx-auto mb-1" />
            Tren
          </button>
        </div>

        <div className="p-8">
          {reportType === 'overview' && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-emerald-50 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-emerald-600 mb-2">Total Pemasukan</h3>
                  <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</p>
                  <p className="text-sm text-emerald-600 mt-1">
                    Rata-rata: {formatCurrency(averageMonthlyIncome)}/bulan
                  </p>
                </div>
                
                <div className="bg-red-50 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-red-600 mb-2">Total Pengeluaran</h3>
                  <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpense)}</p>
                  <p className="text-sm text-red-600 mt-1">
                    Rata-rata: {formatCurrency(averageMonthlyExpense)}/bulan
                  </p>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-blue-600 mb-2">Saldo Bersih</h3>
                  <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {formatCurrency(totalIncome - totalExpense)}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Rata-rata: {formatCurrency((totalIncome - totalExpense) / monthlyData.length || 0)}/bulan
                  </p>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-purple-600 mb-2">Tingkat Tabungan</h3>
                  <p className="text-2xl font-bold text-purple-700">
                    {totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    {totalIncome > 0 && ((totalIncome - totalExpense) / totalIncome) * 100 >= 20 ? 'Sangat Baik' : 
                     totalIncome > 0 && ((totalIncome - totalExpense) / totalIncome) * 100 >= 10 ? 'Baik' : 'Perlu Ditingkatkan'}
                  </p>
                </div>
              </div>

              {/* Monthly Chart */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Tren Bulanan</h3>
                <div className="space-y-4">
                  {monthlyData.map((month, index) => {
                    const maxAmount = Math.max(...monthlyData.map(m => Math.max(m.income, m.expense)));
                    const incomeWidth = (month.income / maxAmount) * 100;
                    const expenseWidth = (month.expense / maxAmount) * 100;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">{month.month}</span>
                          <span className={`text-sm font-medium ${month.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(month.net)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 text-xs text-emerald-600">Masuk</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
                                style={{ width: `${incomeWidth}%` }}
                              />
                            </div>
                            <div className="w-24 text-xs text-right text-gray-600">
                              {formatCurrency(month.income)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 text-xs text-red-600">Keluar</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-red-500 h-2 rounded-full transition-all duration-700"
                                style={{ width: `${expenseWidth}%` }}
                              />
                            </div>
                            <div className="w-24 text-xs text-right text-gray-600">
                              {formatCurrency(month.expense)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {reportType === 'category' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Analisis per Kategori</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryData.slice(0, 10).map((category, index) => {
                  const colors = [
                    'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500',
                    'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500', 'bg-red-500',
                    'bg-green-500', 'bg-gray-500'
                  ];
                  
                  return (
                    <div key={category.category} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                          <h4 className="font-medium text-gray-800">{category.category}</h4>
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {formatCurrency(category.total)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {category.income > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-emerald-600">Pemasukan</span>
                            <span className="font-medium">{formatCurrency(category.income)}</span>
                          </div>
                        )}
                        {category.expense > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-red-600">Pengeluaran</span>
                            <span className="font-medium">{formatCurrency(category.expense)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {reportType === 'trend' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Analisis Tren</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-medium text-gray-800 mb-4">Tren Pemasukan</h4>
                  <div className="space-y-3">
                    {monthlyData.map((month, index) => {
                      const prevMonth = monthlyData[index - 1];
                      const growth = prevMonth ? ((month.income - prevMonth.income) / prevMonth.income) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{month.month}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{formatCurrency(month.income)}</span>
                            {index > 0 && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                growth >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-medium text-gray-800 mb-4">Tren Pengeluaran</h4>
                  <div className="space-y-3">
                    {monthlyData.map((month, index) => {
                      const prevMonth = monthlyData[index - 1];
                      const growth = prevMonth ? ((month.expense - prevMonth.expense) / prevMonth.expense) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{month.month}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{formatCurrency(month.expense)}</span>
                            {index > 0 && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                growth <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;