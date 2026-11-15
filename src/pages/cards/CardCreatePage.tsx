import { useAppRouteContext, type AppRouteContext } from '../../routes/route-context';
export default function CardCreatePage() { return <>{useAppRouteContext<AppRouteContext>().pages.cardCreate}</>; }
