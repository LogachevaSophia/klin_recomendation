import { Navigate, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/authStore';

type Props = { children: React.ReactNode };

export const ProtectedRoute = observer(({ children }: Props) => {
  const location = useLocation();
  if (!authStore.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
});
