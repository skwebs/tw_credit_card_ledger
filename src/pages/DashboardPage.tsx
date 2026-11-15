import { useAppRouteContext, type AppRouteContext } from '../routes/route-context';

/** Dashboard route. AppShell owns the shared application state and dashboard view model. */
export default function DashboardPage() {
  const { pages } = useAppRouteContext<AppRouteContext>();
  return <>{pages.dashboard}</>;
}
