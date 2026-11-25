import { Header } from '../../../src/components/layout/Header';
import { ScreenWrapper } from '../../../src/components/layout/ScreenWrapper';
import { LoadingView } from '../../../src/components/ui/StateViews';
import { useRequireRole } from '../../../src/hooks/useRequireRole';

export default function ReportReviewScreen() {
  const isAdmin = useRequireRole(['ADMIN']);
  if (!isAdmin) return <LoadingView />;

  return (
    <ScreenWrapper>
      <Header title="Revisión de denuncias" />
    </ScreenWrapper>
  );
}
