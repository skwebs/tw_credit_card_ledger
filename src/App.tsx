import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Link, Navigate, useLocation, useNavigate, useRoutes } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { clearBootstrapCache, readBootstrapCache, writeBootstrapCache, enqueueLocalMutation, listOutboxOperations, removeOutboxOperation, updateOutboxOperation, putLocalRecord, deleteLocalRecord, getLocalRecord, listLocalRecords, type BootstrapSnapshot, type LocalRecord } from './data-cache';
import { AppRouteContextProvider, type AppRouteContext } from './routes/route-context';
import ModalLink from './routes/ModalLink';
import {
  Activity, ArrowDownLeft, ArrowLeft, CalendarDays, Check, ChevronDown, ChevronRight,
  Clock3, CreditCard, Eye, EyeOff, Globe, Home, ImagePlus, Info, LogOut, MoreHorizontal, Plus,
  ReceiptText, RefreshCw, Search, Settings, ShieldCheck, SlidersHorizontal, Smartphone,
  Trash2, Wallet, X, Pencil, Paperclip, Download, Sun, Moon,
} from 'lucide-react';

// Keep route modules out of the initial application chunk. The route context
// remains owned by AppShell, so existing shared state and modal navigation stay intact.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CardsPage = lazy(() => import('./pages/cards/CardsPage'));
const CardDetailsPage = lazy(() => import('./pages/cards/CardDetailsPage'));
const PaymentsPage = lazy(() => import('./pages/payments/PaymentsPage'));
const TransactionDetailsPage = lazy(() => import('./pages/transactions/TransactionDetailsPage'));
const PaymentDetailsPage = lazy(() => import('./pages/payments/PaymentDetailsPage'));
const CardCreatePage = lazy(() => import('./pages/cards/CardCreatePage'));
const CardEditPage = lazy(() => import('./pages/cards/CardEditPage'));
const TransactionCreatePage = lazy(() => import('./pages/transactions/TransactionCreatePage'));
const TransactionEditPage = lazy(() => import('./pages/transactions/TransactionEditPage'));
const PaymentCreatePage = lazy(() => import('./pages/payments/PaymentCreatePage'));
const PaymentEditPage = lazy(() => import('./pages/payments/PaymentEditPage'));
const UpiAppFormPage = lazy(() => import('./pages/upi-apps/UpiAppFormPage'));
const UpiAppDetailsPage = lazy(() => import('./pages/upi-apps/UpiAppDetailsPage'));
const DashboardView = lazy(() => import('./pages/views/DashboardView'));
const TransactionsView = lazy(() => import('./pages/views/TransactionsView'));
const CardView = lazy(() => import('./pages/views/CardView'));
const PaymentsView = lazy(() => import('./pages/views/PaymentsView'));
const SettingsView = lazy(() => import('./pages/views/SettingsView'));

type RouteLoadingVariant = 'dashboard' | 'cards' | 'transactions' | 'payments' | 'settings' | 'detail' | 'form';

