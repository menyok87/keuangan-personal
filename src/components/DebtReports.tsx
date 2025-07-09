import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Download, 
  Calendar, 
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { Debt } from '../types/debt';
import { useSupabaseDebts } from '../hooks/useSupabaseDebts';
import { useAuth } from '../hooks/useAuth';

const DebtReports: React.FC = () => {
  const { user } = useAuth();
  const { debts, loading, error } = useSupabaseDebts(user?.id);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [reportType, setReportType] = useState<'overview' | 'status' | 'timeline'>('overview');

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

  // Filter debts by period
  const filteredDebts = debts.filter(debt => {
    if (selectedPeriod === 'all') return true;
    
    const debtDate = new Date(debt.created_at);
    const now = new Date();
    
    switch (selectedPeriod) {
      case '30days':
        return debtDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90days':
        return debtDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1year':
        return debtDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return true;
    }
  });

  // Calculate statistics
  const stats = {
    totalDebts: filteredDebts.filter(d => d.type === 'debt').reduce((sum, d) => sum + d.amount, 0),
    totalReceivables: filteredDebts.filter(d => d.type === 'receivable').reduce((sum, d) => sum + d.amount, 0),
    remainingDebts: filteredDebts.filter(d => d.type === 'debt' && d.status !== 'paid').reduce((sum, d) => sum + d.remaining_amount, 0),
    remainingReceivables: filteredDebts.filter(d => d.type === 'receivable' && d.status !== 'paid').reduce((sum, d) => sum + d.remaining_amount, 0),
    paidDebts: filteredDebts.filter(d => d.type === 'debt' && d.status === 'paid').length,
    paidReceivables: filteredDebts.filter(d => d.type === 'receivable' && d.status === 'paid').length,
    partialDebts: filteredDebts.filter(d => d.type === 'debt' && d.status === 'partial').length,
    partialReceivables: filteredDebts.filter(d => d.type === 'receivable' && d.status === 'partial').length,
    pendingDebts: filteredDebts.filter(d => d.type === 'debt' && d.status === 'pending').length,
    pendingReceivables: filteredDebts.filter(d => d.type === 'receivable' && d.status === 'pending').length,
    overdueDebts: filteredDebts.filter(d => d.type === 'debt' && d.due_date && new Date(d.due_date) < new Date() && d.status !== 'paid').length,
    overdueReceivables: filteredDebts.filter(d => d.type === 'receivable' && d.due_date && new Date(d.due_date) < new Date() && d.status !== 'paid').length
  };

  const exportReport = () => {
    const csvData = [
      ['Tipe', 'Nama', 'Deskripsi', 'Jumlah', 'Sisa', 'Status', 'Jatuh Tempo', 'Bunga', 'Dibuat'],
      ...filteredDebts.map(debt => [
        debt.type === 'debt' ? 'Hutang' : 'Piutang',
        debt.creditor_name,
        debt.description,
        debt.amount,
        debt.remaining_amount,
        debt.status === 'paid' ? 'Lunas' : debt.status === 'partial' ? 'Sebagian' : 'Belum Bayar',
        debt.due_date || '-',
        debt.interest_rate + '%',
        formatDate(debt.created_at)
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-hutang-piutang-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Memuat Laporan</h3>
          <p className="text-gray-600 dark:text-gray-300">Sedang menyiapkan laporan hutang dan piutang...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="text-center py-12">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-xl p-6">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">Error Memuat Laporan</h3>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Laporan Hutang & Piutang</h2>
            <p className="text-gray-600 dark:text-gray-300">Analisis mendalam tentang hutang dan piutang Anda</p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Semua Periode</option>
              <option value="30days">30 Hari Terakhir</option>
              <option value="90days">90 Hari Terakhir</option>
              <option value="1year">1 Tahun Terakhir</option>
            </select>
            
            <button
              onClick={exportReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setReportType('overview')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              reportType === 'overview'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="h-5 w-5 mx-auto mb-1" />
            Overview
          </button>
          <button
            onClick={() => setReportType('status')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              reportType === 'status'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <PieChart className="h-5 w-5 mx-auto mb-1" />
            Status
          </button>
          <button
            onClick={() => setReportType('timeline')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              reportType === 'timeline'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <Calendar className="h-5 w-5 mx-auto mb-1" />
            Timeline
          </button>
        </div>

        <div className="p-8">
          {reportType === 'overview' && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Total Hutang</h3>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(stats.totalDebts)}</p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Sisa: {formatCurrency(stats.remainingDebts)}
                  </p>
                </div>
                
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">Total Piutang</h3>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(stats.totalReceivables)}</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    Sisa: {formatCurrency(stats.remainingReceivables)}
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">Net Position</h3>
                  <p className={`text-2xl font-bold ${
                    stats.remainingReceivables - stats.remainingDebts >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    {formatCurrency(stats.remainingReceivables - stats.remainingDebts)}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {stats.remainingReceivables - stats.remainingDebts >= 0 ? 'Surplus' : 'Defisit'}
                  </p>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">Jatuh Tempo</h3>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {stats.overdueDebts + stats.overdueReceivables}
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                    Hutang: {stats.overdueDebts} | Piutang: {stats.overdueReceivables}
                  </p>
                </div>
              </div>

              {/* Debt vs Receivable Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Perbandingan Hutang vs Piutang</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">Hutang</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-white">{formatCurrency(stats.remainingDebts)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                        <div
                          className="bg-red-500 h-3 rounded-full transition-all duration-700"
                          style={{ 
                            width: `${stats.remainingDebts + stats.remainingReceivables > 0 
                              ? (stats.remainingDebts / (stats.remainingDebts + stats.remainingReceivables)) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Piutang</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-white">{formatCurrency(stats.remainingReceivables)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                        <div
                          className="bg-emerald-500 h-3 rounded-full transition-all duration-700"
                          style={{ 
                            width: `${stats.remainingDebts + stats.remainingReceivables > 0 
                              ? (stats.remainingReceivables / (stats.remainingDebts + stats.remainingReceivables)) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Top 5 Hutang/Piutang Terbesar</h3>
                  <div className="space-y-3">
                    {filteredDebts
                      .filter(d => d.status !== 'paid')
                      .sort((a, b) => b.remaining_amount - a.remaining_amount)
                      .slice(0, 5)
                      .map((debt, index) => (
                        <div key={debt.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              debt.type === 'debt' ? 'bg-red-500 dark:bg-red-600' : 'bg-emerald-500 dark:bg-emerald-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-white truncate max-w-32">
                                {debt.description}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{debt.creditor_name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${
                              debt.type === 'debt' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {formatCurrency(debt.remaining_amount)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {debt.type === 'debt' ? 'Hutang' : 'Piutang'}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportType === 'status' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Analisis Status Pembayaran</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Debt Status */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <h4 className="font-medium text-gray-800 dark:text-white mb-4">Status Hutang</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-medium text-gray-800 dark:text-white">Lunas</span>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.paidDebts}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-medium text-gray-800 dark:text-white">Sebagian</span>
                      </div>
                      <span className="font-bold text-orange-600 dark:text-orange-400">{stats.partialDebts}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-gray-800 dark:text-white">Belum Bayar</span>
                      </div>
                      <span className="font-bold text-red-600 dark:text-red-400">{stats.pendingDebts}</span>
                    </div>
                  </div>
                </div>

                {/* Receivable Status */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <h4 className="font-medium text-gray-800 dark:text-white mb-4">Status Piutang</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-medium text-gray-800 dark:text-white">Lunas</span>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.paidReceivables}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-medium text-gray-800 dark:text-white">Sebagian</span>
                      </div>
                      <span className="font-bold text-orange-600 dark:text-orange-400">{stats.partialReceivables}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-gray-800 dark:text-white">Belum Bayar</span>
                      </div>
                      <span className="font-bold text-red-600 dark:text-red-400">{stats.pendingReceivables}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportType === 'timeline' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Timeline Jatuh Tempo</h3>
              
              <div className="space-y-4">
                {filteredDebts
                  .filter(d => d.due_date && d.status !== 'paid')
                  .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                  .map(debt => {
                    const dueDate = new Date(debt.due_date!);
                    const today = new Date();
                    const isOverdue = dueDate < today;
                    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={debt.id} className={`p-4 rounded-xl border-l-4 ${
                        isOverdue ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                        daysUntilDue <= 7 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500' :
                        daysUntilDue <= 30 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                        'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 dark:text-white">{debt.description}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {debt.type === 'debt' ? 'Kepada:' : 'Dari:'} {debt.creditor_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Jatuh tempo: {formatDate(debt.due_date!)}
                              {isOverdue && ` (${Math.abs(daysUntilDue)} hari terlambat)`}
                              {!isOverdue && daysUntilDue <= 30 && ` (${daysUntilDue} hari lagi)`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              debt.type === 'debt' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {formatCurrency(debt.remaining_amount)}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isOverdue ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                              daysUntilDue <= 7 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                              'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                            }`}>
                              {debt.type === 'debt' ? 'Hutang' : 'Piutang'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                
                {filteredDebts.filter(d => d.due_date && d.status !== 'paid').length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p>Tidak ada hutang/piutang dengan jatuh tempo</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebtReports;