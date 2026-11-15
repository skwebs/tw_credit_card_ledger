import { useAppRouteContext } from '../../routes/route-context';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { type AppRouteContext } from '../../routes/route-context';

export default function UpiAppFormPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const { appsData = [], dataReady, saveUpiApp } = useAppRouteContext<AppRouteContext>();
  const app = appId ? appsData.find(item => item.id === Number(appId)) : undefined;
  const [name, setName] = useState(app?.name || '');
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(appId);
  useEffect(() => { setName(app?.name || ''); }, [app?.id, app?.name]);
  if (isEdit && dataReady && !app) return <Navigate to="/settings" replace />;
  if (isEdit && !app) return <div className="py-8 text-center text-sm text-neutral-500">Loading UPI application…</div>;
  return <section className="mx-auto w-full max-w-xl rounded-3xl border border-neutral-800 bg-neutral-900 p-4">
    <div className="mb-4 flex items-center gap-3"><button type="button" onClick={() => navigate('/settings')} aria-label="Back to settings" className="rounded-xl p-2 text-neutral-300 hover:bg-neutral-800"><ArrowLeft size={19}/></button><div><h2 className="font-bold">{isEdit ? 'Edit UPI application' : 'Add UPI application'}</h2><p className="text-xs text-neutral-500">Manage the app name used by UPI transactions</p></div></div>
    <form className="space-y-4" onSubmit={async event => { event.preventDefault(); const value = name.trim(); if (!value) return; setSaving(true); try { const saved = await saveUpiApp(value, app?.id); if (saved) navigate('/settings'); } finally { setSaving(false); } }}>
      <label className="block"><span className="mb-2 block text-xs font-semibold text-neutral-400">Application name *</span><input required maxLength={80} autoFocus className="w-full rounded-2xl border border-neutral-700 bg-neutral-950 px-3.5 py-3 text-base text-neutral-100 outline-none focus:border-violet-400" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Google Pay"/></label>
      <div className="flex gap-2"><button type="submit" disabled={saving || !name.trim()} className="min-h-11 flex-1 rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add application'}</button><button type="button" onClick={() => navigate('/settings')} className="min-h-11 rounded-2xl border border-neutral-700 px-4 py-2.5 text-sm font-semibold">Cancel</button></div>
    </form>
  </section>;
}
