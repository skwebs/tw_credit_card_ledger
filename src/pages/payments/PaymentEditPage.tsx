import { useAppRouteContext } from '../../routes/route-context';
import { Navigate, useParams } from 'react-router-dom';
import { type AppRouteContext } from '../../routes/route-context';
export default function PaymentEditPage() {
  const { paymentId } = useParams();
  const { paymentsData, dataReady, pages } = useAppRouteContext<AppRouteContext>();
  const exists = paymentsData.some(payment => payment.id === Number(paymentId));
  if (!exists && dataReady) return <Navigate to="/payments" replace />;
  if (!exists) return <div className="py-8 text-center text-sm text-neutral-500">Loading payment…</div>;
  return <>{pages.paymentEdit}</>;
}
