import { Header } from '../../../src/components/layout/Header';
import { ScreenWrapper } from '../../../src/components/layout/ScreenWrapper';
import { EmptyView } from '../../../src/components/ui/StateViews';

export default function ActivitiesScreen() {
  return (
    <ScreenWrapper>
      <Header title="Actividades" />
      <EmptyView title="Aún no hay actividades" description="El listado estará disponible próximamente." />
    </ScreenWrapper>
  );
}
