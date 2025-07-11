import React, { useState } from 'react';
import { Edit2, Trash2, TrendingUp, TrendingDown, Filter, Search, MapPin, Tag, CreditCard, Calendar, SortAsc, SortDesc } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  currentMonth: string;
  error?: string | null;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  onEdit, 
  onDelete, 
  currentMonth,
  error
}) => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  const filteredTransactions = transactions
    .filter(t => t.date.startsWith(currentMonth))
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t => selectedCategory === '' || t.category === selectedCategory)
    .filter(t => selectedPaymentMethod === '' || t.paymentMethod === selectedPaymentMethod)
    .filter(t => 
      searchTerm === '' || 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

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

  const getPaymentMethodIcon = (method: string) => {
    const icons = {
      cash: '💵',
      credit_card: '💳',
      debit_card: '💳',
      bank_transfer: '🏦',
      e_wallet: '📱'
    };
    return icons[method as keyof typeof icons] || '💳';
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: 'Tunai',
      credit_card: 'Kartu Kredit',
      debit_card: 'Kartu Debit',
      bank_transfer: 'Transfer Bank',
      e_wallet: 'E-Wallet'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const uniqueCategories = [...new Set(transactions.map(t => t.category))].filter(Boolean);
  const uniquePaymentMethods = [...new Set(transactions.map(t => t.paymentMethod))];

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // Show error message if there's an error
  if (error) {
    return (
      <>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
            <div className="text-center">
              <div className="bg-red-100 dark:bg-red-900/20 rounded-xl p-6">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">Error Memuat Transaksi</h3>
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors"
                  >
                    Muat Ulang
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔄 Force refresh transactions');
                      window.location.reload();
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Debug Panel */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">🔍 Troubleshooting</h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <p><strong>1. Buka Console Browser (F12)</strong> - Lihat error detail</p>
              <p><strong>2. Check Network Tab</strong> - Lihat request yang gagal</p>
              <p><strong>3. Coba Login Ulang</strong> - Logout dan login kembali</p>
              <p><strong>4. Test dengan Admin</strong> - Email: admin@akuntansi.com, Password: admin123</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 transition-all">
      {/* Header with Summary */}
      <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-t-2xl transition-colors">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Daftar Transaksi</h2>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">Pemasukan: {formatCurrency(totalIncome)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">Pengeluaran: {formatCurrency(totalExpenses)}</span>
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                Total: {filteredTransactions.length} transaksi
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari transaksi..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'income' | 'expense')}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">Semua Tipe</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Semua Kategori</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Semua Metode</option>
            {uniquePaymentMethods.map(method => (
              <option key={method} value={method}>{getPaymentMethodLabel(method)}</option>
            ))}
          </select>

          {/* Sort */}
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'category')}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="date">Tanggal</option>
              <option value="amount">Jumlah</option>
              <option value="category">Kategori</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-5 w-5 text-gray-600 dark:text-gray-300" /> : <SortDesc className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Filter className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Tidak ada transaksi</h3>
            <p>Tidak ada transaksi yang sesuai dengan filter yang dipilih</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Transaction Type Icon */}
                  <div className={`rounded-2xl p-3 ${
                    transaction.type === 'income' 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-6 w-6" />
                    ) : (
                      <TrendingDown className="h-6 w-6" />
                    )}
                  </div>
                  
                  {/* Transaction Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 dark:text-white text-lg truncate pr-4">
                        {transaction.description}
                      </h3>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-xl ${
                          transaction.type === 'income' 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Transaction Meta */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span>{transaction.category}</span>
                        {transaction.subcategory && (
                          <span className="text-gray-400 dark:text-gray-500">• {transaction.subcategory}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getPaymentMethodIcon(transaction.paymentMethod)}</span>
                        <span>{getPaymentMethodLabel(transaction.paymentMethod)}</span>
                      </div>
                      
                      {transaction.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{transaction.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {transaction.tags.length > 0 && (
                      <div className="flex items-center space-x-2 mt-3">
                        <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <div className="flex flex-wrap gap-1">
                          {transaction.tags.map(tag => (
                            <span
                              key={tag}
                              className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {transaction.notes && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{transaction.notes}</p>
                      </div>
                    )}

                    {/* Recurring Indicator */}
                    {transaction.is_recurring && (
                      <div className="mt-3 flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span>Transaksi berulang ({transaction.recurring_frequency})</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                  <button
                    onClick={() => onEdit(transaction)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                    title="Edit transaksi"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      console.log('Delete button clicked for transaction:', transaction.id);
                      onDelete(transaction.id);
                    }}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                    title="Hapus transaksi"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination would go here for large datasets */}
      {filteredTransactions.length > 0 && (
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-2xl">
          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            Menampilkan {filteredTransactions.length} dari {transactions.filter(t => t.date.startsWith(currentMonth)).length} transaksi
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;