import type { Payment, Statement } from './view-types';
type Props = { [key: string]: any; payments: Payment[]; statements: Statement[] };

export default function PaymentsView(props: Props) {
  const { Empty, Metric, ModalLink, Plus, RefreshCw, Trash2, day, deletePaymentOptimistic, money, payments, statements } = props;
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-2"><Metric label="Outstanding statements" value={money(statements.reduce((n,s)=>n+s.outstanding_minor,0))} tone="amber"/><Metric label="Payments recorded" value={money(payments.reduce((n,p)=>n+p.amount_minor,0))} tone="green"/></div>
      <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Payment history</h2><ModalLink to="/payments/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16}/> Record payment</ModalLink></div>
      {payments.length===0?<Empty title="No bill payments yet" detail="Record a payment to reduce outstanding statement dues."/>:<div className="space-y-2">{payments.map(p=><div key={p.id} className="flex items-center justify-between gap-3 rounded-3xl border border-neutral-800 bg-neutral-900 p-4">
        <ModalLink to={`/payments/${p.id}`} className="min-w-0 flex-1 text-left"><div className="truncate text-sm font-semibold">{p.card_name}</div><div className="mt-1 text-xs text-neutral-500">{day(p.paid_at)}{p.reference?` · ${p.reference}`:''}</div>{p.pending?<div className="mt-1 flex items-center gap-1 text-xs text-violet-300"><RefreshCw size={12} className="animate-spin"/> Syncing payment and allocations…</div>:p.unallocated_minor>0&&<div className="mt-1 text-xs text-amber-300">Unallocated: {money(p.unallocated_minor)}</div>}</ModalLink>
        <div className="flex items-center gap-2"><span className="font-bold">{money(p.amount_minor)}</span><button aria-label="Delete payment" onClick={()=>{if(!p.pending&&confirm('Delete this payment and reverse its allocations?'))void deletePaymentOptimistic(p)}} disabled={p.pending} className="rounded-xl p-2 text-neutral-500 hover:bg-red-950 hover:text-red-300"><Trash2 size={16}/></button></div>
      </div>)}</div>}
    </>
  );
}
