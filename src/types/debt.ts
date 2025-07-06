export interface Debt {
  id: string;
  user_id: string;
  creditor_name: string;
  debtor_name?: string;
  amount: number;
  remaining_amount: number;
  description: string;
  due_date?: string;
  status: 'pending' | 'partial' | 'paid';
  type: 'debt' | 'receivable';
  interest_rate: number;
  created_at: string;
  updated_at: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  payment_date: string;
  notes?: string;
  created_at: string;
}

export interface DebtSummary {
  totalDebts: number;
  totalReceivables: number;
  paidDebts: number;
  paidReceivables: number;
  pendingDebts: number;
  pendingReceivables: number;
  overdueDebts: number;
  overdueReceivables: number;
}