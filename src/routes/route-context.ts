import React, { createContext, useContext } from 'react';

export type RoutePageContent = {
  dashboard: React.ReactNode;
  transactions: React.ReactNode;
  card: React.ReactNode;
  payments: React.ReactNode;
  settings: React.ReactNode;
  cardCreate: React.ReactNode;
  cardEdit: React.ReactNode;
  transactionCreate: React.ReactNode;
  transactionEdit: React.ReactNode;
  paymentCreate: React.ReactNode;
  paymentEdit: React.ReactNode;
};

export type RouteTransaction = {
  id: number;
  card_id: number;
  card_name: string;
  particular: string;
  amount_minor: number;
  txn_at: string;
  settlement_date: string;
  payment_method: 'swipe' | 'online' | 'upi';
  upi_app_id: number | null;
  upi_app_name: string;
  notes: string;
  category?: string;
  tags?: string;
  has_attachment?: number;
};
export type RoutePayment = { id: number; amount_minor?: number; card_name?: string; paid_at?: string; reference?: string; allocated_minor?: number; unallocated_minor?: number; notes?: string };
export type RouteCard = { id: number; name: string; bank_name: string; last4: string; active: number; credit_limit_minor?: number | null; current_minor?: number; dues_minor?: number; billing_day?: number; due_days?: number };

export type AppRouteContext = {
  pages: RoutePageContent;
  txns: RouteTransaction[];
  paymentsData: RoutePayment[];
  cardsData?: RouteCard[];
  dataReady: boolean;
  deletePayment: (payment: any) => void;
  deleteTransaction: (txn: any) => void;
  deleteCard: (card: any) => void;
  appsData?: { id: number; name: string; active: number }[];
  saveUpiApp: (name: string, id?: number) => Promise<boolean>;
  deactivateUpiApp: (id: number) => void;
};


const AppRouteContext = createContext<AppRouteContext | null>(null);

export function AppRouteContextProvider({ value, children }: { value: AppRouteContext; children: React.ReactNode }) {
  return React.createElement(AppRouteContext.Provider, { value }, children);
}

export function useAppRouteContext<T extends AppRouteContext = AppRouteContext>(): T {
  const context = useContext(AppRouteContext);
  if (!context) throw new Error('App route context is unavailable');
  return context as T;
}