function LoadingBlock({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-neutral-800/80 motion-reduce:animate-none ${className}`} />;
}

/** Skeleton shown while a lazy route's JavaScript chunk is downloaded and evaluated. */
function RouteLoading({ variant = 'detail' }: { variant?: RouteLoadingVariant }) {
  const label = `Loading ${variant === 'detail' ? 'details' : variant} page`;
  const isForm = variant === 'form';
  const isDashboard = variant === 'dashboard';
  const isSettings = variant === 'settings';
  const isList = variant === 'cards' || variant === 'transactions' || variant === 'payments';

  return (
    <section className="space-y-5 py-3" role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}…</span>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <LoadingBlock className="h-6 w-36 max-w-[70%]" />
          <LoadingBlock className="h-3 w-52 max-w-[90%]" />
        </div>
        {!isSettings && <LoadingBlock className="h-10 w-10 shrink-0 rounded-2xl" />}
      </div>

      {isDashboard && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => <div key={i} className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4"><LoadingBlock className="h-3 w-20" /><LoadingBlock className="h-7 w-28 max-w-full" /><LoadingBlock className="h-3 w-24" /></div>)}
          </div>
          <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4"><LoadingBlock className="h-4 w-32" /><LoadingBlock className="h-40 w-full rounded-xl" /></div>
          <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4"><LoadingBlock className="h-4 w-40" />{Array.from({ length: 3 }, (_, i) => <LoadingBlock key={i} className="h-12 w-full" />)}</div>
        </>
      )}

      {isList && (
        <>
          {variant === 'transactions' && <LoadingBlock className="h-12 w-full rounded-2xl" />}
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3"><LoadingBlock className="h-11 w-11 shrink-0 rounded-2xl" /><div className="min-w-0 flex-1 space-y-2"><LoadingBlock className="h-4 w-36 max-w-[85%]" /><LoadingBlock className="h-3 w-24 max-w-[65%]" /></div><div className="space-y-2"><LoadingBlock className="ml-auto h-4 w-16" /><LoadingBlock className="ml-auto h-3 w-12" /></div></div>)}
          </div>
        </>
      )}

      {isForm && <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">{Array.from({ length: 5 }, (_, i) => <div key={i} className="space-y-2"><LoadingBlock className="h-3 w-28" /><LoadingBlock className="h-11 w-full rounded-xl" /></div>)}<div className="flex gap-3 pt-2"><LoadingBlock className="h-11 flex-1" /><LoadingBlock className="h-11 flex-1" /></div></div>}

      {isSettings && <div className="space-y-3">{Array.from({ length: 5 }, (_, i) => <div key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4"><div className="min-w-0 flex-1 space-y-2"><LoadingBlock className="h-4 w-36 max-w-[80%]" /><LoadingBlock className="h-3 w-52 max-w-full" /></div><LoadingBlock className="h-6 w-11 shrink-0 rounded-full" /></div>)}</div>}

      {variant === 'detail' && <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4"><LoadingBlock className="h-24 w-full rounded-xl" /><div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }, (_, i) => <div key={i} className="space-y-2"><LoadingBlock className="h-3 w-20" /><LoadingBlock className="h-5 w-28 max-w-full" /></div>)}</div><LoadingBlock className="h-12 w-full" /></div>}
    </section>
  );
}

/** A failed lazy chunk can occur after a deployment when an old page requests a removed asset. */
class RouteErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Unable to load route module.', error);
  }

  render() {
    if (this.state.hasError) {
      return <div className="my-6 rounded-2xl border border-amber-900/70 bg-amber-950/30 p-5" role="alert">
        <p className="font-semibold text-amber-100">This section could not be loaded.</p>
        <p className="mt-1 text-sm text-neutral-400">The app may be using an outdated cached version. Reload the app and try again.</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500">Reload app</button>
      </div>;
    }
    return this.props.children;
  }
}

type Card = { id:number; name:string; bank_name:string; last4:string; credit_limit_minor:number|null; billing_day:number; billing_rule:'end'|'start'; due_days:number; active:number; current_minor?:number; dues_minor?:number; cycle_start?:string; cycle_end?:string };
type Txn = { id:number; card_id:number; card_name:string; particular:string; amount_minor:number; txn_at:string; settlement_date:string; payment_method:'swipe'|'online'|'upi'; upi_app_id:number|null; upi_app_name:string; notes:string; category?:string; tags?:string; has_attachment?:number };
type Statement = { id:number; card_id:number; card_name:string; bank_name:string; cycle_start:string; cycle_end:string; statement_date:string; due_date:string; amount_minor:number; bill_amount_minor?:number; bank_amount_minor?:number|null; confirmed_at?:string|null; is_locked?:number; paid_minor:number; outstanding_minor:number; status:string };
type Payment = { id:number; card_id:number; card_name:string; amount_minor:number; paid_at:string; reference:string; notes:string; allocated_minor:number; unallocated_minor:number; pending?:boolean };
type AppItem = { id:number; name:string; active:number };
type Status = { setup_required:boolean; authenticated:boolean; username:string|null; user_id?:number; csrf:string };
type Tab = 'dashboard'|'transactions'|'settings'|'card'|'payments';
type Filters = { month:string; card_id:string; method:string; upi_app_id:string; category:string; q:string; from:string; to:string };
type BootstrapData = { cards:Card[]; transactions:Txn[]; apps:AppItem[]; dashboard:any; payments:Payment[]; statements:Statement[]; settings:{monthly_budget_minor:number|string;categories?:string[]} };

const APP_BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const API = `${APP_BASE}/api`;
const money = (minor:number|null|undefined) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format((Number(minor)||0)/100);
const dashboardMoney = (minor:number|null|undefined) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format((Number(minor)||0)/100);
const day = (s:string) => s ? new Date(`${s.slice(0,10)}T12:00:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const monthLabel = (s:string) => { const [y,m]=s.split('-').map(Number); return new Date(y,m-1,2).toLocaleDateString('en-IN',{month:'long',year:'numeric'}); };
const dateTimeLocal = (s?:string) => { const d=s?new Date(s.replace(' ','T')):new Date(); const p=(n:number)=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
const toSqlDateTime = (s:string) => s.replace('T',' ')+(s.length===16?':00':'');
const rupeesToMinor = (s:string) => Math.round(Number(s)*100);
const minorToRupees = (n:number|null|undefined) => (Number(n||0)/100).toFixed(2);
const nowMonth = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };

async function request<T=any>(action:string, method='GET', data?:any, params:Record<string,string>={}):Promise<T> {
  const csrfToken=sessionStorage.getItem('ccm-csrf')||'';
  const url=new URL(API,window.location.origin); url.searchParams.set('action',action);
  Object.entries(params).forEach(([k,v])=>{ if(v!=='') url.searchParams.set(k,v); });
  const isForm=typeof FormData!=='undefined' && data instanceof FormData;
  const headers:Record<string,string>={'X-CSRF-Token':csrfToken};
  if(data && !isForm) headers['Content-Type']='application/json';
  const res=await fetch(url.toString(),{method,credentials:'same-origin',headers,...(data?{body:isForm?data:JSON.stringify(data)}:{})});
  const contentType=res.headers.get('content-type')||'';
  const json=contentType.includes('application/json')?await res.json().catch(()=>({error:'The server returned invalid JSON.'})):null;
  if(!json) throw new Error(`The server returned an unexpected response (${res.status}). Check the API URL and serverless function logs.`);
  if(json.csrf) sessionStorage.setItem('ccm-csrf',json.csrf);
  if(!res.ok) throw new Error(json.error||`Request failed (${res.status})`);
  return json as T;
}

function Button({children,onClick,variant='primary',className='',type='button',disabled=false}:{children:React.ReactNode;onClick?:()=>void;variant?:'primary'|'secondary'|'ghost'|'danger';className?:string;type?:'button'|'submit';disabled?:boolean}) {
  const base='inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45';
  const styles={primary:'bg-violet-600 text-white shadow-sm hover:bg-violet-500',secondary:'border border-neutral-700 bg-neutral-800 text-neutral-100 hover:bg-neutral-700',ghost:'text-neutral-300 hover:bg-neutral-800',danger:'bg-red-950/70 text-red-300 hover:bg-red-900'};
  return <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>{children}</button>;
}
function Field({label,children,required=false}:{label:string;children:React.ReactNode;required?:boolean}) { return <label className="block min-w-0"><span className="mb-2 block text-xs font-semibold text-neutral-400">{label}{required&&<span className="text-red-400"> *</span>}</span>{children}</label>; }
const inputClass='w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-3.5 py-3 text-base text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-violet-400 focus:ring-0 focus-visible:outline-none focus-visible:ring-0';
// Shared scroll lock: nested modals must not restore page scrolling until the
// final modal has closed. Keep the original inline styles exactly as found.
let modalScrollLockCount = 0;
let modalScrollLockSnapshot: { bodyOverflow:string; htmlOverflow:string; scrollX:number; scrollY:number } | null = null;
function acquireModalScrollLock() {
  if (modalScrollLockCount === 0) {
    modalScrollLockSnapshot = {
      bodyOverflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
  modalScrollLockCount += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    modalScrollLockCount = Math.max(0, modalScrollLockCount - 1);
    if (modalScrollLockCount === 0 && modalScrollLockSnapshot) {
      const snapshot = modalScrollLockSnapshot;
      modalScrollLockSnapshot = null;
      document.body.style.overflow = snapshot.bodyOverflow;
      document.documentElement.style.overflow = snapshot.htmlOverflow;
      window.scrollTo(snapshot.scrollX, snapshot.scrollY);
    }
  };
}
function Modal({title,onClose,children,wide=false,noScroll=false,bottomSheet=false,inline=false}:{title:string;onClose:()=>void;children:React.ReactNode;wide?:boolean;noScroll?:boolean;bottomSheet?:boolean;inline?:boolean}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(()=>{
    if (inline) return;
    const releaseScrollLock = acquireModalScrollLock();
    const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')onCloseRef.current();};
    window.addEventListener('keydown',onKey);
    return()=>{window.removeEventListener('keydown',onKey);releaseScrollLock();};
  },[inline]);
  const view=<div className={`sheet-backdrop fixed inset-0 z-[100] flex items-end justify-center ${bottomSheet?'sheet-bottom-backdrop':'sm:items-center sm:p-4'}`} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section role="dialog" aria-modal="true" aria-label={title} className={`sheet w-full border border-neutral-800 bg-neutral-950 shadow-2xl ${noScroll?'sheet-no-scroll card-form-sheet':''} ${bottomSheet?'sheet-bottom-sheet':''} ${wide?'sm:max-w-2xl':'sm:max-w-lg'}`}><div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/95 px-4 py-4 backdrop-blur"><div className="text-base font-bold text-neutral-100">{title}</div><button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-neutral-400 hover:bg-neutral-800"><X size={20}/></button></div><div className="p-4 sm:p-5">{children}</div></section></div>;
  if (inline) return <section role="region" aria-label={title} className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950"><div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3"><h2 className="text-base font-bold">{title}</h2><button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-neutral-400 hover:bg-neutral-800"><X size={19}/></button></div><div className="p-4">{children}</div></section>;
  return createPortal(view,document.body);
}
function Empty({title,detail}:{title:string;detail:string}) { return <div className="rounded-3xl border border-dashed border-neutral-800 bg-neutral-900/60 px-5 py-10 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800 text-neutral-400"><ReceiptText size={21}/></div><p className="font-semibold text-neutral-100">{title}</p><p className="mt-1 text-sm text-neutral-500">{detail}</p></div>; }

function daysInMonth(y:number,m:number) { return new Date(y,m,0).getDate(); }
function localDateString(d:Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function cycleFor(card:Card,date:string) {
  const [yy,mm]=date.slice(0,10).split('-').map(Number); let y=yy,m=mm;
  const clamp=(Y:number,M:number,D:number)=>`${Y}-${String(M).padStart(2,'0')}-${String(Math.min(D,daysInMonth(Y,M))).padStart(2,'0')}`;
  if(card.billing_rule==='end') {
    let end=clamp(y,m,card.billing_day); if(date.slice(0,10)>end){m++;if(m>12){m=1;y++;}end=clamp(y,m,card.billing_day);}
    const e=new Date(`${end}T12:00:00`); const prev=new Date(e.getFullYear(),e.getMonth()-1,1); const previousEnd=clamp(prev.getFullYear(),prev.getMonth()+1,card.billing_day); const start=new Date(`${previousEnd}T12:00:00`); start.setDate(start.getDate()+1);
    return {start:localDateString(start),end};
  }
  let start=clamp(y,m,card.billing_day);if(date.slice(0,10)<start){m--;if(m<1){m=12;y--;}start=clamp(y,m,card.billing_day);}
  const s=new Date(`${start}T12:00:00`);const next=new Date(s.getFullYear(),s.getMonth()+1,1);const nextStart=clamp(next.getFullYear(),next.getMonth()+1,card.billing_day);const end=new Date(`${nextStart}T12:00:00`);end.setDate(end.getDate()-1);return {start,end:localDateString(end)};
}



function AppShell() {
  // Measure the real responsive app header and transaction search strip so
  // sticky offsets stay aligned at every breakpoint and safe-area size.
  useEffect(() => {
    const root = document.documentElement;
    const header = document.querySelector<HTMLElement>('[data-app-header]');
    const search = document.querySelector<HTMLElement>('[data-transaction-sticky-search]');
    const update = () => {
      if (header) root.style.setProperty('--app-header-height', `${header.getBoundingClientRect().height}px`);
      if (search) root.style.setProperty('--transaction-search-height', `${search.getBoundingClientRect().height}px`);
    };
    update();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    const observed = new Set<Element>();
    const attachCurrent = () => {
      const currentHeader = document.querySelector<HTMLElement>('[data-app-header]');
      const currentSearch = document.querySelector<HTMLElement>('[data-transaction-sticky-search]');
      [currentHeader, currentSearch].forEach(element => {
        if (element && !observed.has(element)) { observed.add(element); observer?.observe(element); }
      });
      update();
    };
    const mutations = new MutationObserver(attachCurrent);
    mutations.observe(document.body, { childList: true, subtree: true });
    attachCurrent();
    window.addEventListener('resize', attachCurrent);
    return () => {
      mutations.disconnect();
      observer?.disconnect();
      window.removeEventListener('resize', attachCurrent);
      root.style.removeProperty('--app-header-height');
      root.style.removeProperty('--transaction-search-height');
    };
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const backgroundLocation = (location.state as any)?.backgroundLocation as any;
  const routeElement = useRoutes([
    { path: '/', element: <Navigate to="/dashboard" replace /> },
    { path: '/dashboard', element: <Suspense fallback={<RouteLoading variant="dashboard" />}><DashboardPage /></Suspense> },
    { path: '/cards', element: <Suspense fallback={<RouteLoading variant="cards" />}><CardsPage /></Suspense> },
    { path: '/cards/new', element: <Suspense fallback={<RouteLoading variant="form" />}><CardCreatePage /></Suspense> },
    { path: '/cards/:cardId/edit', element: <Suspense fallback={<RouteLoading variant="form" />}><CardEditPage /></Suspense> },
    { path: '/cards/:cardId', element: <Suspense fallback={<RouteLoading variant="detail" />}><CardDetailsPage /></Suspense> },
    { path: '/transactions', element: <Suspense fallback={<RouteLoading variant="transactions" />}><TransactionsPage /></Suspense> },
    { path: '/transactions/new', element: <Suspense fallback={<RouteLoading variant="form" />}><TransactionCreatePage /></Suspense> },
    { path: '/transactions/:transactionId/edit', element: <Suspense fallback={<RouteLoading variant="form" />}><TransactionEditPage /></Suspense> },
    { path: '/transactions/:transactionId', element: <Suspense fallback={<RouteLoading variant="detail" />}><TransactionDetailsPage /></Suspense> },
    { path: '/payments', element: <Suspense fallback={<RouteLoading variant="payments" />}><PaymentsPage /></Suspense> },
    { path: '/payments/new', element: <Suspense fallback={<RouteLoading variant="form" />}><PaymentCreatePage /></Suspense> },
    { path: '/payments/:paymentId/edit', element: <Suspense fallback={<RouteLoading variant="form" />}><PaymentEditPage /></Suspense> },
    { path: '/payments/:paymentId', element: <Suspense fallback={<RouteLoading variant="detail" />}><PaymentDetailsPage /></Suspense> },
    { path: '/upi-apps/new', element: <Suspense fallback={<RouteLoading variant="form" />}><UpiAppFormPage /></Suspense> },
    { path: '/upi-apps/:appId/edit', element: <Suspense fallback={<RouteLoading variant="form" />}><UpiAppFormPage /></Suspense> },
    { path: '/upi-apps/:appId', element: <Suspense fallback={<RouteLoading variant="detail" />}><UpiAppDetailsPage /></Suspense> },
    { path: '/settings', element: <Suspense fallback={<RouteLoading variant="settings" />}><SettingsPage /></Suspense> },
    { path: '*', element: <Navigate to="/dashboard" replace /> },
  ], backgroundLocation || location);
  const modalPath = location.pathname.replace(/\/$/, '') || '/';
  const isModalRoute = Boolean(backgroundLocation) && (
    modalPath === '/cards/new' ||
    /^\/cards\/\d+\/edit$/.test(modalPath) ||
    modalPath === '/transactions/new' ||
    /^\/transactions\/\d+(?:\/edit)?$/.test(modalPath) ||
    modalPath === '/payments/new' ||
    /^\/payments\/\d+(?:\/edit)?$/.test(modalPath)
  );
  const modalRouteElement = useRoutes(backgroundLocation ? [
    { path: '/cards/new', element: <Suspense fallback={<RouteLoading variant="form" />}><CardCreatePage /></Suspense> },
    { path: '/cards/:cardId/edit', element: <Suspense fallback={<RouteLoading variant="form" />}><CardEditPage /></Suspense> },
    { path: '/transactions/new', element: <Suspense fallback={<RouteLoading variant="form" />}><TransactionCreatePage /></Suspense> },
    { path: '/transactions/:transactionId/edit', element: <Suspense fallback={<RouteLoading variant="form" />}><TransactionEditPage /></Suspense> },
    { path: '/transactions/:transactionId', element: <Suspense fallback={<RouteLoading variant="detail" />}><TransactionDetailsPage /></Suspense> },
    { path: '/payments/new', element: <Suspense fallback={<RouteLoading variant="form" />}><PaymentCreatePage /></Suspense> },
    { path: '/payments/:paymentId/edit', element: <Suspense fallback={<RouteLoading variant="form" />}><PaymentEditPage /></Suspense> },
    { path: '/payments/:paymentId', element: <Suspense fallback={<RouteLoading variant="detail" />}><PaymentDetailsPage /></Suspense> },
    // Match non-modal locations without rendering anything. This prevents
    // React Router's 'No routes matched location' warning when no modal is open.
    { path: '*', element: null },
  ] : [{ path: '*', element: null }], location);
  const routeForTab = (next: Tab) => {
    if (next === 'dashboard') return '/dashboard';
    if (next === 'transactions') return '/transactions';
    if (next === 'settings') return '/settings';
    if (next === 'payments') return '/payments';
    return '/cards';
  };
  const goTab = (next: Tab) => navigate(routeForTab(next));
  const closeRouteModal = (fallback: string) => backgroundLocation ? navigate(-1) : navigate(fallback);
  const [status,setStatus]=useState<Status|null>(null); const statusRef=useRef<Status|null>(null); statusRef.current=status; const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [syncState,setSyncState]=useState<'syncing'|'synced'|'pending'|'offline'|'error'>('syncing'); const [dataReady,setDataReady]=useState(false); const lastSyncRef=useRef(0); const [toast,setToast]=useState<{message:string;kind:'success'|'error'|'info'}|null>(null);
  const tab:Tab = (()=>{const path=(backgroundLocation?.pathname || location.pathname).replace(/\/$/,'')||'/'; if(path==='/transactions'||path.startsWith('/transactions/'))return 'transactions'; if(path==='/settings')return 'settings'; if(path==='/payments'||path.startsWith('/payments/'))return 'payments'; if(path.startsWith('/cards/'))return 'card'; if(path==='/cards')return 'card'; return 'dashboard';})(); const [cards,setCards]=useState<Card[]>([]); const [txns,setTxns]=useState<Txn[]>([]); const [statements,setStatements]=useState<Statement[]>([]); const [payments,setPayments]=useState<Payment[]>([]); const [apps,setApps]=useState<AppItem[]>([]); const [dashboard,setDashboard]=useState<any>(null); const [activeCard,setActiveCard]=useState<Card|null>(null); const [cycle,setCycle]=useState('current'); const [cycleSheetOpen,setCycleSheetOpen]=useState(false);
  const [editTxn,setEditTxn]=useState<Txn|null>(null); const [editCard,setEditCard]=useState<Card|null>(null); const [editPayment,setEditPayment]=useState<Payment|null>(null);
  const [filters,setFilters]=useState<Filters>({month:'',card_id:'',method:'',upi_app_id:'',category:'',q:'',from:'',to:''}); const [filtersOpen,setFiltersOpen]=useState(false); const [cardTxnQuery,setCardTxnQuery]=useState('');
 const [summaryExpanded,setSummaryExpanded]=useState(true); const [cardsExpanded,setCardsExpanded]=useState(true); const [busy,setBusy]=useState(false); const mutationLocksRef=useRef<Set<string>>(new Set()); const [overviewIndex,setOverviewIndex]=useState(0); const overviewTrackRef=useRef<HTMLDivElement>(null);
  const [density,setDensity]=useState<'compact'|'comfortable'>(()=>{try{const saved=localStorage.getItem('ccm-density');if(saved==='compact'||saved==='comfortable')return saved;return window.matchMedia('(max-width: 640px)').matches?'compact':'comfortable'}catch{return 'compact'}});
  const [theme,setTheme]=useState<'dark'|'light'>(()=>{try{return localStorage.getItem('ccm-theme')==='light'?'light':'dark'}catch{return 'dark'}});
  const [budgetMinor,setBudgetMinor]=useState(0); const [budgetInput,setBudgetInput]=useState(''); const [budgetEditing,setBudgetEditing]=useState(false); const [categories,setCategories]=useState<string[]>(['Groceries','Fuel','Food & dining','Shopping','Bills & utilities','Travel','Education','Health','Entertainment','Other']); const [editingCategory,setEditingCategory]=useState<string|null>(null); const [editingCategoryName,setEditingCategoryName]=useState(''); const [newCategory,setNewCategory]=useState(''); const [installPrompt,setInstallPrompt]=useState<any>(null);
  const [cycleData,setCycleData]=useState<{key:string;list:Txn[]}|null>(null); const [editingAppId,setEditingAppId]=useState<number|null>(null); const [editingAppName,setEditingAppName]=useState(''); const [newAppName,setNewAppName]=useState('');
  useEffect(() => {
    const path = location.pathname.replace(/\/$/, '') || '/';
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'cards' && parts[1] && parts[1] !== 'new') {
      const id = Number(parts[1]);
      if (!Number.isInteger(id) || id <= 0) { navigate('/cards', { replace: true }); return; }
      const found = cards.find(card => card.id === id);
      if (found) { setActiveCard(found); setCycle('current'); }
      else if (dataReady) navigate('/cards', { replace: true });
    }
    if (parts[0] === 'cards' && !parts[1]) { setActiveCard(null); }
    if (parts[0] === 'cards' && parts[1] === 'new') { setActiveCard(null); setEditCard(null);  }
    else if (parts[0] === 'cards' && parts[2] === 'edit') {
      const found = cards.find(card => card.id === Number(parts[1]));
      if (found) { setEditCard(found);  }
      else if (dataReady) navigate('/cards', { replace: true });
    }
    if (parts[0] === 'transactions' && parts[1] === 'new') { setEditTxn(null);   }
    else if (parts[0] === 'transactions' && parts[2] === 'edit') {
      const found = txns.find(txn => txn.id === Number(parts[1]));
      if (found) { setEditTxn(found);  setActiveCard(cards.find(card => card.id === found.card_id) || null);   }
      else if (dataReady) navigate('/transactions', { replace: true });
    }
    if (parts[0] === 'payments' && parts[1] === 'new') { setEditPayment(null);  }
    else if (parts[0] === 'payments' && parts[2] === 'edit') { const found=payments.find(payment=>payment.id===Number(parts[1])); if(found){setEditPayment(found);} else if(dataReady) navigate('/payments',{replace:true}); }
  }, [location.pathname, cards, txns, apps, payments, dataReady, navigate]);

  // Every page route starts at the top of the page content. The sticky
  // application header remains in normal layout flow and is never covered.
  useEffect(() => {
    if (backgroundLocation) return; // Keep the underlying page's exact scroll position while a route modal is open.
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      const main = document.querySelector<HTMLElement>('main.safe-bottom');
      if (main) main.scrollTop = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, activeCard?.id, backgroundLocation]);

  useEffect(() => {
    if (!backgroundLocation) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [backgroundLocation]);
  useEffect(() => {
    if (!backgroundLocation) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') navigate(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [backgroundLocation, navigate]);

  const notify=useCallback((message:string,kind:'success'|'error'|'info'='success')=>setToast({message,kind}),[]);
  useEffect(()=>{try{localStorage.setItem('ccm-density',density)}catch{}},[density]);
  useEffect(()=>{try{localStorage.setItem('ccm-theme',theme)}catch{};document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme},[theme]);
  useEffect(()=>{if(!toast)return;const timer=window.setTimeout(()=>setToast(null),3500);return()=>window.clearTimeout(timer)},[toast]);
  useEffect(()=>{
    const installHandler=(event:any)=>{event.preventDefault();setInstallPrompt(event)};
    window.addEventListener('beforeinstallprompt',installHandler);
    if(import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{scope:import.meta.env.BASE_URL}).catch(()=>{});
    return()=>window.removeEventListener('beforeinstallprompt',installHandler);
  },[]);

  const refreshStatus=useCallback(async()=>{const s=await request<Status>('status');if(s.csrf)sessionStorage.setItem('ccm-csrf',s.csrf);setStatus(s);return s},[]);
  const syncTransactionOutbox=useCallback(async(ownerId:string)=>{
    if(!navigator.onLine)return;
    const operations=await listOutboxOperations(ownerId);
    for(const operation of operations){
      if(operation.entity!=='transaction'||operation.status==='failed')continue;
      if(operation.nextAttemptAt>Date.now())continue;
      await updateOutboxOperation(ownerId,operation.opId,{status:'syncing',attempts:operation.attempts+1});
      try{
        if(operation.action==='create'){
          const result=await request<{id:number}>('transactions','POST',{...(operation.payload as any),client_mutation_id:operation.opId});
          const record=await getLocalRecord<Txn>(ownerId,'transaction',operation.entityId);
          if(record){const serverTxn={...record.data,id:Number(result.id)};await putLocalRecord({...record,id:String(result.id),data:serverTxn,syncState:'synced',updatedAt:Date.now()});await deleteLocalRecord(ownerId,'transaction',operation.entityId);setTxns((previous: Txn[])=>previous.map((txn: Txn)=>txn.id===Number(operation.entityId)?serverTxn:txn));setDashboard((previous: any)=>previous?{...previous,latest:(previous.latest||[]).map((txn:Txn)=>txn.id===Number(operation.entityId)?serverTxn:txn)}:previous);}
        }else if(operation.action==='update'){
          await request('transactions','PUT',operation.payload);
          const record=await getLocalRecord<Txn>(ownerId,'transaction',operation.entityId);
          if(record)await putLocalRecord({...record,syncState:'synced',updatedAt:Date.now()});
        }else{
          await request('transactions','DELETE',undefined,{id:operation.entityId});
          await deleteLocalRecord(ownerId,'transaction',operation.entityId);
          setTxns(previous=>previous.filter(txn=>String(txn.id)!==operation.entityId));
        }
        await removeOutboxOperation(ownerId,operation.opId);
      }catch(error){
        const attempts=operation.attempts+1;
        await updateOutboxOperation(ownerId,operation.opId,{status:'pending',attempts,nextAttemptAt:Date.now()+Math.min(60*60*1000,1000*2**Math.min(attempts,10)),lastError:(error as Error).message});
        notify(`A queued transaction could not sync yet: ${(error as Error).message}`,'error');
        break;
      }
    }
  },[notify]);
  const applyBootstrap=useCallback((b:BootstrapData)=>{
    const enriched=(b.cards||[]).map(card=>({...card,...((b.dashboard?.cards||[]).find((x:Card)=>x.id===card.id)||{})}));
    setCards(enriched);setTxns(b.transactions||[]);setApps(b.apps||[]);setDashboard(b.dashboard||null);setPayments(b.payments||[]);setStatements(b.statements||[]);
    const bm=Number(b.settings?.monthly_budget_minor||0);setBudgetMinor(bm);setBudgetInput(bm?minorToRupees(bm):'');if(Array.isArray(b.settings?.categories)&&b.settings.categories.length)setCategories(b.settings.categories);
    setActiveCard(prev=>prev?enriched.find(card=>card.id===prev.id)||prev:null);setDataReady(true);
  },[]);
  const applyPendingTransactionOverlay=useCallback(async(ownerId:string,serverTransactions:Txn[],serverCards:Card[])=>{
    const [records,operations]=await Promise.all([
      listLocalRecords<Txn>(ownerId,'transaction'),
      listOutboxOperations(ownerId),
    ]);
    const transactionOps=operations.filter(op=>op.entity==='transaction');
    const deletedIds=new Set(transactionOps.filter(op=>op.action==='delete').map(op=>op.entityId));
    const byId=new Map<number,Txn>(serverTransactions.map(txn=>[Number(txn.id),txn]));
    for(const record of records){
      const id=Number(record.id);
      if(!Number.isFinite(id))continue;
      if(deletedIds.has(record.id)){byId.delete(id);continue;}
      if(record.syncState!=='synced' || transactionOps.some(op=>op.entityId===record.id)) byId.set(id,record.data as Txn);
    }
    const merged=[...byId.values()].sort((a,b)=>b.txn_at.localeCompare(a.txn_at)||b.id-a.id);
    setTxns(merged);
    // Keep the API's full-cycle aggregate as the baseline. Bootstrap returns a
    // bounded transaction list, so summing that list replaces a complete cycle
    // total with a partial total and makes the displayed value jump on refresh.
    const sumCycle=(list:Txn[],card:Card)=>list
      .filter(txn=>txn.card_id===card.id&&!!card.cycle_start&&!!card.cycle_end&&txn.settlement_date>=card.cycle_start&&txn.settlement_date<=card.cycle_end)
      .reduce((sum,txn)=>sum+Number(txn.amount_minor||0),0);
    const mergedCards=serverCards.map(card=>{
      const serverTotal=sumCycle(serverTransactions,card);
      const mergedTotal=sumCycle(merged,card);
      const serverAggregate=Number(card.current_minor||0);
      return {...card,current_minor:serverAggregate+(mergedTotal-serverTotal)};
    });
    setCards(mergedCards);
    setDashboard((previous:any)=>previous?{...previous,latest:merged.slice(0,5),cards:previous.cards?.map((item:Card)=>mergedCards.find(card=>card.id===item.id)||item)}:previous);
    return merged;
  },[]);
  const loadData=useCallback(async(ownerId?:string,silent=false)=>{
    if(!silent)setSyncState('syncing');
    try{
      const b=await request<BootstrapData>('bootstrap');
      applyBootstrap(b);
      const currentStatus=statusRef.current;
      const effectiveOwnerId=ownerId??(currentStatus?.user_id?String(currentStatus.user_id):'');
      if(effectiveOwnerId){const serverCards=(b.cards||[]).map(card=>({...card,...((b.dashboard?.cards||[]).find((x:Card)=>x.id===card.id)||{})}));await applyPendingTransactionOverlay(effectiveOwnerId,b.transactions||[],serverCards);}
      lastSyncRef.current=Date.now();if(!silent)setSyncState('synced');
      return b;
    }catch(e){if(!silent)setSyncState(navigator.onLine?'error':'offline');throw e;}
  },[applyBootstrap,applyPendingTransactionOverlay]);
  const boot=useCallback(async()=>{
    setError('');
    let cached:BootstrapSnapshot|null=null;
    try{
      cached=await readBootstrapCache();
      if(cached?.data){
        applyBootstrap(cached.data as BootstrapData);
        // Show the last known data immediately while the server validates the session.
        setStatus({setup_required:false,authenticated:true,username:null,csrf:sessionStorage.getItem('ccm-csrf')||''});
        setSyncState('syncing');setLoading(false);
      }
    }catch{/* A cache failure must never prevent normal server startup. */}
    try{
      const s=await refreshStatus();
      if(s.authenticated){
        // Deliver queued mutations first, then request one authoritative bootstrap.
        // The previous load -> sync -> load sequence caused visible dashboard
        // replacement twice on every startup.
        if(s.user_id) await syncTransactionOutbox(String(s.user_id));
        await loadData(s.user_id?String(s.user_id):undefined);
      }else{
        await clearBootstrapCache().catch(()=>{});
        setDataReady(false);setCards([]);setTxns([]);setApps([]);setDashboard(null);setPayments([]);setStatements([]);setActiveCard(null);
      }
    }catch(e){
      const message=(e as Error).message;
      if(cached?.data){setSyncState(navigator.onLine?'error':'offline');setError(navigator.onLine?`Showing saved data. Background sync failed: ${message}`:'Offline — showing the last saved data.');}
      else {setError(message);setSyncState(navigator.onLine?'error':'offline');}
    }finally{setLoading(false)}
  },[applyBootstrap,refreshStatus,loadData,syncTransactionOutbox]);
  useEffect(()=>{void boot()},[boot]);
  useEffect(()=>{
    if(!dataReady||!status?.authenticated)return;
    const snapshot:BootstrapSnapshot={version:1,savedAt:Date.now(),data:{cards,transactions:txns,apps,dashboard,payments,statements,settings:{monthly_budget_minor:budgetMinor,categories}}};
    void writeBootstrapCache(snapshot).catch(()=>{});
  },[dataReady,status?.authenticated,cards,txns,apps,dashboard,payments,statements,budgetMinor,categories]);
  useEffect(()=>{
    // Background outbox delivery must never trigger a full bootstrap refresh.
    // Re-fetching bootstrap on a short timer made the whole app appear to
    // continuously refresh even when there were no pending mutations.
    let syncInFlight=false;
    const syncPendingOnly=()=>{
      if(syncInFlight||document.visibilityState!=='visible'||!navigator.onLine||!status?.authenticated||!status.user_id)return;
      syncInFlight=true;
      void syncTransactionOutbox(String(status.user_id)).finally(()=>{syncInFlight=false;});
    };
    const onOnline=()=>syncPendingOnly();
    window.addEventListener('online',onOnline);
    document.addEventListener('visibilitychange',syncPendingOnly);
    return()=>{window.removeEventListener('online',onOnline);document.removeEventListener('visibilitychange',syncPendingOnly)};
  },[status?.authenticated,status?.user_id,syncTransactionOutbox]);
  const perform=async(fn:()=>Promise<any>,success?:string)=>{
    setBusy(true);setError('');setSyncState('syncing');let committed=false;
    try{
      await fn();committed=true;
      try{await loadData()}catch(e){const message=(e as Error).message;setSyncState(navigator.onLine?'error':'offline');setError(`Change saved, but refresh failed: ${message}`);notify('Change saved; refresh will retry.','info');return true;}
      if(success)notify(success);return true;
    }catch(e){
      const message=(e as Error).message;setSyncState(navigator.onLine?'error':'offline');
      if(committed){setError(`Change saved, but refresh failed: ${message}`);notify('Change saved; refresh will retry.','info');return true;}
      setError(message);notify(message,'error');return false;
    }finally{setBusy(false)}
  };
  const recalcTransactionSummaries=(list:Txn[])=>{
    const sorted=[...list].sort((a,b)=>b.txn_at.localeCompare(a.txn_at)||b.id-a.id);
    // Apply only the local list delta to the server-provided cycle aggregate.
    // Never rebuild a full cycle amount from the bootstrap's limited txn list.
    const refreshedCards=cards.map(card=>{
      const inCycle=(t:Txn)=>t.card_id===card.id&&!!card.cycle_start&&!!card.cycle_end&&t.settlement_date>=card.cycle_start&&t.settlement_date<=card.cycle_end;
      const before=txns.filter(inCycle).reduce((sum,t)=>sum+Number(t.amount_minor||0),0);
      const after=list.filter(inCycle).reduce((sum,t)=>sum+Number(t.amount_minor||0),0);
      return {...card,current_minor:Number(card.current_minor||0)+(after-before)};
    });
    setCards(refreshedCards);
    setDashboard((prev:any)=>prev?{...prev,cards:prev.cards?.map((item:Card)=>refreshedCards.find(c=>c.id===item.id)||item),latest:sorted.slice(0,5)}:prev);
    setTxns(list);
  };
  const logOut=async()=>{setBusy(true);setError('');try{await request('logout','POST');sessionStorage.removeItem('ccm-csrf');await clearBootstrapCache().catch(()=>{});setDataReady(false);const s=await request<Status>('status');setStatus(s);setCards([]);setTxns([]);setDashboard(null);setStatements([]);setPayments([]);setApps([]);setActiveCard(null);setToast({message:'You have been logged out.',kind:'info'});}catch(e){const m=(e as Error).message;setError(m);notify(m,'error')}finally{setBusy(false)}};

  const shownTxns=useMemo(()=>{
    let list=[...txns];if(filters.month)list=list.filter(t=>t.txn_at.slice(0,7)===filters.month);if(filters.card_id)list=list.filter(t=>String(t.card_id)===filters.card_id);if(filters.method)list=list.filter(t=>t.payment_method===filters.method);if(filters.upi_app_id)list=list.filter(t=>String(t.upi_app_id||'')===filters.upi_app_id);if(filters.category)list=list.filter(t=>(t.category||'')===filters.category);if(filters.q)list=list.filter(t=>(`${t.particular} ${t.card_name} ${t.notes} ${t.upi_app_name}`).toLowerCase().includes(filters.q.toLowerCase()));if(filters.from)list=list.filter(t=>t.txn_at.slice(0,10)>=filters.from);if(filters.to)list=list.filter(t=>t.txn_at.slice(0,10)<=filters.to);
    return list.sort((a,b)=>b.txn_at.localeCompare(a.txn_at)||b.id-a.id);
  },[txns,filters]);
  const grouped=useMemo(()=>{const months=new Map<string,Map<string,Txn[]>>();shownTxns.forEach(t=>{const m=t.txn_at.slice(0,7),d=t.txn_at.slice(0,10);if(!months.has(m))months.set(m,new Map());const dates=months.get(m)!;if(!dates.has(d))dates.set(d,[]);dates.get(d)!.push(t)});return [...months.entries()].sort((a,b)=>b[0].localeCompare(a[0])).map(([month,dates])=>[month,[...dates.entries()].sort((a,b)=>b[0].localeCompare(a[0]))] as [string,[string,Txn[]][]])},[shownTxns]);
  const cardStatements=statements.filter(s=>s.card_id===activeCard?.id).sort((a,b)=>b.cycle_end.localeCompare(a.cycle_end));
  const selectedStatement=cycle==='current'?undefined:cardStatements.find(s=>String(s.id)===cycle);
  const currentStart=activeCard?.cycle_start||''; const currentEnd=activeCard?.cycle_end||'';
  const localCycleTxns=txns.filter(t=>t.card_id===activeCard?.id&&(selectedStatement?(t.settlement_date>=selectedStatement.cycle_start&&t.settlement_date<=selectedStatement.cycle_end):(currentStart&&currentEnd&&t.settlement_date>=currentStart&&t.settlement_date<=currentEnd))).sort((a,b)=>b.txn_at.localeCompare(a.txn_at)||b.id-a.id);
  const rangeStart=selectedStatement?.cycle_start||currentStart; const rangeEnd=selectedStatement?.cycle_end||currentEnd; const cycleKey=activeCard?`${activeCard.id}|${rangeStart}|${rangeEnd}`:'';
  const cycleTxns=cycleData&&cycleData.key===cycleKey?cycleData.list:localCycleTxns;
  const shownCycleTxns=useMemo(()=>cycleTxns.filter(t=>!cardTxnQuery.trim()||`${t.particular} ${t.card_name} ${t.notes} ${t.upi_app_name} ${t.category||''}`.toLowerCase().includes(cardTxnQuery.trim().toLowerCase())).sort((a,b)=>b.txn_at.localeCompare(a.txn_at)||b.id-a.id),[cycleTxns,cardTxnQuery]);
  const groupedCycleTxns=useMemo(()=>{const months=new Map<string,Map<string,Txn[]>>();shownCycleTxns.forEach(t=>{const m=t.txn_at.slice(0,7),d=t.txn_at.slice(0,10);if(!months.has(m))months.set(m,new Map());const dates=months.get(m)!;if(!dates.has(d))dates.set(d,[]);dates.get(d)!.push(t)});return [...months.entries()].sort((a,b)=>b[0].localeCompare(a[0])).map(([month,dates])=>[month,[...dates.entries()].sort((a,b)=>b[0].localeCompare(a[0]))] as [string,[string,Txn[]][]])},[shownCycleTxns]);
  const activeCards=cards.filter(c=>c.active); const currentSpend=Number(dashboard?.current_expenses_minor||0); const nextBudgetSpend=Number(dashboard?.next_budget_expenses_minor||0); const previousDues=Number(dashboard?.previous_dues_minor||0); const thisMonth=nowMonth(); const budgetMonth=String(dashboard?.budget_month||thisMonth); const nextBudgetMonth=String(dashboard?.next_budget_month||(()=>{const d=new Date(`${budgetMonth}-02T12:00:00`);d.setMonth(d.getMonth()+1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`})()); const followingBudgetMonth=(()=>{const d=new Date(`${nextBudgetMonth}-02T12:00:00`);d.setMonth(d.getMonth()+1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`})(); const calendarMonthSpend=txns.filter(t=>t.txn_at.slice(0,7)===thisMonth).reduce((sum,t)=>sum+t.amount_minor,0);
  const shiftIsoDate=(value:string,days:number)=>{const d=new Date(`${value.slice(0,10)}T12:00:00`);d.setDate(d.getDate()+days);return localDateString(d)};
  // Select the second monthly overview once every active card's bill is
  // scheduled to be available for the current calendar month. The configured
  // billing_rule is authoritative: "start" means available on billing day;
  // "end" means available on the following day. This intentionally does not
  // depend on whether a statement record has already been generated.
  const todayForOverview=localDateString(new Date());
  const [overviewYear,overviewMonth]=todayForOverview.split('-').map(Number);
  const overviewBillingAvailabilityDates=activeCards.map(card=>{
    const billingDate=`${overviewYear}-${String(overviewMonth).padStart(2,'0')}-${String(Math.min(Math.max(1,Number(card.billing_day)||1),daysInMonth(overviewYear,overviewMonth))).padStart(2,'0')}`;
    return card.billing_rule==='end'?shiftIsoDate(billingDate,1):billingDate;
  });
  const lastBillingAvailabilityDate=overviewBillingAvailabilityDates.length
    ?overviewBillingAvailabilityDates.reduce((latest,date)=>date>latest?date:latest)
    :'';
  const overviewDefaultIndex=lastBillingAvailabilityDate&&todayForOverview>=lastBillingAvailabilityDate?1:0;
  const overviewCardScheduleKey=activeCards.map(card=>`${card.id}:${card.billing_day}:${card.billing_rule}`).sort().join('|');
  const followingBudgetSpend=txns.reduce((sum,t)=>{const card=activeCards.find(c=>c.id===t.card_id);if(!card||!t.settlement_date)return sum;const cycle=cycleFor(card,t.settlement_date);return shiftIsoDate(cycle.end,1).slice(0,7)===followingBudgetMonth?sum+t.amount_minor:sum},0);
  const nextMonthUnpaid=statements.filter(s=>String(s.statement_date).slice(0,7)===nextBudgetMonth).reduce((sum,s)=>sum+Number(s.outstanding_minor||0),0);
  const previousBudgetMonth=(()=>{const d=new Date(`${budgetMonth}-02T12:00:00`);d.setMonth(d.getMonth()-1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`})(); const nextBudgetPct=budgetMinor>0?nextBudgetSpend/budgetMinor*100:(nextBudgetSpend>0?Infinity:0); const nextFillBudgetPct=budgetMinor>0?(nextBudgetSpend>budgetMinor?budgetMinor/nextBudgetSpend*100:Math.min(100,nextBudgetPct)):(nextBudgetSpend>0?0:0); const nextExcessPct=nextBudgetSpend>budgetMinor&&nextBudgetSpend>0?(nextBudgetSpend-budgetMinor)/nextBudgetSpend*100:(budgetMinor===0&&nextBudgetSpend>0?100:0); 
  // Option A: automatic selection is applied when entering/reloading the
  // dashboard or when the active-card billing schedule changes. A manual swipe
  // is left alone for the rest of that dashboard visit.
  useEffect(()=>{
    if(tab!=='dashboard'||!dataReady)return;
    let frame=0;
    // Wait until the dashboard carousel has been laid out before calculating
    // the target offset. The calculated index is an explicit dependency so
    // crossing the latest billing-availability date also re-runs this effect.
    frame=window.requestAnimationFrame(()=>{
      const track=overviewTrackRef.current;
      if(!track)return;
      track.scrollTo({left:track.clientWidth*overviewDefaultIndex,behavior:'auto'});
      setOverviewIndex(overviewDefaultIndex);
    });
    return()=>window.cancelAnimationFrame(frame);
  },[tab,dataReady,overviewDefaultIndex,overviewCardScheduleKey,budgetMonth]);

  const budgetPct=budgetMinor>0?currentSpend/budgetMinor*100:(currentSpend>0?Infinity:0); const fillBudgetPct=budgetMinor>0?(currentSpend>budgetMinor?budgetMinor/currentSpend*100:Math.min(100,budgetPct)):(currentSpend>0?0:0); const excessPct=currentSpend>budgetMinor&&currentSpend>0?(currentSpend-budgetMinor)/currentSpend*100:(budgetMinor===0&&currentSpend>0?100:0);
  const activeTitle=tab==='dashboard'?'Dashboard':tab==='transactions'?'Transactions':tab==='settings'?'Settings':tab==='card'?(activeCard?.name||'Card details'):'Bill payments';
  const filterCount=[filters.month,filters.card_id,filters.method,filters.upi_app_id,filters.category,filters.from,filters.to].filter(Boolean).length;

  useEffect(()=>{
    // Bootstrap returns only the newest 2000 transactions, so older cycles must be loaded per card/cycle from the API.
    if(tab!=='card'||!activeCard||!rangeStart||!rangeEnd)return;
    let cancelled=false;
    request<{transactions:Txn[]}>('transactions','GET',undefined,{card_id:String(activeCard.id),settle_from:rangeStart,settle_to:rangeEnd})
      .then(r=>{if(!cancelled)setCycleData({key:cycleKey,list:r.transactions||[]})})
      .catch(()=>{if(!cancelled)setCycleData(null)});
    return()=>{cancelled=true};
  },[tab,activeCard?.id,rangeStart,rangeEnd,cycleKey,txns]);

  const uploadAttachment=async(id:number,file:File)=>{
    const form=new FormData();form.append('transaction_id',String(id));form.append('attachment',file);
    await request('transaction-attachment','POST',form);
  };
  const saveTransaction=async(data:any,file:File|null)=>{
    const isEdit=!!editTxn; const original=editTxn; const lockKey=`transaction:${original?.id??'new'}`;
    if(mutationLocksRef.current.has(lockKey)) return;
    mutationLocksRef.current.add(lockKey);
    setError(''); setSyncState('syncing');
    const ownerId=status?.user_id?String(status.user_id):'';
    const optimisticId=isEdit?original!.id:-Date.now();
    const selectedCard=cards.find(c=>c.id===Number(data.card_id));
    const selectedApp=apps.find(a=>a.id===Number(data.upi_app_id));
    const optimistic:Txn={id:optimisticId,card_id:Number(data.card_id),card_name:selectedCard?.name||'Card',particular:String(data.particular||''),amount_minor:Number(data.amount_minor||0),txn_at:String(data.txn_at||'').replace('T',' '),settlement_date:String(data.settlement_date||''),payment_method:data.payment_method||'swipe',upi_app_id:data.upi_app_id==null?null:Number(data.upi_app_id),upi_app_name:data.payment_method==='upi'?(selectedApp?.name||''):'',notes:String(data.notes||''),category:String(data.category||''),tags:String(data.tags||''),has_attachment:original?.has_attachment||0};
    const previousList=txns;
    const optimisticList=isEdit?txns.map(t=>t.id===original!.id?optimistic:t):[optimistic,...txns];
    try{
      if(!ownerId)throw new Error('Account identity is unavailable. Reconnect and sign in before saving.');
      if(isEdit&&original!.id<0)throw new Error('This transaction is still waiting to synchronize. Edit it after synchronization completes.');
      const record:LocalRecord<Txn>={ownerId,entity:'transaction',id:String(optimisticId),data:optimistic,updatedAt:Date.now(),syncState:'pending'};
      // Persist locally first for both online and offline saves. The record and
      // outbox operation commit atomically before the UI treats the save as complete.
      await enqueueLocalMutation({ownerId,entity:'transaction',entityId:String(optimisticId),action:isEdit?'update':'create',payload:isEdit?{...data,id:original!.id}:{...data},record});
      recalcTransactionSummaries(optimisticList);
      void writeBootstrapCache({version:1,savedAt:Date.now(),data:{cards,transactions:optimisticList,apps,dashboard,payments,statements,settings:{monthly_budget_minor:budgetMinor,categories}}}).catch(()=>{});
      setEditTxn(null); navigate('/transactions');
      setTxns(optimisticList);
      setSyncState(navigator.onLine?'pending':'offline');
      if(file)notify('Transaction saved locally. Add the receipt after the transaction synchronizes.','info');
      else notify(navigator.onLine?'Transaction saved locally. Sync will continue in the background.':'Transaction saved on this device. It will sync when internet returns.','info');
      if(navigator.onLine){
        // Do not keep the form/save flow open while the network is slow.
        void (async()=>{
          try{
            await syncTransactionOutbox(ownerId);
            if(file){const synced=(await request<{transactions:Txn[]}>('transactions','GET',undefined,{card_id:String(optimistic.card_id),from:optimistic.txn_at.slice(0,10),to:optimistic.txn_at.slice(0,10)})).transactions;const match=synced.find(t=>t.particular===optimistic.particular&&t.amount_minor===optimistic.amount_minor&&t.txn_at===optimistic.txn_at);if(match)await uploadAttachment(match.id,file);}
            const remaining=await listOutboxOperations(ownerId);setSyncState(remaining.some(op=>op.entity==='transaction')?'pending':'synced');
          }catch(syncError){setSyncState('error');notify(`Transaction is saved locally; background synchronization will retry. ${(syncError as Error).message}`,'info');}
        })();
      }
    }catch(e){
      const message=(e as Error).message;
      recalcTransactionSummaries(previousList);
      setTxns(previousList);
      setSyncState(navigator.onLine?'error':'offline');setError(message);notify(`Could not save transaction locally. ${message}`,'error');
    }finally{mutationLocksRef.current.delete(lockKey);}
  };
  const deleteTransactionOptimistic=async(txn:Txn)=>{
    const ownerId=status?.user_id?String(status.user_id):'';
    const next=txns.filter(t=>t.id!==txn.id);setBusy(true);setError('');setSyncState('syncing');
    try{
      if(!ownerId)throw new Error('Account identity is unavailable. Reconnect and sign in before deleting.');
      if(txn.id<0)throw new Error('This transaction is still waiting to synchronize. Wait until synchronization completes before deleting it.');
      const record:LocalRecord<Txn>={ownerId,entity:'transaction',id:String(txn.id),data:txn,updatedAt:Date.now(),syncState:'pending'};
      await enqueueLocalMutation({ownerId,entity:'transaction',entityId:String(txn.id),action:'delete',payload:txn,record});
      recalcTransactionSummaries(next);setTxns(next);
      void writeBootstrapCache({version:1,savedAt:Date.now(),data:{cards,transactions:next,apps,dashboard,payments,statements,settings:{monthly_budget_minor:budgetMinor,categories}}}).catch(()=>{});
      setSyncState(navigator.onLine?'pending':'offline');
      notify(navigator.onLine?'Transaction deletion saved locally. Sync will continue in the background.':'Transaction deletion saved locally. It will sync when internet returns.','info');
      if(navigator.onLine){void (async()=>{try{await syncTransactionOutbox(ownerId);const remaining=await listOutboxOperations(ownerId);setSyncState(remaining.some(op=>op.entity==='transaction')?'pending':'synced');}catch(syncError){setSyncState('error');notify(`Deletion is saved locally; background synchronization will retry. ${(syncError as Error).message}`,'info');}})();}
    }catch(e){const message=(e as Error).message;recalcTransactionSummaries(txns);setTxns(txns);setSyncState(navigator.onLine?'error':'offline');setError(message);notify(`Could not save deletion locally. ${message}`,'error');}
    finally{setBusy(false)}
  };
  const saveCardOptimistic=async(data:any)=>{
    const original=editCard; const lockKey=`card:${original?.id??'new'}`;
    if(mutationLocksRef.current.has(lockKey)) return;
    mutationLocksRef.current.add(lockKey); setError(''); setSyncState('syncing');
    const tempId=original?.id??-Date.now(); const prior=original||null; const current=cards.find(c=>c.id===tempId);
    const optimistic:Card={...(current||{} as Card),...(data as Partial<Card>),id:tempId,name:data.name,bank_name:data.bank_name,last4:data.last4,credit_limit_minor:data.credit_limit_minor,billing_day:data.billing_day,billing_rule:data.billing_rule,due_days:data.due_days,active:Number(data.active??1),current_minor:current?.current_minor||0,dues_minor:current?.dues_minor||0,cycle_start:current?.cycle_start,cycle_end:current?.cycle_end};
    setCards(prev=>original?prev.map(c=>c.id===original.id?optimistic:c):[optimistic,...prev]);
    if(original&&activeCard?.id===original.id)setActiveCard(optimistic);
    setDashboard((prev:any)=>prev?{...prev,cards:original?(prev.cards||[]).map((c:Card)=>c.id===original.id?optimistic:c).filter((c:Card)=>c.active):[optimistic,...(prev.cards||[])].filter((c:Card)=>c.active)}:prev);
    setEditCard(null); navigate('/cards');
    try {
      await request('cards',original?'PUT':'POST',original?{...data,id:original.id}:data);
      try { await loadData(); } catch { setSyncState(navigator.onLine?'error':'offline'); notify('Card saved. Refresh will retry in the background.','info'); }
      notify(original?'Card updated':'Card added');
    } catch(e) {
      const message=(e as Error).message;
      setCards(prev=>original?prev.map(c=>c.id===original.id?prior!:c):prev.filter(c=>c.id!==tempId));
      if(original&&activeCard?.id===original.id)setActiveCard(prior);
      setDashboard((prev:any)=>prev?{...prev,cards:original?(prev.cards||[]).map((c:Card)=>c.id===original.id?prior!:c):(prev.cards||[]).filter((c:Card)=>c.id!==tempId)}:prev);
      setSyncState(navigator.onLine?'error':'offline'); setError(message); notify(`Could not save card. The optimistic change was reverted. ${message}`,'error');
    } finally { mutationLocksRef.current.delete(lockKey); }
  };
  const savePaymentOptimistic=async(data:any)=>{
    const original=editPayment; const lockKey=`payment:${original?.id??'new'}`;
    if(mutationLocksRef.current.has(lockKey)) return;
    mutationLocksRef.current.add(lockKey);
    const tempId=original?.id??-Date.now(); const card=cards.find(c=>c.id===Number(data.card_id));
    const optimistic:Payment={id:tempId,card_id:Number(data.card_id),card_name:card?.name||'Card',amount_minor:Number(data.amount_minor||0),paid_at:String(data.paid_at||'').replace('T',' '),reference:String(data.reference||''),notes:String(data.notes||''),allocated_minor:original?.allocated_minor||0,unallocated_minor:original?.unallocated_minor||0,pending:true};
    setPayments(prev=>original?prev.map(payment=>payment.id===original.id?optimistic:payment):[optimistic,...prev]);
    setSyncState('syncing'); setError(''); setEditPayment(null); navigate('/payments');
    try {
      await request('payments',original?'PUT':'POST',original?{...data,id:original.id}:data);
      try { await loadData(); } catch { setSyncState(navigator.onLine?'error':'offline'); notify('Payment saved. Refresh will retry in the background.','info'); }
      notify(original?'Payment updated':'Payment recorded; allocations are synchronized');
    } catch(e) {
      const message=(e as Error).message;
      setPayments(prev=>original?prev.map(payment=>payment.id===original.id?original:payment):prev.filter(payment=>payment.id!==tempId));
      setSyncState(navigator.onLine?'error':'offline'); setError(message);
      notify(`Payment could not be saved. The optimistic change was reverted. ${message}`,'error');
    } finally { mutationLocksRef.current.delete(lockKey); }
  };
  const deletePaymentOptimistic=async(payment:Payment)=>{
    const previous=payment;setPayments(prev=>prev.filter(p=>p.id!==payment.id));setSyncState('syncing');setBusy(true);setError('');let committed=false;
    try{await request('payments','DELETE',undefined,{id:String(payment.id)});committed=true;try{await loadData()}catch{setSyncState(navigator.onLine?'error':'offline')}notify('Payment deleted and allocations recalculated');}
    catch(e){const message=(e as Error).message;if(!committed){setPayments(prev=>[...prev,previous].sort((a,b)=>b.paid_at.localeCompare(a.paid_at)||b.id-a.id));setSyncState(navigator.onLine?'error':'offline');setError(message);notify(`Could not delete payment. It was restored. ${message}`,'error')}else{setSyncState(navigator.onLine?'error':'offline');setError(`Payment was deleted, but refresh failed: ${message}`);notify('Payment deleted; refresh will retry.','info')}}
    finally{setBusy(false)}
  };
  const doInstall=async()=>{if(!installPrompt){notify('Open your browser menu and choose Install app or Add to Home screen.','info');return;}await installPrompt.prompt();await installPrompt.userChoice;setInstallPrompt(null)};

  const deleteCardFromRoute = (card:Card) => {
    if (confirm(`Remove ${card.name}? Cards with transaction, statement or payment history will be archived instead of permanently deleted.`)) {
      void perform(() => request('cards','DELETE',undefined,{id:String(card.id)}), 'Card removed or archived');
    }
  };

  const saveUpiApp = async (name:string, id?:number) => {
    return perform(async () => {
      if (id) await request('upi-apps','PUT',{id,name,active:apps.find(item=>item.id===id)?.active ?? 1});
      else await request('upi-apps','POST',{name});
    }, id ? 'UPI application updated' : 'UPI application added');
  };
  const deactivateUpiApp = (id:number) => {
    void perform(() => request('upi-apps','DELETE',undefined,{id:String(id)}), 'UPI application deactivated');
  };

  const dashboardViewProps = { Activity, CalendarDays, ChevronDown, ChevronRight, CreditCard, Empty, Link, ModalLink, Plus, TxnRow, activeCards, budgetMinor, budgetMonth, budgetPct, calendarMonthSpend, cards, cardsExpanded, currentSpend, dashboard, dashboardMoney, day, excessPct, fillBudgetPct, followingBudgetSpend, goTab, money, monthLabel, nextBudgetMonth, nextBudgetPct, nextBudgetSpend, nextExcessPct, nextFillBudgetPct, nextMonthUnpaid, overviewIndex, overviewTrackRef, previousBudgetMonth, previousDues, setActiveCard, setCardsExpanded, setCycle, setEditTxn, setOverviewIndex, setSummaryExpanded, summaryExpanded };
  const transactionsViewProps = { Empty, ModalLink, Plus, Search, SlidersHorizontal, TxnRow, X, cards, day, filterCount, filters, grouped, money, monthLabel, setActiveCard, setEditTxn, setFilters, setFiltersOpen, shownTxns, txns };
  const cardViewProps = { Button, Check, ChevronDown, CreditCard, Empty, ModalLink, Pencil, Plus, Search, ShieldCheck, TxnRow, Wallet, X, activeCard, cardTxnQuery, currentEnd, currentStart, cycle, cycleSheetOpen, cycleTxns, day, groupedCycleTxns, minorToRupees, money, monthLabel, notify, perform, request, rupeesToMinor, selectedStatement, setActiveCard, setCardTxnQuery, setCycleSheetOpen, setEditTxn, shownCycleTxns };
  const paymentsViewProps = { Empty, Metric, ModalLink, Plus, RefreshCw, Trash2, day, deletePaymentOptimistic, money, payments, statements };
  const settingsViewProps = { Activity, Button, Check, Download, Field, ModalLink, Pencil, Plus, Trash2, Wallet, X, activeCards, apps, budgetEditing, budgetInput, budgetMinor, budgetPct, busy, categories, currentSpend, dashboardMoney, density, doInstall, editingAppId, editingAppName, editingCategory, editingCategoryName, goTab, inputClass, minorToRupees, navigate, newCategory, notify, perform, request, rupeesToMinor, setBudgetEditing, setBudgetInput, setCategories, setDensity, setEditingAppId, setEditingAppName, setEditingCategory, setEditingCategoryName, setNewCategory };

  const routePages: AppRouteContext['pages'] = {
    dashboard: <DashboardView {...dashboardViewProps} />,
    transactions: <TransactionsView {...transactionsViewProps} />,
    card: <CardView {...cardViewProps} />,
    payments: <PaymentsView {...paymentsViewProps} />,
    settings: <SettingsView {...settingsViewProps} />,
    cardCreate: <CardForm key="new-card" page initial={null} busy={busy} onClose={()=>closeRouteModal('/settings')} onSave={data=>void saveCardOptimistic(data)}/>,
    cardEdit: <CardForm key={editCard?.id ?? 'edit-card-loading'} page initial={editCard} busy={busy} onClose={()=>closeRouteModal(editCard?`/cards/${editCard.id}`:'/settings')} onSave={data=>void saveCardOptimistic(data)}/>,
    transactionCreate: <TxnForm key="new-transaction" page initial={null} cards={activeCards.filter(c=>c.id>0)} apps={apps} categories={categories} defaultCard={activeCard} busy={busy} onClose={()=>closeRouteModal(activeCard?`/cards/${activeCard.id}`:'/transactions')} onSave={saveTransaction}/>,
    transactionEdit: <TxnForm key={editTxn?.id ?? 'edit-transaction-loading'} page initial={editTxn} cards={activeCards.filter(c=>c.id>0)} apps={apps} categories={categories} defaultCard={activeCard} busy={busy} onClose={()=>closeRouteModal(editTxn?`/transactions/${editTxn.id}`:'/transactions')} onSave={saveTransaction}/>,
    paymentCreate: <PaymentForm key="new-payment" page initial={null} cards={activeCards.filter(c=>c.id>0)} defaultCard={activeCard} busy={busy} onClose={()=>closeRouteModal('/payments')} onSave={data=>void savePaymentOptimistic(data)}/>,
    paymentEdit: <PaymentForm key={editPayment?.id ?? 'edit-payment-loading'} page initial={editPayment} cards={activeCards.filter(c=>c.id>0)} defaultCard={activeCard} busy={busy} onClose={()=>closeRouteModal(editPayment?`/payments/${editPayment.id}`:'/payments')} onSave={data=>void savePaymentOptimistic(data)}/>,
  };

  if(loading) return <div className="min-h-dvh bg-neutral-950 p-5 text-neutral-100"><div className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-center gap-4"><div className="h-12 w-12 animate-pulse rounded-2xl bg-violet-600/70"/><div className="h-5 w-40 animate-pulse rounded bg-neutral-800"/><div className="h-4 w-56 animate-pulse rounded bg-neutral-900"/><div className="mt-4 h-28 animate-pulse rounded-3xl bg-neutral-900"/></div></div>;
  if(!status?.authenticated) return <div className="flex min-h-dvh items-center justify-center bg-neutral-950 px-4 py-8 text-neutral-100"><div className="w-full max-w-sm rounded-[2rem] border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white"><CreditCard/></div><h1 className="text-2xl font-bold tracking-tight">Card Ledger</h1><p className="mt-1 text-sm text-neutral-400">Private credit card expense manager</p>{error&&<p className="mt-4 rounded-2xl border border-red-900 bg-red-950/70 p-3 text-sm text-red-200">{error}</p>}<AuthForm setup={!!status?.setup_required} busy={busy} onSubmit={async(username,password,remember)=>{setBusy(true);setError('');try{await request(status?.setup_required?'setup':'login','POST',{username,password,remember});const s=await refreshStatus();if(s.authenticated){if(s.user_id)await syncTransactionOutbox(String(s.user_id));await loadData(s.user_id?String(s.user_id):undefined);notify(status?.setup_required?'Account created':'Welcome back')}}catch(e){const m=(e as Error).message;setError(m);notify(m,'error')}finally{setBusy(false)}}}/><p className="mt-5 text-xs leading-5 text-neutral-500"><ShieldCheck className="mr-1 inline" size={13}/> Your records remain in your own SQLite database.</p></div>{toast&&<Toast toast={toast} onClose={()=>setToast(null)}/>}</div>;

  const navItems:[Tab,string,React.ReactNode][]=[['dashboard','Dashboard',<Home size={20}/>],['transactions','Transactions',<ReceiptText size={20}/>],['settings','Settings',<Settings size={20}/>]];
  return <div data-theme={theme} className={`min-h-dvh bg-neutral-950 text-neutral-100 ${density==='compact'?'density-compact':'density-comfortable'}`}>
    <header data-app-header className="sticky top-0 z-30 border-b border-neutral-800/90 bg-neutral-950/95 pt-[env(safe-area-inset-top)] backdrop-blur"><div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3"><div className="flex min-w-0 items-center gap-3">{tab==='card'&&<button onClick={()=>goTab('dashboard')} aria-label="Back to dashboard" className="rounded-full p-2 text-neutral-300 hover:bg-neutral-800"><ArrowLeft size={20}/></button>}<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white"><CreditCard size={20}/></div><div className="min-w-0"><h1 className="truncate text-lg font-bold tracking-tight">{activeTitle}</h1>{tab==='card'&&activeCard?<p className="truncate text-xs text-neutral-500">{activeCard.bank_name}{activeCard.last4?` · •••• ${activeCard.last4}`:''}</p>:<p className="app-header-status text-[11px] text-neutral-500">{syncState==='syncing'?'Refreshing…':syncState==='pending'?'Saved · pending sync':syncState==='offline'?'Offline · saved data':syncState==='error'?'Sync needs attention':'Personal finance · synced'}</p>}</div></div><div className="flex shrink-0 items-center gap-1"><button title={theme==='dark'?'Switch to light mode':'Switch to dark mode'} aria-label={theme==='dark'?'Switch to light mode':'Switch to dark mode'} onClick={()=>setTheme(v=>v==='dark'?'light':'dark')} className="rounded-xl p-2.5 text-neutral-400 hover:bg-neutral-800">{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><span role="status"  aria-live="polite" className="max-w-[4.5rem] truncate text-[10px] text-neutral-500 sm:max-w-none">{syncState==='syncing'?'Refreshing':syncState==='pending'?'Pending':syncState==='offline'?'Offline':syncState==='error'?'Sync issue':'Saved'}</span><button title="Refresh" aria-label="Refresh data" onClick={()=>void perform(loadData,'Updated')} className="rounded-xl p-2.5 text-neutral-400 hover:bg-neutral-800"><RefreshCw size={18} className={syncState==='syncing'?'animate-spin':''}/></button><button title="Log out" aria-label="Log out" disabled={busy} onClick={()=>void logOut()} className="rounded-xl p-2.5 text-neutral-400 hover:bg-neutral-800"><LogOut size={18}/></button></div></div></header>

    <main className="safe-bottom mx-auto max-w-3xl px-4 pb-32 pt-4">
      {error&&<div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-red-900 bg-red-950/70 p-3 text-sm text-red-200"><span>{error}</span><button onClick={()=>setError('')} aria-label="Dismiss error"><X size={16}/></button></div>}

      <AppRouteContextProvider value={{pages: routePages, txns, paymentsData: payments, cardsData: cards, dataReady, deletePayment: (payment:Payment)=>void deletePaymentOptimistic(payment), deleteTransaction: (txn:Txn)=>void deleteTransactionOptimistic(txn), deleteCard: (card:Card)=>deleteCardFromRoute(card), appsData: apps, saveUpiApp, deactivateUpiApp} satisfies AppRouteContext}>
        <RouteErrorBoundary key={`route-${location.pathname}`}>{routeElement}</RouteErrorBoundary>
        {isModalRoute && modalRouteElement && <div className="route-modal-backdrop fixed inset-0 z-[80] flex items-end justify-center overflow-hidden bg-black/65 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) navigate(-1); }}>
          <div className="route-modal-surface w-full max-w-2xl max-h-[calc(100dvh-env(safe-area-inset-top))] overflow-hidden rounded-t-[1.75rem] border border-neutral-800 bg-neutral-950 shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}>
            <RouteErrorBoundary key={`modal-${location.pathname}`}>{modalRouteElement}</RouteErrorBoundary>
          </div>
        </div>}
      </AppRouteContextProvider>

      

      

      {cycleSheetOpen&&activeCard&&<Modal title="Select billing cycle" onClose={()=>setCycleSheetOpen(false)}><p className="mb-3 text-sm text-neutral-400">Choose a cycle to view its transactions and statement details.</p><div className="max-h-[58dvh] space-y-2 overflow-y-auto overscroll-contain pr-1"><button type="button" onClick={()=>{setCycle('current');setCycleSheetOpen(false)}} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${cycle==='current'?'border-violet-500 bg-violet-500/10':'border-neutral-800 bg-neutral-900'}`}><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${cycle==='current'?'border-violet-400 text-violet-300':'border-neutral-600 text-transparent'}`}>{cycle==='current'&&<Check size={13}/>}</span><span className="min-w-0 flex-1"><span className="block font-semibold">Current</span><span className="mt-0.5 block text-xs text-neutral-400">{day(currentStart)} – {day(currentEnd)}</span></span><span className="billing-cycle-active text-xs font-semibold text-violet-300">Active</span></button>{cardStatements.map(st=>{const value=String(st.id);return <button key={st.id} type="button" onClick={()=>{setCycle(value);setCycleSheetOpen(false)}} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${cycle===value?'border-violet-500 bg-violet-500/10':'border-neutral-800 bg-neutral-900'}`}><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${cycle===value?'border-violet-400 text-violet-300':'border-neutral-600 text-transparent'}`}>{cycle===value&&<Check size={13}/>}</span><span className="min-w-0 flex-1"><span className="block font-semibold">{monthLabel(st.cycle_end.slice(0,7))}</span><span className="mt-0.5 block text-xs text-neutral-400">{day(st.cycle_start)} – {day(st.cycle_end)}</span></span><span className="shrink-0 text-right text-sm font-semibold">{money(st.amount_minor)}</span></button>})}</div><Button className="mt-4 w-full" variant="secondary" onClick={()=>setCycleSheetOpen(false)}>Close</Button></Modal>}

      

      
    </main>

    <nav className="bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-neutral-800 bg-neutral-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"><div className="mx-auto grid max-w-xl grid-cols-3 px-3 pt-2">{navItems.map(([key,label,icon])=><button key={key} onClick={()=>goTab(key)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-semibold ${tab===key?'text-violet-300':'text-neutral-500'}`}><span className={`flex h-8 min-w-14 items-center justify-center rounded-2xl ${tab===key?'bg-violet-500/15':''}`}>{icon}</span>{label}</button>)}</div></nav>

    {filtersOpen&&<div className="fixed inset-0 z-40"><button aria-label="Close filters" className="absolute inset-0 bg-black/65" onClick={()=>setFiltersOpen(false)}/><aside role="dialog" aria-modal="true" aria-label="Transaction filters" className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-neutral-800 bg-neutral-950 shadow-2xl"><div className="flex items-center justify-between border-b border-neutral-800 p-4"><div className="flex items-center gap-3"><button onClick={()=>setFiltersOpen(false)} aria-label="Close filters" className="rounded-xl p-2 hover:bg-neutral-800"><ArrowLeft size={19}/></button><h2 className="text-lg font-bold">Filters</h2></div><button onClick={()=>setFilters({month:'',card_id:'',method:'',upi_app_id:'',category:'',q:filters.q,from:'',to:''})} className="text-sm font-semibold text-violet-300">Clear all</button></div><div className="flex-1 space-y-4 overflow-y-auto p-4"><Field label="Calendar month"><input type="month" className={inputClass} value={filters.month} onChange={e=>setFilters({...filters,month:e.target.value,from:'',to:''})}/></Field><Field label="Credit card"><select className={inputClass} value={filters.card_id} onChange={e=>setFilters({...filters,card_id:e.target.value})}><option value="">All cards</option>{cards.map(c=><option key={c.id} value={c.id}>{c.name} · {c.bank_name}</option>)}</select></Field><Field label="Payment method"><select className={inputClass} value={filters.method} onChange={e=>setFilters({...filters,method:e.target.value})}><option value="">All methods</option><option value="upi">UPI</option><option value="online">Online</option><option value="swipe">Swipe</option></select></Field><Field label="UPI application"><select className={inputClass} value={filters.upi_app_id} onChange={e=>setFilters({...filters,upi_app_id:e.target.value})}><option value="">All applications</option>{apps.map(a=><option key={a.id} value={a.id}>{a.name}{!a.active?' (inactive)':''}</option>)}</select></Field><Field label="Category"><select className={inputClass} value={filters.category} onChange={e=>setFilters({...filters,category:e.target.value})}><option value="">All categories</option>{[...new Set(txns.map(t=>t.category||'').filter(Boolean))].sort().map(c=><option key={c} value={c}>{c}</option>)}</select></Field><div className="grid grid-cols-2 gap-3"><Field label="From date"><input type="date" className={inputClass} value={filters.from} onChange={e=>setFilters({...filters,month:'',from:e.target.value})}/></Field><Field label="To date"><input type="date" className={inputClass} value={filters.to} onChange={e=>setFilters({...filters,month:'',to:e.target.value})}/></Field></div><div className="rounded-2xl bg-neutral-900 p-3 text-xs leading-5 text-neutral-500">All Transactions stays grouped by transaction calendar month. A card's detail screen uses that card's settlement-date billing cycles.</div></div><div className="border-t border-neutral-800 p-4"><Button className="w-full" onClick={()=>setFiltersOpen(false)}>Apply filters ({shownTxns.length})</Button></div></aside></div>}

    {toast&&<Toast toast={toast} onClose={()=>setToast(null)}/>}
  </div>;
}

function Metric({label,value,tone}:{label:string;value:string;tone:'amber'|'green'}) {return <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4"><div className={`text-xs font-semibold ${tone==='amber'?'text-amber-300':'text-emerald-300'}`}>{label}</div><div className="mt-1 text-lg font-bold">{value}</div></div>}
function Toast({toast,onClose}:{toast:{message:string;kind:'success'|'error'|'info'};onClose:()=>void}) {const color=toast.kind==='error'?'border-red-900 bg-red-950 text-red-100':toast.kind==='success'?'border-emerald-900 bg-emerald-950 text-emerald-100':'border-neutral-700 bg-neutral-900 text-neutral-100';return <div role="status" aria-live="polite" className={`fixed left-4 right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-[100] mx-auto flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl ${color}`}><span className="flex-1">{toast.message}</span><button onClick={onClose} aria-label="Dismiss message"><X size={17}/></button></div>}

function AuthForm({setup,busy,onSubmit}:{setup:boolean;busy:boolean;onSubmit:(u:string,p:string,remember:boolean)=>void}) {
  const [username,setUsername]=useState('');const [password,setPassword]=useState('');const [showPassword,setShowPassword]=useState(false);const [remember,setRemember]=useState(true);
  return <form className="mt-6 space-y-4" onSubmit={e=>{e.preventDefault();onSubmit(username,password,remember)}}>
    {setup&&<Field label="Username" required><input className={inputClass} autoComplete="username" minLength={3} required value={username} onChange={e=>setUsername(e.target.value)} placeholder="Choose a username"/></Field>}
    <Field label="Password" required><div className="relative"><input className={`${inputClass} pr-12`} type={showPassword?'text':'password'} autoComplete={setup?'new-password':'current-password'} minLength={setup?10:1} required value={password} onChange={e=>setPassword(e.target.value)} placeholder={setup?'At least 10 characters':'Your password'}/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute inset-y-0 right-2 flex w-10 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-800" aria-label={showPassword?'Hide password':'Show password'}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></Field>
    {!setup&&<label className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 px-3 py-3 text-sm text-neutral-300"><input type="checkbox" className="h-4 w-4 accent-violet-500" checked={remember} onChange={e=>setRemember(e.target.checked)}/>Remember me for 30 days</label>}
    <Button type="submit" disabled={busy} className="w-full">{busy?'Please wait…':setup?'Create secure account':'Log in'}</Button>
    {setup&&<p className="text-xs leading-5 text-neutral-500">Initial setup creates your single account. Use a strong password and keep it safe.</p>}
  </form>;
}

function CardForm({initial,busy,onClose,onSave,page=false}:{initial:Card|null;busy:boolean;onClose:()=>void;onSave:(data:any)=>void;page?:boolean}) {
  const [v,setV]=useState({name:initial?.name||'',bank_name:initial?.bank_name||'',last4:initial?.last4||'',credit_limit:initial?.credit_limit_minor==null?'':minorToRupees(initial.credit_limit_minor),billing_day:String(initial?.billing_day||5),billing_rule:initial?.billing_rule||'end',due_days:String(initial?.due_days??20),active:!!(initial?.active??1)});
  const [timingSheetOpen,setTimingSheetOpen]=useState(false);
  const [billingInfoOpen,setBillingInfoOpen]=useState(false);
  const update=(key:string,value:any)=>setV(prev=>({...prev,[key]:value}));
  const billingDay=Math.max(1,Math.min(31,Number(v.billing_day)||1));
  const ordinal=(n:number)=>`${n}${n%100>=11&&n%100<=13?'th':n%10===1?'st':n%10===2?'nd':n%10===3?'rd':'th'}`;
  const startAvailable=ordinal(billingDay);
  const endAvailable=ordinal(billingDay===31?1:billingDay+1);
  return <Modal title={initial?'Edit card':'Add credit card'} onClose={onClose} noScroll inline={page}><form className="card-form-content" onSubmit={e=>{e.preventDefault();onSave({name:v.name.trim(),bank_name:v.bank_name.trim(),last4:v.last4,credit_limit_minor:v.credit_limit===''?null:rupeesToMinor(v.credit_limit),billing_day:Number(v.billing_day),billing_rule:v.billing_rule,due_days:Number(v.due_days),active:v.active?1:0})}}>
    <Field label="Card nickname" required><input className={inputClass} required value={v.name} onChange={e=>update('name',e.target.value)} placeholder="e.g. Grocery card"/></Field>
    <Field label="Bank name" required><input className={inputClass} required value={v.bank_name} onChange={e=>update('bank_name',e.target.value)} placeholder="e.g. HDFC Bank"/></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Last 4 digits"><input inputMode="numeric" maxLength={4} className={inputClass} value={v.last4} onChange={e=>update('last4',e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="Optional"/></Field><Field label="Credit limit (₹)"><input type="number" min="0" step="0.01" className={inputClass} value={v.credit_limit} onChange={e=>update('credit_limit',e.target.value)} placeholder="Optional"/></Field></div>
    <div className="grid grid-cols-2 gap-3"><Field label="Billing day (1–31)" required><input type="number" min="1" max="31" required className={inputClass} value={v.billing_day} onChange={e=>update('billing_day',e.target.value)}/></Field><Field label="Due days after cycle" required><input type="number" min="0" max="90" required className={inputClass} value={v.due_days} onChange={e=>update('due_days',e.target.value)}/></Field></div>
    <Field label="Bill generation timing (e.g. 10th)" required><button type="button" onClick={()=>setTimingSheetOpen(true)} className={`${inputClass} flex items-center justify-between text-left`} aria-haspopup="dialog" aria-expanded={timingSheetOpen}><span>{v.billing_rule==='start'?'Start of day':'End of day'}</span><ChevronDown size={18} className="shrink-0 text-neutral-400"/></button></Field>
    {timingSheetOpen&&<Modal title="Bill generation timing" onClose={()=>setTimingSheetOpen(false)} bottomSheet><div className="space-y-2" role="radiogroup" aria-label="Bill generation timing">
      <button type="button" role="radio" aria-checked={v.billing_rule==='start'} onClick={()=>{update('billing_rule','start');setTimingSheetOpen(false)}} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${v.billing_rule==='start'?'border-violet-500 bg-violet-500/10':'border-neutral-800 bg-neutral-900'}`}><span><span className="block text-sm font-semibold text-neutral-100">Start of day</span><span className="mt-1 block text-xs text-neutral-400">Bill available on {startAvailable} (billing date itself).</span></span><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${v.billing_rule==='start'?'border-violet-400 bg-violet-500':'border-neutral-600'}`}>{v.billing_rule==='start'&&<span className="h-2 w-2 rounded-full bg-white"/>}</span></button>
      <button type="button" role="radio" aria-checked={v.billing_rule==='end'} onClick={()=>{update('billing_rule','end');setTimingSheetOpen(false)}} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${v.billing_rule==='end'?'border-violet-500 bg-violet-500/10':'border-neutral-800 bg-neutral-900'}`}><span><span className="block text-sm font-semibold text-neutral-100">End of day</span><span className="mt-1 block text-xs text-neutral-400">Bill available on {endAvailable} (day after billing date).</span></span><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${v.billing_rule==='end'?'border-violet-400 bg-violet-500':'border-neutral-600'}`}>{v.billing_rule==='end'&&<span className="h-2 w-2 rounded-full bg-white"/>}</span></button>
    </div><p className="mt-3 text-xs leading-5 text-neutral-500">Choose when your bank makes the statement available. The billing day itself is configured separately above.</p></Modal>}
    <div className="relative flex items-center gap-2 text-xs text-neutral-500">
      <button type="button" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-800 hover:text-violet-400 focus-visible:outline-2 focus-visible:outline-violet-400" aria-label="Billing cycle allocation information" aria-expanded={billingInfoOpen} aria-describedby={billingInfoOpen?'billing-cycle-allocation-tooltip':undefined} onClick={()=>setBillingInfoOpen(open=>!open)}><Info size={17}/></button>
      <span>Billing cycle allocation information</span>
      {billingInfoOpen&&<div id="billing-cycle-allocation-tooltip" role="tooltip" className="absolute bottom-full left-0 z-30 mb-2 max-w-[min(22rem,calc(100vw-3rem))] rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-xs leading-5 text-neutral-200 shadow-xl">Cycle allocation uses settlement date. Billing days 29–31 are adjusted to the final day in shorter months.</div>}
    </div>
    {initial&&<label className="flex items-center gap-3 text-sm text-neutral-300"><input type="checkbox" className="accent-violet-500" checked={v.active} onChange={e=>update('active',e.target.checked)}/> Card active</label>}
    <div className="sheet-card-actions flex gap-2 pt-1"><Button type="submit" disabled={busy} className="min-h-14 flex-1">{busy?'Saving…':'Save card'}</Button><Button variant="secondary" onClick={onClose} className="min-h-14">Cancel</Button></div>
  </form></Modal>;
}

function TxnForm({initial,cards,apps,categories,defaultCard,busy,onClose,onSave,page=false}:{initial:Txn|null;cards:Card[];apps:AppItem[];categories:string[];defaultCard:Card|null;busy:boolean;onClose:()=>void;onSave:(data:any,file:File|null)=>void;page?:boolean}) {
  const now=dateTimeLocal();
  // Always seed settlement date from the saved settlement date, falling back to the
  // transaction date. Same-date transactions start checked; different dates stay unchecked.
  const initialTxnDate=(initial?.txn_at||now).slice(0,10);
  const initialSettlementDate=(initial?.settlement_date||'').slice(0,10)||initialTxnDate;
  const [v,setV]=useState({card_id:String(initial?.card_id||defaultCard?.id||cards[0]?.id||''),amount:initial?minorToRupees(initial.amount_minor):'',txn_at:dateTimeLocal(initial?.txn_at),settlement_date:initialSettlementDate,sameSettlement:initial?initialSettlementDate===initialTxnDate:true,payment_method:initial?.payment_method||'upi',upi_app_id:String(initial?.upi_app_id||apps.find(a=>a.active)?.id||''),particular:initial?.particular||'',notes:initial?.notes||'',category:initial?.category||'',tags:initial?.tags||''});
  const [file,setFile]=useState<File|null>(null);const [moreOpen,setMoreOpen]=useState(false);const [categoryPickerOpen,setCategoryPickerOpen]=useState(false);const [upiPickerOpen,setUpiPickerOpen]=useState(false);const [cardPickerOpen,setCardPickerOpen]=useState(false);const [methodPickerOpen,setMethodPickerOpen]=useState(false);const [upiSearch,setUpiSearch]=useState('');const [cardSearch,setCardSearch]=useState('');
  const update=(key:string,value:any)=>setV(prev=>({...prev,[key]:value}));
  const selectedCard=cards.find(c=>String(c.id)===v.card_id);const selectedApp=apps.find(a=>String(a.id)===v.upi_app_id);
  const setTxnDate=(date:string)=>setV(prev=>({...prev,txn_at:`${date}T${prev.txn_at.slice(11,16)}`,settlement_date:prev.sameSettlement?date:prev.settlement_date}));
  const setTxnTime=(time:string)=>update('txn_at',`${v.txn_at.slice(0,10)}T${time}`);
  const methodLabel=(method:string)=>method==='upi'?'UPI':method==='online'?'Online':'Swipe';
  const methodIcon=(method:string)=>method==='upi'?<Smartphone size={18}/>:method==='online'?<Globe size={18}/>:<CreditCard size={18}/>;
  return <div className={`txn-page ${page?'mx-auto min-h-0 w-full max-w-3xl':'fixed inset-0 z-50'} flex flex-col bg-neutral-950 text-neutral-100`} role={page?'region':'dialog'} aria-modal={page?undefined:true} aria-label={initial?'Edit transaction':'Add expense'}>
    <header className="txn-modal-header flex w-full shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-4" style={{paddingTop:'max(.75rem, env(safe-area-inset-top))'}}><h1 className="min-w-0 flex-1 text-lg font-bold">{initial?'Edit transaction':'Add expense'}</h1><button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-neutral-400 hover:bg-neutral-800"><X size={20}/></button></header>
    <form className="txn-page-form mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-2 px-3 pt-2" onSubmit={e=>{e.preventDefault();const dt=toSqlDateTime(v.txn_at);onSave({card_id:Number(v.card_id),particular:v.particular.trim(),category:v.category.trim(),tags:v.tags.split(',').map(x=>x.trim()).filter(Boolean).join(', '),amount_minor:rupeesToMinor(v.amount),txn_at:dt,settlement_date:v.sameSettlement?dt.slice(0,10):v.settlement_date,payment_method:v.payment_method,upi_app_id:v.payment_method==='upi'?Number(v.upi_app_id):null,notes:v.notes.trim()},file)}}>
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 focus-within:border-violet-500"><label className="flex items-center gap-2"><span aria-hidden="true" className="text-2xl font-semibold text-neutral-400">₹</span><input aria-label="Expense amount in rupees" className="amount-entry-input min-w-0 flex-1 bg-transparent py-1 text-2xl font-bold tabular-nums text-neutral-100 outline-none placeholder:text-neutral-700" inputMode="decimal" type="number" min="0.01" step="0.01" required autoComplete="off" value={v.amount} onChange={e=>update('amount',e.target.value)} placeholder="0.00"/></label></div>
      <label className="flex min-w-0 items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 focus-within:border-violet-500"><ReceiptText size={18} className="shrink-0 text-neutral-400"/><input aria-label="Particulars or merchant" className="min-w-0 flex-1 bg-transparent py-0.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-500" value={v.particular} onChange={e=>update('particular',e.target.value)} placeholder="What was this for?"/></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-w-0 items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 focus-within:border-violet-500"><CalendarDays size={18} className="shrink-0 text-neutral-400"/><input aria-label="Transaction date" type="date" required className="txn-date-value min-w-0 w-full bg-transparent text-sm text-neutral-100 outline-none" value={v.txn_at.slice(0,10)} onChange={e=>setTxnDate(e.target.value)}/></label>
        <label className="flex min-w-0 items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 focus-within:border-violet-500"><Clock3 size={18} className="shrink-0 text-neutral-400"/><input aria-label="Transaction time" type="time" required className="min-w-0 w-full bg-transparent text-sm text-neutral-100 outline-none" value={v.txn_at.slice(11,16)} onChange={e=>setTxnTime(e.target.value)}/></label>
      </div>
      <div className="space-y-2">
        <button type="button" onClick={()=>setCardPickerOpen(true)} aria-label={`Credit card: ${selectedCard?.name||'Choose card'}`} className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-left hover:border-neutral-700"><CreditCard size={19} className="shrink-0 text-violet-300"/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{selectedCard?.name||'Choose card'}</span><span className="block truncate text-[11px] text-neutral-500">{selectedCard?.bank_name||'Credit card'}</span></span><ChevronDown size={16} className="shrink-0 text-neutral-500"/></button>
        <button type="button" onClick={()=>setMethodPickerOpen(true)} aria-label={`Payment method: ${methodLabel(v.payment_method)}`} className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-left hover:border-neutral-700">{methodIcon(v.payment_method)}<span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{methodLabel(v.payment_method)}</span><span className="block truncate text-[11px] text-neutral-500">Choose method</span></span><ChevronDown size={16} className="shrink-0 text-neutral-500"/></button>
      </div>
      {v.payment_method==='upi'&&<button type="button" onClick={()=>setUpiPickerOpen(true)} className="flex w-full items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-left hover:border-neutral-700"><Smartphone size={19} className="shrink-0 text-neutral-400"/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{selectedApp?.name||'Choose UPI application'}</span><span className="block text-[11px] text-neutral-500">UPI app</span></span><ChevronDown size={16} className="text-neutral-500"/></button>}
      <button type="button" onClick={()=>setMoreOpen(true)} className="flex w-full shrink-0 items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-left hover:border-neutral-700"><SlidersHorizontal size={19} className="text-neutral-400"/><span className="flex-1 text-sm font-semibold">More options</span><ChevronRight size={18} className="text-neutral-500"/></button>
      <div className="txn-page-actions mt-auto grid shrink-0 grid-cols-2 gap-2 pt-1" style={{paddingBottom:'max(.75rem, env(safe-area-inset-bottom))'}}>
        <Button variant="secondary" type="button" disabled={busy} onClick={onClose} className="w-full">Cancel</Button>
        <Button type="submit" disabled={busy||!cards.length} className="w-full">{busy?(initial?'Saving…':'Saving…'):(initial?'Save changes':'Save expense')}</Button>
      </div>
    </form>
    {moreOpen&&<Modal title="More options" onClose={()=>setMoreOpen(false)}><div className="max-h-[84dvh] space-y-3 overflow-y-auto pr-1 overscroll-contain">
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-2.5"><label className="flex items-center gap-2 text-sm text-neutral-200"><input type="checkbox" className="h-4 w-4 accent-violet-500" checked={v.sameSettlement} onChange={e=>{update('sameSettlement',e.target.checked);if(e.target.checked)update('settlement_date',v.txn_at.slice(0,10))}}/>Settlement date follows transaction date</label>{!v.sameSettlement&&<label className="mt-2 flex items-center gap-2"><CalendarDays size={18} className="text-neutral-400"/><input aria-label="Settlement date" type="date" required className="min-w-0 flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" value={v.settlement_date} onChange={e=>{update('settlement_date',e.target.value);update('sameSettlement',e.target.value===v.txn_at.slice(0,10))}}/></label>}</div>
      <Field label="Category"><button type="button" onClick={()=>setCategoryPickerOpen(true)} className="flex w-full items-center justify-between rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-left text-sm"><span className={v.category?'text-neutral-100':'text-neutral-500'}>{v.category||'No category'}</span><ChevronDown size={17} className="text-neutral-500"/></button></Field>
      <Field label="Tags (comma-separated)"><input className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-violet-400" value={v.tags} onChange={e=>update('tags',e.target.value)} placeholder="work, family, reimbursable"/></Field>
      <Field label="Notes"><textarea rows={2} className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-violet-400" value={v.notes} onChange={e=>update('notes',e.target.value)} placeholder="Extra details (optional)"/></Field>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-neutral-700 bg-neutral-900 p-2.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-violet-300"><ImagePlus size={18}/></div><div className="min-w-0 flex-1"><div className="text-sm font-semibold text-neutral-200">Attach a receipt or screenshot</div><div className="truncate text-xs text-neutral-500">JPG, PNG or WebP · up to 5 MB</div>{file&&<div className="mt-1 truncate text-xs text-violet-300">{file.name}</div>}{initial?.has_attachment===1&&!file&&<a className="mt-1 inline-block text-xs text-violet-300" href={`${API}?action=transaction-attachment&id=${initial.id}`} target="_blank" rel="noreferrer">View existing attachment</a>}</div><Paperclip size={18} className="text-neutral-500"/><input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
      <Button className="w-full" onClick={()=>setMoreOpen(false)}>Done</Button>
    </div></Modal>}
    {cardPickerOpen&&<Modal title="Choose credit card" onClose={()=>setCardPickerOpen(false)}><div className="space-y-3"><input className={inputClass} placeholder="Search cards" aria-label="Search credit cards" value={cardSearch} onChange={e=>setCardSearch(e.target.value)}/><div className="max-h-[55dvh] space-y-1 overflow-y-auto">{cards.filter(c=>`${c.name} ${c.bank_name} ${c.last4}`.toLowerCase().includes(cardSearch.toLowerCase())).map(c=><button type="button" key={c.id} onClick={()=>{update('card_id',String(c.id));setCardPickerOpen(false);setCardSearch('')}} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${v.card_id===String(c.id)?'border-violet-500 bg-violet-500/10':'border-neutral-800 bg-neutral-900'}`}><CreditCard size={19} className="text-violet-300"/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{c.name}</span><span className="block truncate text-xs text-neutral-500">{c.bank_name}{c.last4?` · •••• ${c.last4}`:''}</span></span>{v.card_id===String(c.id)&&<Check size={17} className="text-violet-300"/>}</button>)}{cards.filter(c=>`${c.name} ${c.bank_name} ${c.last4}`.toLowerCase().includes(cardSearch.toLowerCase())).length===0&&<p className="p-3 text-sm text-neutral-500">No matching cards.</p>}</div></div></Modal>}
    {methodPickerOpen&&<Modal title="Payment method" onClose={()=>setMethodPickerOpen(false)}><div className="space-y-2">{(['upi','online','swipe'] as const).map(method=><button type="button" key={method} onClick={()=>{update('payment_method',method);setMethodPickerOpen(false)}} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${v.payment_method===method?'border-violet-500 bg-violet-500/10':'border-neutral-800 bg-neutral-900'}`}>{methodIcon(method)}<span className="flex-1 text-sm font-semibold">{methodLabel(method)}</span>{v.payment_method===method&&<Check size={17} className="text-violet-300"/>}</button>)}</div></Modal>}
    {upiPickerOpen&&<Modal title="Choose UPI application" onClose={()=>setUpiPickerOpen(false)}><div className="space-y-3"><input autoFocus={false} className={inputClass} placeholder="Search apps" aria-label="Search UPI applications" value={upiSearch} onChange={e=>setUpiSearch(e.target.value)}/><div className="max-h-[50dvh] space-y-1 overflow-y-auto">{apps.filter(a=>a.active&&a.name.toLowerCase().includes(upiSearch.toLowerCase())).map(a=><button type="button" key={a.id} onClick={()=>{update('upi_app_id',String(a.id));setUpiPickerOpen(false);setUpiSearch('')}} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${v.upi_app_id===String(a.id)?'border-violet-500 bg-violet-500/10':'border-neutral-800 bg-neutral-900'}`}><span className="text-sm font-medium">{a.name}</span>{v.upi_app_id===String(a.id)&&<Check size={17} className="text-violet-300"/>}</button>)}{apps.filter(a=>a.active&&a.name.toLowerCase().includes(upiSearch.toLowerCase())).length===0&&<p className="p-3 text-sm text-neutral-500">No matching apps.</p>}</div><p className="text-center text-xs text-neutral-500">Manage application names in Settings → UPI applications.</p></div></Modal>}
    {categoryPickerOpen&&<Modal title="Choose category" onClose={()=>setCategoryPickerOpen(false)}><div className="space-y-1"><button type="button" onClick={()=>{update('category','');setCategoryPickerOpen(false)}} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${!v.category?'border-violet-500 bg-violet-500/10':'border-neutral-800 bg-neutral-900'}`}><span>No category</span>{!v.category&&<Check size={17}/>}</button>{categories.map(c=><button type="button" key={c} onClick={()=>{update('category',c);setCategoryPickerOpen(false)}} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${v.category===c?'border-violet-500 bg-violet-500/10':'border-neutral-800 bg-neutral-900'}`}><span>{c}</span>{v.category===c&&<Check size={17} className="text-violet-300"/>}</button>)}</div></Modal>}
  </div>;
}

function PaymentForm({initial,cards,defaultCard,busy,onClose,onSave,page=false}:{initial:Payment|null;cards:Card[];defaultCard:Card|null;busy:boolean;onClose:()=>void;onSave:(data:any)=>void;page?:boolean}) {
 const [v,setV]=useState({card_id:String(initial?.card_id||defaultCard?.id||cards[0]?.id||''),amount:initial?minorToRupees(initial.amount_minor):'',paid_at:initial?dateTimeLocal(initial.paid_at):dateTimeLocal(),reference:initial?.reference||'',notes:initial?.notes||''});const update=(k:string,x:any)=>setV(p=>({...p,[k]:x}));
 return <Modal title={initial?'Edit bill payment':'Record bill payment'} onClose={onClose} inline={page}><form className="space-y-4" onSubmit={e=>{e.preventDefault();onSave({...(initial?{id:initial.id}:{}),card_id:Number(v.card_id),amount_minor:rupeesToMinor(v.amount),paid_at:toSqlDateTime(v.paid_at),reference:v.reference,notes:v.notes})}}><Field label="Credit card" required><select className={inputClass} value={v.card_id} required onChange={e=>update('card_id',e.target.value)}>{cards.map(c=><option key={c.id} value={c.id}>{c.name} · {c.bank_name}</option>)}</select></Field><Field label="Payment amount (₹)" required><input type="number" min="0.01" step="0.01" inputMode="decimal" required className={`${inputClass} text-xl font-bold`} value={v.amount} onChange={e=>update('amount',e.target.value)} placeholder="0.00"/></Field><Field label="Payment date and time" required><input type="datetime-local" required className={inputClass} value={v.paid_at} onChange={e=>update('paid_at',e.target.value)}/></Field><Field label="Reference (optional)"><input className={inputClass} value={v.reference} onChange={e=>update('reference',e.target.value)} placeholder="Bank reference / UTR"/></Field><Field label="Notes (optional)"><input className={inputClass} value={v.notes} onChange={e=>update('notes',e.target.value)} placeholder="Payment details"/></Field><p className="rounded-2xl bg-amber-950/60 p-3 text-xs leading-5 text-amber-200">Payment is allocated to oldest outstanding statements first. Bill payments reduce dues; they do not increase expense totals.</p><div className="flex gap-2"><Button type="submit" disabled={busy||!cards.length} className="flex-1">{busy?'Saving…':initial?'Save changes':'Record payment'}</Button><Button variant="secondary" onClick={onClose}>Cancel</Button></div></form></Modal>;
}
function TxnRow({txn,card,to,onNavigate,stripeIndex=0}:{txn:Txn;card?:Card;to:string;onNavigate?:()=>void;stripeIndex?:number}) {
 void card;
 const method=txn.payment_method==='upi'?'UPI':txn.payment_method==='online'?'Online':'Swipe';
 const date=new Date(`${txn.txn_at.slice(0,10)}T12:00:00`);
 const dateDay=date.toLocaleDateString('en-IN',{day:'2-digit'});
 const dateMonth=date.toLocaleDateString('en-IN',{month:'short'}).toUpperCase();
 const time=new Date(txn.txn_at.replace(' ','T')).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
 return <ModalLink to={to} onClick={onNavigate} className={`txn-row ${stripeIndex % 2 === 1 ? "txn-row-even" : "txn-row-odd"} flex w-full items-center gap-2 border-b border-neutral-800 px-2.5 py-2 text-left last:border-b-0 hover:bg-neutral-800/50`}>
   <div className="txn-date-badge flex h-[42px] w-[42px] shrink-0 flex-col items-center justify-center rounded-lg">
     <span className="text-lg font-bold leading-5 tabular-nums">{dateDay}</span><span className="text-[10px] font-semibold leading-3 tracking-wide">{dateMonth}</span>
   </div>
   <div className="min-w-0 flex-1">
     <div className="flex min-w-0 items-center justify-between gap-2">
       <span className="min-w-0 truncate text-[13px] font-semibold text-neutral-100">{txn.particular}</span>
       <span className="shrink-0 text-[13px] font-bold tabular-nums text-neutral-100">{money(txn.amount_minor)}</span>
     </div>
     <div className="txn-meta-divider my-1 h-px w-full"/>
     <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] leading-4 text-neutral-400">
       <span>{time}</span><span aria-hidden="true">·</span><span className="max-w-[9rem] truncate">{txn.card_name}</span>
       <span className="txn-method-label rounded px-1 py-px font-medium">{method}</span>
       {txn.payment_method==='upi'&&txn.upi_app_name&&<span className="max-w-[5rem] truncate">{txn.upi_app_name}</span>}
       {txn.has_attachment===1&&<Paperclip size={11} className="shrink-0" aria-label="Attachment"/>}
     </div>
   </div>
 </ModalLink>;
}


export default function App() {
  const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';
  return <BrowserRouter basename={basename}><AppShell /></BrowserRouter>;
}
