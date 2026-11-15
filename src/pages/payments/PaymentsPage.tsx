import { useAppRouteContext, type AppRouteContext } from '../../routes/route-context';

/** Payment collection route. */
export default function PaymentsPage() {
  const { pages } = useAppRouteContext<AppRouteContext>();
  return <>{pages.payments}</>;
}
