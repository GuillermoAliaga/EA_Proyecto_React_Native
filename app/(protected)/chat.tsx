import { Header } from '../../src/components/layout/Header';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { EmptyView } from '../../src/components/ui/StateViews';

export default function ChatScreen() {
  return (
    <ScreenWrapper>
      <Header title="Chat" />
      <EmptyView title="Sin conversaciones" description="Tus conversaciones aparecerán aquí." />
    </ScreenWrapper>
  );
}
