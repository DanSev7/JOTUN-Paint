import React from 'react';

const TestComponent = () => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        🎨 Tailwind CSS Test
      </h2>
      
      <div className="space-y-4">
        {/* Test basic utilities */}
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span className="text-gray-700 dark:text-gray-300">Basic utilities working ✅</span>
        </div>
        
        {/* Test custom classes */}
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Custom component classes working ✅
          </p>
        </div>
        
        {/* Test buttons */}
        <div className="flex gap-3">
          <button className="btn-primary px-4 py-2 rounded-lg">
            Primary Button
          </button>
          <button className="btn-secondary px-4 py-2 rounded-lg">
            Secondary Button
          </button>
          <button className="btn-outline px-4 py-2 rounded-lg">
            Outline Button
          </button>
        </div>
        
        {/* Test status badges */}
        <div className="flex gap-2">
          <span className="status-badge status-active">Active</span>
          <span className="status-badge status-pending">Pending</span>
          <span className="status-badge status-inactive">Inactive</span>
        </div>
        
        {/* Test role badges */}
        <div className="flex gap-2">
          <span className="role-badge role-admin">Admin</span>
          <span className="role-badge role-manager">Manager</span>
          <span className="role-badge role-viewer">Viewer</span>
        </div>
        
        {/* Test animations */}
        <div className="animate-in">
          <p className="text-green-600 dark:text-green-400">
            Animations working ✅
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestComponent; 