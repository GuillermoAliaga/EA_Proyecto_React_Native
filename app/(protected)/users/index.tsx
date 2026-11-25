import { Header } from '../../../src/components/layout/Header';
import { ScreenWrapper } from '../../../src/components/layout/ScreenWrapper';
import { LoadingView } from '../../../src/components/ui/StateViews';
import { useRequireRole } from '../../../src/hooks/useRequireRole';

export default function UsersScreen() {
  const isAdmin = useRequireRole(['ADMIN']);
  if (!isAdmin) return <LoadingView />;

  return (
    <ScreenWrapper>
      <Header title="Usuarios" subtitle="Administración (ADMIN)" />
    </ScreenWrapper>
  );
}
