import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Sidebar from './components/common/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Transactions from './pages/Transactions';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';

import { ToastProvider } from './contexts/ToastContext';
import { useAuthStore } from './store/useAuthStore';

// Authenticated layout for protected pages
const AuthenticatedLayout = ({ children }) => (
  <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
    <Sidebar />
    <div className="flex-1 md:ml-64 transition-all duration-300">
      <main className="p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  </div>
);

// Reusable protected route
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, role } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
};

const App = () => {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
    // eslint-disable-next-line
  }, []);

  // Loading screen
  if (loading) {
    return (
      <ToastProvider>
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
          <div className="text-2xl font-bold text-sky-600 animate-pulse">Loading...</div>
        </div>
      </ToastProvider>
    );
  }

  // Route config
  const routes = [
    { path: '/dashboard', component: <Dashboard /> },
    { path: '/products', component: <Products /> },
    { path: '/transactions', component: <Transactions /> },
    { path: '/suppliers', component: <Suppliers /> },
    { path: '/reports', component: <Reports /> },
    { path: '/user-management', component: <UserManagement />, adminOnly: true },
  ];

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          {routes.map(({ path, component, adminOnly }) => (
            <Route
              key={path}
              path={path}
              element={<ProtectedRoute adminOnly={adminOnly}>{component}</ProtectedRoute>}
            />
          ))}

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
};

export default App;
