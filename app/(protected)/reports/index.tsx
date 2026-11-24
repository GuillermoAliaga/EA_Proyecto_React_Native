import { Header } from '../../../src/components/layout/Header';
import { ScreenWrapper } from '../../../src/components/layout/ScreenWrapper';
import { EmptyView } from '../../../src/components/ui/StateViews';

export default function ReportsScreen() {
  return (
    <ScreenWrapper>
      <Header title="Denuncias" />
      <EmptyView title="Sin denuncias" description="Aquí podrás gestionar las denuncias." />
    </ScreenWrapper>
  );
}
