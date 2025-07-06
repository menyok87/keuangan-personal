import { useState, useEffect } from 'react';
import { Transaction } from '../types';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load transactions from localStorage on mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('accounting-transactions');
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
    setLoading(false);
  }, []);

  // Save transactions to localStorage whenever transactions change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('accounting-transactions', JSON.stringify(transactions));
    }
  }, [transactions, loading]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(transaction => 
      transaction.id === id 
        ? { ...transaction, ...updates, updated_at: new Date().toISOString() }
        : transaction
    ));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
  };

  const getTransactionById = (id: string) => {
    return transactions.find(transaction => transaction.id === id);
  };

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById
  };
};