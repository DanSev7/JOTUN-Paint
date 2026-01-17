// import React, { useState, useEffect } from 'react';
// import { Plus, Edit, Trash2, Phone, Mail, MapPin, Search, User, Building2, Calendar, Users, TrendingUp } from 'lucide-react';
// import Button from '../components/common/Button';
// import Input from '../components/common/Input';
// import SupplierForm from '../components/suppliers/SupplierForm';
// import supabase from '../services/supabase';
// import { useToast } from '../contexts/ToastContext';

// const Suppliers = () => {
//   const { showSuccess, showError } = useToast();
//   const [showForm, setShowForm] = useState(false);
//   const [editSupplier, setEditSupplier] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [suppliers, setSuppliers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Fetch suppliers from Supabase
//   const fetchSuppliers = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data, error } = await supabase
//         .from('suppliers')
//         .select('*')
//         .order('created_at', { ascending: false });
//       if (error) throw error;
//       setSuppliers(data || []);
//     } catch (err) {
//       setError(err.message || 'Failed to fetch suppliers');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchSuppliers();
//   }, []);

//   const filteredSuppliers = suppliers.filter(supplier =>
//     supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleAdd = () => {
//     setEditSupplier(null);
//     setShowForm(true);
//   };

//   const handleEdit = (supplier) => {
//     setEditSupplier(supplier);
//     setShowForm(true);
//   };

//   const handleFormSave = () => {
//     setShowForm(false);
//     setEditSupplier(null);
//     fetchSuppliers();
//     showSuccess('Supplier saved successfully');
//   };

//   const handleDelete = async (supplier) => {
//     if (!window.confirm('Are you sure you want to delete this supplier?')) return;
//     setLoading(true);
//     try {
//       const { error } = await supabase.from('suppliers').delete().eq('id', supplier.id);
//       if (error) throw error;
//       fetchSuppliers();
//       showSuccess('Supplier deleted successfully');
//     } catch (err) {
//       showError(err.message || 'Failed to delete supplier');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getSupplierStats = () => {
//     const stats = {
//       total: suppliers.length,
//       thisMonth: suppliers.filter(supplier => {
//         const created = new Date(supplier.created_at);
//         const now = new Date();
//         return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
//       }).length,
//       active: suppliers.length, // Assuming all are active for now
//     };
//     return stats;
//   };

//   const getSupplierInitials = (name) => {
//     return name?.split(' ')
//       .map(word => word.charAt(0))
//       .join('')
//       .toUpperCase()
//       .slice(0, 2) || 'S';
//   };

//   const getAvatarColor = (name) => {
//     const colors = [
//       'bg-gradient-to-br from-purple-400 to-purple-600',
//       'bg-gradient-to-br from-blue-400 to-blue-600',
//       'bg-gradient-to-br from-green-400 to-green-600',
//       'bg-gradient-to-br from-yellow-400 to-yellow-600',
//       'bg-gradient-to-br from-red-400 to-red-600',
//       'bg-gradient-to-br from-indigo-400 to-indigo-600',
//       'bg-gradient-to-br from-pink-400 to-pink-600',
//       'bg-gradient-to-br from-teal-400 to-teal-600',
//     ];
//     return colors[(name?.length || 0) % colors.length];
//   };

//   const stats = getSupplierStats();

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
//       <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-8">
//         {/* Header Section */}
//         <div className="mb-8">
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//             <div>
//               <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
//                 Suppliers Management
//               </h1>
//               <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
//                 Manage your paint suppliers and maintain strong partnerships
//               </p>
//             </div>
//             <Button
//               className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3"
//               icon={<Plus className="w-5 h-5" />}
//               onClick={handleAdd}
//             >
//               Add New Supplier
//             </Button>
//           </div>

//           {/* Stats Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
//             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
//               <div className="flex items-center">
//                 <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
//                   <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
//                 </div>
//                 <div className="ml-4">
//                   <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Suppliers</p>
//                   <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
//                 </div>
//               </div>
//             </div>
            
//             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
//               <div className="flex items-center">
//                 <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
//                   <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
//                 </div>
//                 <div className="ml-4">
//                   <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Suppliers</p>
//                   <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
//                 </div>
//               </div>
//             </div>
            
//             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
//               <div className="flex items-center">
//                 <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
//                   <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
//                 </div>
//                 <div className="ml-4">
//                   <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Added This Month</p>
//                   <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.thisMonth}</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Search Section */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//             <input
//               type="text"
//               placeholder="Search suppliers by name, contact person, or email..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
//             />
//           </div>
//         </div>

//         {/* Loading/Error State */}
//         {loading && (
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//             <p className="text-gray-500 dark:text-gray-400 text-lg">Loading suppliers...</p>
//           </div>
//         )}

//         {error && (
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
//             <div className="text-red-500 text-lg">{error}</div>
//           </div>
//         )}

