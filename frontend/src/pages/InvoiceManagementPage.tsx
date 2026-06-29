import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import * as userService from '../services/userService';
import * as invoiceService from '../services/invoiceService';
import { getMyHistory, getUserHistory } from '../services/historyService'; 
import { User } from '../types/auth';
import { Invoice } from '../types/invoice';
import { FileText, Download, CheckCircle, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const InvoiceManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Stats for selected user
  const [unbilledCount, setUnbilledCount] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const uList = await userService.getUsers();
      // Filter out admin users since we only charge standard users
      const standardUsers = uList.filter(u => u.role !== 'admin');
      setUsers(standardUsers);
      
      const invList = await invoiceService.getInvoices();
      setInvoices(invList);
      
      if (standardUsers.length > 0 && !selectedUser) {
        handleUserSelect(standardUsers[0], invList);
      } else if (selectedUser) {
        // Refresh selected user stats
        const activeUser = standardUsers.find(u => u.id === selectedUser.id) || null;
        if (activeUser) {
          handleUserSelect(activeUser, invList);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load invoice registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUserSelect = async (user: User, currentInvoices = invoices) => {
    setSelectedUser(user);
    setError('');
    setSuccess('');
    try {
      // Find unbilled searches count.
      // We look at all searches, and filter out those prior to the last invoice date.
      const userInvoices = currentInvoices.filter(inv => inv.user_id === user.id);
      
      // We need user's search history
      // Note: we fetch user's history list
      // Import user history service
      // Removed dynamic import, using static import
      const history = await getUserHistory(user.id);
      
      if (userInvoices.length > 0) {
        // Sort user invoices descending
        const sortedInvoices = [...userInvoices].sort(
          (a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime()
        );
        const lastInvoiceDate = new Date(sortedInvoices[0].invoice_date);
        
        // Count searches that occurred after the last invoice
        const unbilled = history.filter(item => new Date(item.searched_at).getTime() > lastInvoiceDate.getTime());
        setUnbilledCount(unbilled.length);
      } else {
        // No invoice generated yet, so all searches are unbilled
        setUnbilledCount(history.length);
      }
    } catch (err) {
      console.error(err);
      setUnbilledCount(0);
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await invoiceService.generateInvoice(selectedUser.id);
      setSuccess(`Successfully generated Invoice ${res.invoice.invoice_number} (₹${res.invoice.amount}) for user ${selectedUser.username}!`);
      
      // Reload invoices and recalculate
      const invList = await invoiceService.getInvoices();
      setInvoices(invList);
      handleUserSelect(selectedUser, invList);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate invoice. Make sure user has unbilled searches.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async (id: number, invNum: string) => {
    setError('');
    setSuccess('');
    try {
      await invoiceService.downloadInvoicePdf(id, invNum);
      setSuccess(`Invoice ${invNum} downloaded successfully.`);
    } catch (err: any) {
      setError('Failed to download invoice PDF.');
    }
  };

  const handleTogglePaid = async (id: number, currentPaidStatus: boolean) => {
    try {
      const updatedInvoice = await invoiceService.markInvoiceAsPaid(id, !currentPaidStatus);
      setInvoices(prev => prev.map(inv => inv.id === id ? updatedInvoice : inv));
      setSuccess(`Invoice ${updatedInvoice.invoice_number} marked as ${updatedInvoice.is_paid ? 'PAID' : 'UNPAID'}.`);
    } catch (err: any) {
      setError('Failed to update invoice payment status.');
    }
  };

  const getUserNameById = (userId: number) => {
    // Check if the user is in standard list
    const found = users.find(u => u.id === userId);
    return found ? found.username : `User ID ${userId}`;
  };

  const billingRate = 20.0; // ₹20 per search
  const totalAmount = unbilledCount * billingRate;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800/60 pb-6 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Invoice Registry</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Review generated invoices and execute manual search billing runs.</p>
          </div>
        </div>

        {/* Status Alerts */}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-sm font-medium animate-fade-in flex items-center space-x-2">
            <CheckCircle size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-sm font-medium animate-fade-in flex items-center space-x-2">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Invoice Generator Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User selector column */}
          <div className="lg:col-span-1 glass dark:glass rounded-3xl p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center space-x-2">
                <UserCheck size={18} className="text-slate-600 dark:text-slate-400" />
                <span>Select Client User</span>
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-2">User Database</label>
                <select
                  onChange={(e) => {
                    const u = users.find(usr => usr.id === parseInt(e.target.value));
                    if (u) handleUserSelect(u);
                  }}
                  value={selectedUser?.id || ''}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 text-sm focus:outline-none text-slate-800 dark:text-slate-200 font-semibold"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 p-4 rounded-2xl flex items-start space-x-2.5">
              <Sparkles className="text-blue-400 shrink-0 mt-0.5" size={16} />
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Billing calculations count unbilled stock queries performed since the user's last generated invoice. Standard rate is <b>₹20.00/search</b>.
              </p>
            </div>
          </div>

          {/* Bill Preview Column */}
          <div className="lg:col-span-2 glass dark:glass rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-500/5 blur-[80px]"></div>
            
            <div className="space-y-4 relative">
              <h3 className="text-lg font-bold flex items-center space-x-2">
                <FileText size={18} className="text-slate-600 dark:text-slate-400" />
                <span>Invoice Statement Preview</span>
              </h3>
              
              {selectedUser ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-wider block">Billed To</span>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{selectedUser.username}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{selectedUser.email}</p>
                  </div>
                  <div className="space-y-2 bg-slate-950/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/40">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Unbilled Searches:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{unbilledCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Billing Rate:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">₹{billingRate.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between text-base font-extrabold">
                      <span className="text-slate-700 dark:text-slate-300">Grand Total:</span>
                      <span className="text-blue-400">₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-500">No user selected</p>
              )}
            </div>

            <button
              onClick={handleCreateInvoice}
              disabled={submitting || unbilledCount === 0 || !selectedUser}
              className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-slate-900 dark:text-white font-bold text-sm tracking-wider hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:scale-100 transition-all cursor-pointer"
            >
              {submitting ? 'Generating PDF...' : unbilledCount === 0 ? 'No Unbilled Searches Available' : 'Generate & Store Invoice Statement'}
            </button>
          </div>
        </div>

        {/* Invoice List Table */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight">Invoice History Log</h3>
          
          {loading ? (
            <LoadingSpinner message="Retrieving invoice registers..." />
          ) : invoices.length === 0 ? (
            <div className="glass dark:glass rounded-2xl p-12 text-center text-slate-500 dark:text-slate-500">
              No invoices generated in the database.
            </div>
          ) : (
            <div className="glass dark:glass rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-4 px-6">Invoice Number</th>
                      <th className="py-4 px-6">User</th>
                      <th className="py-4 px-6 text-center">Searches Billed</th>
                      <th className="py-4 px-6 text-right">Amount Billed</th>
                      <th className="py-4 px-6 text-center">Date Generated</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-200 dark:hover:bg-slate-800/20 transition-all duration-300 group">
                        <td className="py-5 px-6 font-bold text-blue-400 text-sm group-hover:text-blue-300">{inv.invoice_number}</td>
                        <td className="py-5 px-6 font-semibold text-slate-800 dark:text-slate-200 text-sm">{getUserNameById(inv.user_id)}</td>
                        <td className="py-5 px-6 text-center text-slate-700 dark:text-slate-300 font-bold text-sm">{inv.total_searches}</td>
                        <td className="py-5 px-6 text-right font-black text-slate-800 dark:text-slate-200 text-sm">₹ {inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-5 px-6 text-center text-xs text-slate-800 dark:text-slate-400">
                          {new Date(inv.invoice_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-5 px-6 text-center">
                          <div className="flex flex-col items-center justify-center space-y-1.5">
                            <span className={`inline-block text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded shadow-sm ${inv.is_paid ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/60' : 'bg-amber-950/50 text-amber-400 border border-amber-800/60'}`}>
                              {inv.is_paid ? 'PAID' : 'UNPAID'}
                            </span>
                            <label className="flex items-center space-x-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                              <input 
                                type="checkbox" 
                                checked={inv.is_paid} 
                                onChange={() => handleTogglePaid(inv.id, inv.is_paid)} 
                                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                              />
                              <span className="text-[9px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">{inv.is_paid ? 'Mark Unpaid' : 'Mark Paid'}</span>
                            </label>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <button
                            onClick={() => handleDownloadPdf(inv.id, inv.invoice_number)}
                            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-lg hover:bg-blue-600 hover:text-slate-900 dark:text-white hover:border-blue-500 hover:shadow-blue-500/20 text-xs font-bold transition-all text-slate-700 dark:text-slate-300 cursor-pointer group-hover:scale-[1.02]"
                            title="Download PDF"
                          >
                            <Download size={14} className="shrink-0" />
                            <span>Download PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default InvoiceManagementPage;
