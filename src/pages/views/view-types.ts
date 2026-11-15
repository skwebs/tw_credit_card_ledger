import type React from 'react';

export type Card = {
  id: number; name: string; bank_name: string; last4: string;
  credit_limit_minor: number | null; billing_day: number;
  billing_rule: 'end' | 'start'; due_days: number; active: number;
  current_minor?: number; dues_minor?: number; cycle_start?: string; cycle_end?: string;
};

export type Txn = {
  id: number; card_id: number; card_name: string; particular: string;
  amount_minor: number; txn_at: string; settlement_date: string;
  payment_method: 'swipe' | 'online' | 'upi'; upi_app_id: number | null;
  upi_app_name: string; notes: string; category?: string; tags?: string;
  has_attachment?: number;
};

export type Payment = {
  id: number; card_id: number; card_name: string; amount_minor: number;
  paid_at: string; reference: string; notes: string; allocated_minor: number;
  unallocated_minor: number; pending?: boolean;
};

export type Statement = {
  id: number; card_id: number; card_name: string; bank_name: string;
  cycle_start: string; cycle_end: string; statement_date: string; due_date: string;
  amount_minor: number; bill_amount_minor?: number; bank_amount_minor?: number | null;
  confirmed_at?: string | null; is_locked?: number; paid_minor: number;
  outstanding_minor: number; status: string;
};

export type AppItem = { id: number; name: string; active: number };
export type GroupedTransactions = [string, [string, Txn[]][]][];
export type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;
export type DashboardData = {
  latest?: Txn[];
  [key: string]: unknown;
};
