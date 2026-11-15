import { useAppRouteContext } from '../../routes/route-context';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { type AppRouteContext } from '../../routes/route-context';

export default function UpiAppDetailsPage() {
  const { appId } = useParams();
  const { appsData = [], dataReady, deactivateUpiApp } = useAppRouteContext<AppRouteContext>();
  const navigate = useNavigate();
  const app = appsData.find(item => item.id === Number(appId));
  if (!dataReady) return <p className="py-8 text-center text-sm text-neutral-500">Loading UPI application…</p>;
  if (!app) return <Navigate to="/settings" replace />;
  return <section className="mx-auto w-full max-w-xl rounded-3xl border border-neutral-800 bg-neutral-900 p-4">
    <button type="button" onClick={() => navigate('/settings')} className="mb-4 inline-flex items-center gap-2 text-sm text-neutral-400"><ArrowLeft size={16}/> Back to settings</button>
    <h2 className="text-lg font-bold">UPI application details</h2>
    <div className="mt-4 rounded-2xl bg-neutral-950 p-4"><div className="text-xs text-neutral-500">Application name</div><div className="mt-1 text-xl font-semibold">{app.name}</div><div className="mt-3 text-xs text-neutral-500">Status</div><div className={`mt-1 text-sm font-semibold ${app.active ? 'text-emerald-300' : 'text-neutral-400'}`}>{app.active ? 'Active' : 'Inactive'}</div></div>
    <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => navigate(`/upi-apps/${app.id}/edit`)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-700 text-sm"><Pencil size={15}/> Edit</button><button type="button" disabled={!app.active} onClick={() => { if (window.confirm(`Deactivate ${app.name}? Historical transactions retain the app name.`)) { deactivateUpiApp(app.id); navigate('/settings'); } }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-900 text-sm text-red-300 disabled:opacity-40"><Trash2 size={15}/> Deactivate</button></div>
  </section>;
}
