import { ActivityForm } from '../../../src/components/domain/ActivityForm';
import { LoadingView } from '../../../src/components/ui/StateViews';
import { useRequireRole } from '../../../src/hooks/useRequireRole';

export default function NewActivityScreen() {
  const canCreate = useRequireRole(['ADMIN', 'STORE_HOST']);
  return canCreate ? <ActivityForm /> : <LoadingView />;
}
