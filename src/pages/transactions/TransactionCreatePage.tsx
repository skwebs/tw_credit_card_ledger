import { useAppRouteContext, type AppRouteContext } from '../../routes/route-context';
export default function TransactionCreatePage() { return <>{useAppRouteContext<AppRouteContext>().pages.transactionCreate}</>; }
