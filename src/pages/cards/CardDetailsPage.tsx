import { useAppRouteContext, type AppRouteContext } from '../../routes/route-context';

/** Card detail route. The shared shell selects the requested card from the URL. */
export default function CardDetailsPage() {
  const { pages } = useAppRouteContext<AppRouteContext>();
  return <>{pages.card}</>;
}
