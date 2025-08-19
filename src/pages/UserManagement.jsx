import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Shield, User, Users, Search, Calendar, UserCheck } from 'lucide-react';
import bcrypt from 'bcryptjs';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import UserForm from '../components/userManagement/UserForm';
import { useToast } from '../contexts/ToastContext';
import supabase from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore'; // Updated to use the correct store

const roleMap = {
  admin: 'Admin',
  store_manager: 'Store Manager',
  viewer: 'Viewer',
};

const UserManagement = () => {
  // Use the zustand store to get the user's role and loading status
  const { role, loading: authLoading } = useAuthStore(); // Updated to use role instead of userRole

  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, role, created_at');
    console.log("role", role);
    if (error) {
      setError('Failed to fetch users');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Only fetch users after the auth state has been determined
    if (!authLoading) {
      fetchUsers();
    }
  }, [authLoading]); // Rerun effect when authLoading state changes

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'store_manager':
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-green-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 dark:from-red-900/20 dark:to-red-800/20 dark:text-red-300 dark:border-red-700/30';
      case 'store_manager':
        return 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 dark:text-blue-300 dark:border-blue-700/30';
      case 'viewer':
        return 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200 dark:from-green-900/20 dark:to-green-800/20 dark:text-green-300 dark:border-green-700/30';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200 dark:from-gray-900/20 dark:to-gray-800/20 dark:text-gray-300 dark:border-gray-700/30';
    }
  };

  const getAvatarColor = (username) => {
    const colors = [
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
      'bg-gradient-to-br from-red-400 to-red-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-teal-400 to-teal-600',
    ];
    return colors[username.length % colors.length];
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    roleMap[user.role]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const { error } = await supabase.from('user_profiles').delete().eq('id', userId);
      if (error) {
        showError('Failed to delete user');
      } else {
        setUsers(prev => prev.filter(user => user.id !== userId));
        showSuccess('User deleted successfully');
      }
    }
  };

  const handleUserFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (editUser) {
        // Editing user
        const updateFields = {
          username: formData.username,
          role: formData.role,
        };
        if (formData.password) {
          updateFields.password = await bcrypt.hash(formData.password, 10);
        }
        const { error } = await supabase
          .from('user_profiles')
          .update(updateFields)
          .eq('id', editUser.id);
        if (error) throw error;
        showSuccess('User updated');
      } else {
        // Adding user
        const hashed = await bcrypt.hash(formData.password, 10);
        const { error } = await supabase.from('user_profiles').insert([
          {
            username: formData.username,
            role: formData.role,
            password: hashed,
            created_at: new Date().toISOString(),
          },
        ]);
        if (error) throw error;
        showSuccess('User added');
      }

      setShowForm(false);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      showError(err.message || 'Failed to save user');
    } finally {
      setFormLoading(false);
    }
  };

  const getRoleStats = () => {
    const stats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    return stats;
  };

  const roleStats = getRoleStats();
  const isLoading = loading || authLoading;

  return (
    <div className="md:ml-4 min-h-screen overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6 space-y-6">
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                JOTUN Paint User Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                Manage system users and their roles with ease
              </p>
            </div>
            {/* Show Add User button only if the current user is an admin */}
            {role === 'admin' && (
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3"
                icon={<Plus className="w-5 h-5" />}
                onClick={() => {
                  setEditUser(null);
                  setShowForm(true);
                }}
              >
                Add New User
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                  <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admins</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{roleStats.admin || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{roleStats.store_manager || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                  <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Viewers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{roleStats.viewer || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-red-500 text-lg">{error}</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {searchTerm ? 'No users found matching your search.' : 'No users found.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    {/* Only show Actions column if the current user is an admin */}
                    {role === 'admin' && (
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-12 w-12 rounded-full ${getAvatarColor(user.username)} flex items-center justify-center shadow-md`}>
                            <span className="text-white font-semibold text-lg">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {user.username}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              User #{index + 1}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRoleIcon(user.role)}
                          <span className={`ml-2 px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                            {roleMap[user.role] || user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(user.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      {/* Only show actions if the current user is an admin */}
                      {role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => {
                                setEditUser(user);
                                setShowForm(true);
                              }}
                              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-150"
                              title="Edit user"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-150"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editUser ? 'Edit User' : 'Add New User'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {editUser ? 'Update user information and role' : 'Create a new user account'}
                </p>
              </div>
              <div className="p-6">
                <UserForm
                  initialUser={editUser}
                  onSubmit={handleUserFormSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditUser(null);
                  }}
                  loading={formLoading}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
