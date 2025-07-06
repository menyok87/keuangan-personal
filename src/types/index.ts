export interface Transaction {
  id: string;
  user_id?: string;
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  type: 'income' | 'expense';
  date: string;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'e_wallet';
  tags: string[];
  notes?: string;
  receipt_url?: string;
  is_recurring: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  location?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  budget_limit?: number;
  subcategories: string[];
}

export interface MonthlyStats {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  averageTransaction: number;
  topCategory: string;
  budgetUtilization: number;
  savingsRate: number;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'yearly';
  spent: number;
  remaining: number;
  percentage: number;
}

export interface FinancialGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

export interface RecurringTransaction {
  id: string;
  template: Omit<Transaction, 'id' | 'date'>;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_date: string;
  is_active: boolean;
}