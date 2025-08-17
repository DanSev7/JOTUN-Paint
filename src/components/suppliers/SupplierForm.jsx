import React, { useState } from 'react';
import { X, Save, User, Mail, Phone, MapPin, Loader2, Trash2 } from 'lucide-react';
import supabase from '../../services/supabase';
import Button from '../common/Button';
import Input from '../common/Input';

const SupplierForm = ({ onClose, supplier = null, onSave }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contact_person: supplier?.contact_person || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isEdit = !!supplier;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let resp;
      if (isEdit) {
        resp = await supabase
          .from('suppliers')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', supplier.id);
      } else {
        resp = await supabase
          .from('suppliers')
          .insert([{ ...formData, created_at: new Date().toISOString() }]);
      }
      if (resp.error) throw resp.error;
      if (onSave) onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await supabase.from('suppliers').delete().eq('id', supplier.id);
      if (resp.error) throw resp.error;
      if (onSave) onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete supplier');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isEdit ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {isEdit ? 'Update supplier information' : 'Enter supplier details to add to your system'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Input
                label="Supplier Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                icon={<User className="w-5 h-5" />}
                placeholder="Enter supplier company name"
                required
              />
              
              <Input
                label="Contact Person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                icon={<User className="w-5 h-5" />}
                placeholder="Enter contact person name"
                required
              />
              
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                icon={<Mail className="w-5 h-5" />}
                placeholder="supplier@company.com"
                required
              />
              
              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                icon={<Phone className="w-5 h-5" />}
                placeholder="+1 (555) 123-4567"
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-4 text-gray-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter complete address"
                    rows={3}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
              <div>
                {isEdit && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                    icon={<Trash2 className="w-4 h-4" />}
                    className="px-4 py-2"
                  >
                    Delete
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose} 
                  disabled={loading}
                  className="px-6 py-2"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  loading={loading} 
                  icon={<Save className="w-4 h-4" />}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {isEdit ? 'Update Supplier' : 'Add Supplier'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                Delete Supplier
              </h3>
              
              <p className="mb-8 text-gray-600 dark:text-gray-400 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{supplier?.name}</span>? 
                This action cannot be undone and will remove all associated data.
              </p>
              
              <div className="flex justify-center gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(false)} 
                  disabled={loading}
                  className="px-6 py-2"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  variant="danger" 
                  onClick={handleDelete} 
                  loading={loading}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                >
                  {loading ? 'Deleting...' : 'Delete Supplier'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierForm;