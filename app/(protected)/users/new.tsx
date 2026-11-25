import { UserForm } from '../../../src/components/domain/UserForm';
import { LoadingView } from '../../../src/components/ui/StateViews';
import { useRequireRole } from '../../../src/hooks/useRequireRole';

export default function NewUserScreen() {
  const isAdmin = useRequireRole(['ADMIN']);
  if (!isAdmin) return <LoadingView />;
  return <UserForm />;
}
