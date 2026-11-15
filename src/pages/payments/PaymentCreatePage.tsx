import { useAppRouteContext, type AppRouteContext } from '../../routes/route-context';
export default function PaymentCreatePage() { return <>{useAppRouteContext<AppRouteContext>().pages.paymentCreate}</>; }
