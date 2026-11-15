import { useAppRouteContext } from '../../routes/route-context';
import { Navigate, useParams } from 'react-router-dom';
import { type AppRouteContext } from '../../routes/route-context';
export default function TransactionEditPage() {
  const { transactionId } = useParams();
  const { txns, dataReady, pages } = useAppRouteContext<AppRouteContext>();
  const exists = txns.some(txn => txn.id === Number(transactionId));
  if (!exists && dataReady) return <Navigate to="/transactions" replace />;
  if (!exists) return <div className="py-8 text-center text-sm text-neutral-500">Loading transaction…</div>;
  return <>{pages.transactionEdit}</>;
}
