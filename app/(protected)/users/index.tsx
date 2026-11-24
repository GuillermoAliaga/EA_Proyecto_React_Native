import { Redirect } from 'expo-router';
import { Header } from '../../../src/components/layout/Header';
import { ScreenWrapper } from '../../../src/components/layout/ScreenWrapper';
import { EmptyView } from '../../../src/components/ui/StateViews';
import { useAuth } from '../../../src/context/AuthContext';

export default function UsersScreen() {
  const { user } = useAuth();

  if (user?.role !== 'ADMIN') return <Redirect href="/(protected)" />;

  return (
    <ScreenWrapper>
      <Header title="Usuarios" subtitle="Administración (ADMIN)" />
      <EmptyView title="Próximamente" description="La administración estará disponible próximamente." />
    </ScreenWrapper>
  );
}
