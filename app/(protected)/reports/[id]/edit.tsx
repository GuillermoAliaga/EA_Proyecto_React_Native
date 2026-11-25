import { useLocalSearchParams } from 'expo-router';
import { ReportReviewForm } from '../../../../src/components/domain/ReportReviewForm';
import { LoadingView } from '../../../../src/components/ui/StateViews';
import { useRequireRole } from '../../../../src/hooks/useRequireRole';

export default function EditReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isAdmin = useRequireRole(['ADMIN']);
  if (!isAdmin || !id) return <LoadingView />;
  return <ReportReviewForm reportId={Array.isArray(id) ? id[0] : id} />;
}