//         {/* Suppliers Grid */}
//         {!loading && !error && (
//           <>
//             {filteredSuppliers.length === 0 ? (
//               <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
//                 <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
//                 <p className="text-gray-500 dark:text-gray-400 text-lg">
//                   {searchTerm ? 'No suppliers found matching your search.' : 'No suppliers found. Add your first supplier to get started.'}
//                 </p>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//                 {filteredSuppliers.map((supplier) => (
//                   <div key={supplier.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden">
//                     {/* Card Header */}
//                     <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-3">
//                           <div className={`h-12 w-12 rounded-full ${getAvatarColor(supplier.name)} flex items-center justify-center shadow-md`}>
//                             <span className="text-white font-bold text-sm">
//                               {getSupplierInitials(supplier.name)}
//                             </span>
//                           </div>
//                           <div>
//                             <h3 className="text-lg font-bold text-gray-900 dark:text-white">
//                               {supplier.name}
//                             </h3>
//                             <p className="text-sm text-gray-600 dark:text-gray-400">
//                               {supplier.contact_person}
//                             </p>
//                           </div>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <button
//                             className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-150"
//                             onClick={() => handleEdit(supplier)}
//                             title="Edit supplier"
//                           >
//                             <Edit className="w-4 h-4" />
//                           </button>
//                           <button
//                             onClick={() => handleDelete(supplier)}
//                             className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-150"
//                             title="Delete supplier"
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Card Content */}
//                     <div className="p-6">
//                       <div className="space-y-4">
//                         <div className="flex items-center gap-3">
//                           <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
//                             <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
//                             <p className="text-sm text-gray-900 dark:text-white truncate">{supplier.email}</p>
//                           </div>
//                         </div>

//                         <div className="flex items-center gap-3">
//                           <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
//                             <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
//                             <p className="text-sm text-gray-900 dark:text-white">{supplier.phone}</p>
//                           </div>
//                         </div>

//                         <div className="flex items-start gap-3">
//                           <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
//                             <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
//                             <p className="text-sm text-gray-900 dark:text-white line-clamp-2">{supplier.address}</p>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Card Footer */}
//                       <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
//                         <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
//                           <Calendar className="w-3 h-3" />
//                           <span>
//                             Added: {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString('en-US', {
//                               year: 'numeric',
//                               month: 'short',
//                               day: 'numeric'
//                             }) : '-'}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}

//         {/* Add/Edit Supplier Modal */}
//         {showForm && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//             <SupplierForm
//               onClose={() => { setShowForm(false); setEditSupplier(null); }}
//               supplier={editSupplier}
//               onSave={handleFormSave}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // Enhanced Supplier Form Component
// const SupplierForms = ({ onClose, supplier = null, onSave }) => {
//   const [formData, setFormData] = useState({
//     name: supplier?.name || '',
//     contact_person: supplier?.contact_person || '',
//     email: supplier?.email || '',
//     phone: supplier?.phone || '',
//     address: supplier?.address || ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);
//     try {
//       let resp;
//       if (supplier) {
//         // Edit
//         resp = await supabase
//           .from('suppliers')
//           .update({ ...formData, updated_at: new Date().toISOString() })
//           .eq('id', supplier.id);
//       } else {
//         // Add
//         resp = await supabase
//           .from('suppliers')
//           .insert([{ ...formData, created_at: new Date().toISOString() }]);
//       }
//       if (resp.error) throw resp.error;
//       if (onSave) onSave();
//       onClose();
//     } catch (err) {
//       setError(err.message || 'Failed to save supplier');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-hidden">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
//               <Building2 className="w-6 h-6 text-white" />
//             </div>
//             <div>
//               <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
//                 {supplier ? 'Edit Supplier' : 'Add New Supplier'}
//               </h2>
//               <p className="text-gray-600 dark:text-gray-400 mt-1">
//                 {supplier ? 'Update supplier information and contact details' : 'Create a new supplier partnership'}
//               </p>
//             </div>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-150"
//           >
//             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>
//       </div>

//       <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
//         {error && (
//           <div className="mb-6 flex items-center gap-3 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 border border-red-200 dark:border-red-700">
//             <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//               <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//             </svg>
//             <span className="text-sm font-medium">{error}</span>
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             <div className="lg:col-span-2">
//               <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
//                 <Building2 className="w-4 h-4" />
//                 Supplier Name *
//               </label>
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 required
//                 className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
//                 placeholder="e.g., Jotun Paints International"
//               />
//             </div>

//             <div>
//               <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
//                 <User className="w-4 h-4" />
//                 Contact Person *
//               </label>
//               <input
//                 type="text"
//                 name="contact_person"
//                 value={formData.contact_person}
//                 onChange={handleChange}
//                 required
//                 className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
//                 placeholder="e.g., John Smith"
//               />
//             </div>

//             <div>
//               <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
//                 <Mail className="w-4 h-4" />
//                 Email Address *
//               </label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 required
//                 className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
//                 placeholder="e.g., contact@jotun.com"
//               />
//             </div>

//             <div className="lg:col-span-2">
//               <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
//                 <Phone className="w-4 h-4" />
//                 Phone Number
//               </label>
//               <input
//                 type="tel"
//                 name="phone"
//                 value={formData.phone}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
//                 placeholder="e.g., +1 (555) 123-4567"
//               />
//             </div>

//             <div className="lg:col-span-2">
//               <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
//                 <MapPin className="w-4 h-4" />
//                 Address
//               </label>
//               <textarea
//                 name="address"
//                 value={formData.address}
//                 onChange={handleChange}
//                 rows={3}
//                 className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors resize-none"
//                 placeholder="Enter complete address including city, state, and postal code..."
//               />
//             </div>
//           </div>

//           {/* Form Actions */}
//           <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-150"
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
//               disabled={loading}
//             >
//               {loading ? (
//                 <span className="flex items-center gap-2">
//                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                   {supplier ? 'Updating...' : 'Adding...'}
//                 </span>
//               ) : (
//                 <>
//                   <Building2 className="w-4 h-4" />
//                   {supplier ? 'Update Supplier' : 'Add Supplier'}
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Suppliers;