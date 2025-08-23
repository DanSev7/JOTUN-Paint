import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Toast from '../components/common/Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 2000) => {
    const id = Date.now();
    const newToast = { id, message, type, duration, isVisible: true };
    
    console.log('Adding toast:', newToast);
    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message, duration = 2000) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  const showError = useCallback((message, duration = 2000) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  const showWarning = useCallback((message, duration = 2000) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);

  const showInfo = useCallback((message, duration = 2000) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  // Listen for custom showToast events
  useEffect(() => {
    const handleShowToast = (e) => {
      console.log('Received custom showToast event:', e.detail);
      addToast(e.detail.message, e.detail.type, e.detail.duration || 2000);
    };
    document.addEventListener('showToast', handleShowToast);
    return () => document.removeEventListener('showToast', handleShowToast);
  }, [addToast]);

  const value = {
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            isVisible={toast.isVisible}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};