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
import React, { useEffect } from 'react';

// Layout component for authenticated pages
const AuthenticatedLayout = ({ children }) => (
  <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
    <Sidebar />
    <div className="flex-1 md:ml-64 transition-all duration-300">
      <main className="p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  </div>
);

const App = () => {
  const { user, role, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-xl font-bold text-sky-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            user ? (
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/products" element={
            user ? (
              <AuthenticatedLayout>
                <Products />
              </AuthenticatedLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/transactions" element={
            user ? (
              <AuthenticatedLayout>
                <Transactions />
              </AuthenticatedLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/suppliers" element={
            user ? (
              <AuthenticatedLayout>
                <Suppliers />
              </AuthenticatedLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/reports" element={
            user ? (
              <AuthenticatedLayout>
                <Reports />
              </AuthenticatedLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Admin only route */}
          <Route path="/user-management" element={
            user && role === 'admin' ? (
              <AuthenticatedLayout>
                <UserManagement />
              </AuthenticatedLayout>
            ) : user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
};

export default App;