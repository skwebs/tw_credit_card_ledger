import { useAppRouteContext } from '../../routes/route-context';
import ModalLink from '../../routes/ModalLink';
import { Link } from 'react-router-dom';
import { CreditCard, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import type { AppRouteContext, RouteCard } from '../../routes/route-context';

const money = (minor?: number | null) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format((Number(minor) || 0) / 100);

export default function CardsPage() {
  const { cardsData = [], deleteCard, dataReady } = useAppRouteContext<AppRouteContext>();
  const cards = cardsData.filter(card => card.active === 1);
  return <section className="mx-auto w-full max-w-3xl">
    <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Credit cards</h2><p className="text-xs text-neutral-500">Manage cards, billing settings and card details</p></div><ModalLink to="/cards/new" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white"><Plus size={16}/> Add card</ModalLink></div>
    {!dataReady ? <p className="py-8 text-center text-sm text-neutral-500">Loading cards…</p> : cards.length === 0 ? <div className="rounded-3xl border border-dashed border-neutral-800 p-8 text-center"><CreditCard size={26} className="mx-auto mb-3 text-neutral-500"/><p className="font-semibold">No active cards</p><p className="mt-1 text-sm text-neutral-500">Add a credit card to start tracking expenses and dues.</p></div> : <div className="space-y-2">{cards.map(card => <CardRow key={card.id} card={card} onOpen={`/cards/${card.id}`} onEdit={`/cards/${card.id}/edit`} onDelete={() => deleteCard(card)}/>)}</div>}
  </section>;
}

function CardRow({card,onOpen,onEdit,onDelete}:{card:RouteCard;onOpen:string;onEdit:string;onDelete:()=>void}) {
  return <article className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3"><div className="flex items-center gap-3"><Link to={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600/15 text-violet-200"><CreditCard size={20}/></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{card.name}</span><span className="mt-0.5 block truncate text-xs text-neutral-500">{card.bank_name}{card.last4 ? ` · •••• ${card.last4}` : ''}</span></span><ChevronRight size={18} className="shrink-0 text-neutral-500"/></Link><ModalLink to={onEdit} aria-label={`Edit ${card.name}`} className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-800"><Pencil size={16}/></ModalLink><button type="button" onClick={onDelete} aria-label={`Delete or archive ${card.name}`} className="rounded-xl p-2 text-neutral-500 hover:bg-red-950 hover:text-red-300"><Trash2 size={16}/></button></div><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl bg-neutral-800 p-2"><div className="text-[10px] text-neutral-400">Previous dues</div><div className="mt-1 text-sm font-bold">{money(card.dues_minor)}</div></div><div className="rounded-xl bg-neutral-800 p-2"><div className="text-[10px] text-neutral-400">Current cycle</div><div className="mt-1 text-sm font-bold">{money(card.current_minor)}</div></div></div></article>;
}
