import { useAppRouteContext, type AppRouteContext } from '../routes/route-context';

/** Transaction collection route. */
export default function TransactionsPage() {
  const { pages } = useAppRouteContext<AppRouteContext>();
  return <>{pages.transactions}</>;
}
