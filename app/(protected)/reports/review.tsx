import { Redirect } from 'expo-router';
import { LoadingView } from '../../../src/components/ui/StateViews';
import { useRequireRole } from '../../../src/hooks/useRequireRole';

export default function ReportReviewRedirect() {
  const isAdmin = useRequireRole(['ADMIN']);
  if (!isAdmin) return <LoadingView />;
  return <Redirect href="/(protected)/reports" />;
}
