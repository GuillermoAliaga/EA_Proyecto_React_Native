import { Header } from '../../src/components/layout/Header';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { EmptyView } from '../../src/components/ui/StateViews';

export default function HomeScreen() {
  return (
    <ScreenWrapper>
      <Header title="Inicio" subtitle="Tu espacio para organizar actividades" />
      <EmptyView title="Próximamente" description="Aquí aparecerá tu actividad reciente." />
    </ScreenWrapper>
  );
}
