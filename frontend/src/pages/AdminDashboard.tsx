import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import * as userService from '../services/userService';
import { generateInvoice } from '../services/invoiceService';
import { User, UserCreate, UserUpdate } from '../types/auth';
import { Users, UserPlus, Edit2, Trash2, ShieldAlert, CheckCircle, XCircle, FileText, TrendingUp, Search } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Selected user for edit/delete
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isActive, setIsActive] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const clearForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('user');
    setIsActive(true);
    setSelectedUser(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const payload: UserCreate = { username, email, password, role };
      await userService.createUser(payload);
      setSuccessMsg(`User '${username}' created successfully!`);
      setShowCreateModal(false);
      clearForm();
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setUsername(user.username);
    setEmail(user.email);
    setPassword(''); // leave blank if not updating password
    setRole(user.role);
    setIsActive(user.is_active);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError('');
    setSuccessMsg('');
    
    try {
      const payload: UserUpdate = { username, email, role, is_active: isActive };
      if (password) {
        payload.password = password;
      }
      await userService.updateUser(selectedUser.id, payload);
      setSuccessMsg(`User '${username}' updated successfully!`);
      setShowEditModal(false);
      clearForm();
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setError('');
    setSuccessMsg('');
    
    try {
      await userService.deleteUser(selectedUser.id);
      setSuccessMsg(`User '${selectedUser.username}' deleted successfully!`);
      setShowDeleteModal(false);
      clearForm();
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleGenerateInvoice = async (userId: number, name: string) => {
    setError('');
    setSuccessMsg('');
    try {
      await generateInvoice(userId);
      setSuccessMsg(`Invoice generated successfully for user '${name}'!`);
    } catch (err: any) {
      setError(err.response?.data?.detail || `No unbilled searches found for '${name}'`);
    }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800/60 pb-6 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">User Administration</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage user credentials, database roles, and invoice generation metrics.</p>
          </div>
          <button
            onClick={() => { clearForm(); setShowCreateModal(true); }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-slate-900 dark:text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <UserPlus size={18} />
            <span>Create New User</span>
          </button>
        </div>

        {/* Success/Error Alerts */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-sm font-medium animate-fade-in flex items-center space-x-2">
            <CheckCircle size={18} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-sm font-medium animate-fade-in flex items-center space-x-2">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass dark:glass rounded-2xl p-6 flex items-center space-x-5">
            <div className="p-4 rounded-xl bg-blue-500/10 text-blue-400">
              <Users size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-widest font-semibold">Total Accounts</span>
              <p className="text-3xl font-extrabold tracking-tight mt-1">{totalUsers}</p>
            </div>
          </div>

          <div className="glass dark:glass rounded-2xl p-6 flex items-center space-x-5">
            <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-widest font-semibold">Active Sessions</span>
              <p className="text-3xl font-extrabold tracking-tight mt-1">{activeUsers}</p>
            </div>
          </div>

          <div className="glass dark:glass rounded-2xl p-6 flex items-center space-x-5">
            <div className="p-4 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-widest font-semibold">Administrator Accounts</span>
              <p className="text-3xl font-extrabold tracking-tight mt-1">{adminUsers}</p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <LoadingSpinner message="Retrieving user database..." />
        ) : (
          <div className="glass dark:glass rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-4 px-6">Username</th>
                    <th className="py-4 px-6">Email Address</th>
                    <th className="py-4 px-6 text-center">System Role</th>
                    <th className="py-4 px-6 text-center">Account Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-100 dark:bg-slate-800/10 transition-colors duration-200">
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm">{item.username}</td>
                      <td className="py-4 px-6 text-slate-800 dark:text-slate-400 text-sm">{item.email}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          item.role === 'admin' ? 'bg-purple-950/40 text-purple-400 border border-purple-800/60' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center space-x-1.5">
                          {item.is_active ? (
                            <>
                              <CheckCircle size={14} className="text-emerald-500" />
                              <span className="text-xs text-emerald-400 font-semibold">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={14} className="text-red-500" />
                              <span className="text-xs text-red-400 font-semibold">Suspended</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => handleGenerateInvoice(item.id, item.username)}
                            className="flex items-center space-x-1 px-3 py-1 rounded bg-blue-500/10 border border-blue-800/40 text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-all cursor-pointer"
                            title="Generate Invoice"
                          >
                            <FileText size={13} />
                            <span>Bill</span>
                          </button>
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:bg-slate-800 rounded transition-all cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: Create User */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md glass dark:glass rounded-2xl p-6 border border-slate-300 dark:border-slate-700/50 shadow-2xl animate-slide-up">
              <h3 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">Create New Account</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary text-slate-700 dark:text-slate-300"
                  >
                    <option value="user">User (Standard Access)</option>
                    <option value="admin">Admin (Full Control)</option>
                  </select>
                </div>
                <div className="flex items-center justify-end space-x-3 mt-6 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-white dark:bg-slate-900 text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-primary text-slate-900 dark:text-white text-sm font-bold hover:opacity-90 cursor-pointer"
                  >
                    Save User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Edit User */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md glass dark:glass rounded-2xl p-6 border border-slate-300 dark:border-slate-700/50 shadow-2xl animate-slide-up">
              <h3 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">Edit User Account</h3>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    Password <span className="text-[10px] text-slate-500 dark:text-slate-500 lowercase">(leave empty to keep current)</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary text-slate-700 dark:text-slate-300"
                  >
                    <option value="user">User (Standard Access)</option>
                    <option value="admin">Admin (Full Control)</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3 py-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-slate-200 dark:border-slate-800 text-primary focus:ring-primary w-4 h-4 bg-white dark:bg-slate-900"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Account Enabled (Active)
                  </label>
                </div>
                <div className="flex items-center justify-end space-x-3 mt-6 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); clearForm(); }}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-white dark:bg-slate-900 text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-primary text-slate-900 dark:text-white text-sm font-bold hover:opacity-90 cursor-pointer"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Delete User Confirmation */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm glass dark:glass rounded-2xl p-6 border border-red-900/30 shadow-2xl animate-slide-up">
              <div className="flex items-center space-x-3 text-red-500 mb-4">
                <ShieldAlert size={32} />
                <h3 className="text-lg font-bold">Delete Account?</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Are you sure you want to delete user '<span className="text-slate-800 dark:text-slate-200 font-bold">{selectedUser?.username}</span>'? This action is permanent and will delete their entire query history.
              </p>
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-white dark:bg-slate-900 text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-slate-900 dark:text-white text-sm font-bold cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
