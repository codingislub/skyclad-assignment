import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import Layout from '@/components/layout/Layout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import EnhancedImportPage from '@/pages/import/EnhancedImportPage';
import CasesPage from '@/pages/cases/CasesPage';
import CaseDetailPage from '@/pages/cases/CaseDetailPage';
import UsersPage from '@/pages/users/UsersPage';
import NotFoundPage from '@/pages/NotFoundPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, accessToken } = useAuthStore();
  
  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, accessToken } = useAuthStore();
  
  if (isAuthenticated && accessToken) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AdminRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useAuthStore();
  
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="import" element={<EnhancedImportPage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="cases/:id" element={<CaseDetailPage />} />
        <Route
          path="users"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />
      </Route>
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
