import { useAppRouteContext } from '../../routes/route-context';
import { Navigate, useParams } from 'react-router-dom';
import { type AppRouteContext } from '../../routes/route-context';
export default function CardEditPage() {
  const { cardId } = useParams();
  const { cardsData, dataReady, pages } = useAppRouteContext<AppRouteContext>();
  const exists = cardsData?.some(card => card.id === Number(cardId));
  if (!exists && dataReady) return <Navigate to="/settings#card-management" replace />;
  if (!exists) return <div className="py-8 text-center text-sm text-neutral-500">Loading card…</div>;
  return <>{pages.cardEdit}</>;
}
