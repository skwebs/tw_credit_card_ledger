import ModalLink from '../../routes/ModalLink';
import { useAppRouteContext } from '../../routes/route-context';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import { type AppRouteContext } from '../../routes/route-context';

const API = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/api`;
const money = (minor: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format((Number(minor) || 0) / 100);
const day = (value: string) => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function TransactionDetailsPage() {
  const { transactionId } = useParams();
  const { txns, dataReady, deleteTransaction } = useAppRouteContext<AppRouteContext>();
  const navigate = useNavigate();
  const location = useLocation();
  const txn = txns.find(item => item.id === Number(transactionId));
  if (!dataReady) return <div className="py-8 text-center text-sm text-neutral-500">Loading transaction…</div>;
  if (!txn) return <Navigate to="/transactions" replace />;

  const time = new Date(txn.txn_at.replace(' ', 'T')).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const fields: [string, string][] = [
    ['Credit card', txn.card_name],
    ['Payment method', txn.payment_method.toUpperCase()],
    ...(txn.upi_app_name ? [['UPI application', txn.upi_app_name] as [string, string]] : []),
    ['Transaction date', day(txn.txn_at)],
    ['Transaction time', time],
    ['Settlement date', txn.settlement_date ? day(txn.settlement_date) : 'Not set'],
    ['Category', txn.category || '—'],
    ['Tags', txn.tags || '—'],
    ['Notes', txn.notes || '—'],
  ];

  const close = () => ((location.state as any)?.backgroundLocation ? navigate(-1) : navigate('/transactions'));
  return <section className="route-detail-modal mx-auto flex w-full max-w-3xl flex-col">
    <header className="route-modal-header flex shrink-0 items-center justify-between border-b border-neutral-800 px-5 py-4">
      <h2 className="text-lg font-bold">Transaction details</h2>
      <div className="flex items-center gap-1">
        <details className="relative">
          <summary aria-label="Transaction actions" className="flex cursor-pointer list-none items-center justify-center rounded-full p-2 text-neutral-400 hover:bg-neutral-800 [&::-webkit-details-marker]:hidden">
            <MoreHorizontal size={22}/>
          </summary>
          <div className="absolute right-0 top-full z-50 mt-2 min-w-44 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 py-1 shadow-xl">
            <button
              type="button"
              onClick={(event) => {
                const menu = event.currentTarget.closest('details');
                if (menu) menu.open = false;
                if (window.confirm('Delete this transaction? Locked statements must be unlocked first.')) {
                  deleteTransaction(txn);
                  close();
                }
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-400 hover:bg-red-950/40"
            >
              <Trash2 size={16}/> Delete transaction
            </button>
          </div>
        </details>
        <button type="button" onClick={close} aria-label="Close transaction details" className="rounded-full p-2 text-neutral-400 hover:bg-neutral-800"><X size={21}/></button>
      </div>
    </header>
    <div className="route-detail-content flex min-h-0 flex-col gap-3">
      <section className="route-detail-summary rounded-3xl border border-neutral-800 bg-neutral-900 p-5 text-center"><div className="text-sm text-neutral-400">{txn.particular || 'Expense'}</div><div className="mt-2 text-3xl font-bold tabular-nums">{money(txn.amount_minor)}</div><div className="mt-2 text-xs text-neutral-500">{day(txn.txn_at)} · {time}</div></section>
      <section className="route-detail-fields overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
        {fields.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 border-b border-neutral-800 px-4 py-3 last:border-b-0"><span className="text-sm text-neutral-400">{label}</span><span className="max-w-[65%] whitespace-pre-wrap break-words text-right text-sm font-medium">{value}</span></div>)}
        {txn.has_attachment === 1 && <div className="px-4 py-3"><a className="text-sm font-semibold text-violet-300" href={`${API}?action=transaction-attachment&id=${txn.id}`} target="_blank" rel="noreferrer">View receipt attachment</a></div>}
      </section>
    </div>
    <div className="route-detail-actions flex shrink-0 items-center justify-between gap-3">
      <button type="button" onClick={close} className="inline-flex min-h-12 min-w-32 items-center justify-center gap-2 rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm font-semibold text-neutral-200 hover:bg-neutral-700">
        <ArrowLeft size={16}/> Back
      </button>
      <ModalLink to={`/transactions/${txn.id}/edit`} className="inline-flex min-h-12 min-w-40 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white">
        <Pencil size={16}/> Edit transaction
      </ModalLink>
    </div>
  </section>;
}
