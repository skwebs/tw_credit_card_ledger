import { useAppRouteContext, type AppRouteContext } from '../routes/route-context';

/** Settings route. */
export default function SettingsPage() {
  const { pages } = useAppRouteContext<AppRouteContext>();
  return <>{pages.settings}</>;
}
