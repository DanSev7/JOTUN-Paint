import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'store_manager', label: 'Store Manager' },
  { value: 'viewer', label: 'Viewer' },
];

export default function UserForm({ initialUser, onSubmit, onCancel, loading }) {
  const [username, setUsername] = useState(initialUser?.username || '');
  const [role, setRole] = useState(initialUser?.role || 'viewer');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!initialUser;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return setError('username is required');
    if (!isEdit && !password) return setError('Password is required for new users');
    setError('');
    onSubmit({ username, role, password: password || undefined, id: initialUser?.id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      <div>
        <label className="block font-semibold text-sm mb-1 text-gray-700 dark:text-gray-300">Username</label>
        <input
          className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          value={username}
          onChange={e => setUsername(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block font-semibold text-sm mb-1 text-gray-700 dark:text-gray-300">Role</label>
        <select
          className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          value={role}
          onChange={e => setRole(e.target.value)}
          disabled={loading}
        >
          {roles.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold text-sm mb-1 text-gray-700 dark:text-gray-300">
          {isEdit ? 'New Password (optional)' : 'Password'}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className="w-full p-2 pr-10 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          {isEdit ? 'Update User' : 'Add User'}
        </button>
      </div>
    </form>
  );
}