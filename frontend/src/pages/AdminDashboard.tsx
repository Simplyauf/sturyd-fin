import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/fintech-api';
import type { Transaction, User } from '../api/fintech-api';
import {
  ShieldCheck,
  Users as UsersIcon,
  Layers,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Activity,
  DollarSign,
  Clock
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [txs, allUsers] = await Promise.all([
        api.getAllTransactions(),
        api.getAllUsers(),
      ]);
      setTransactions(txs);
      setUsers(allUsers);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApproveKyc = async (userId: string) => {
    setActionLoading(userId + '_approve');
    try {
      await api.approveKyc(userId);
      await fetchData();
    } catch (err) {
      alert('Failed to approve KYC');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectKyc = async (userId: string) => {
    setActionLoading(userId + '_reject');
    try {
      await api.rejectKyc(userId);
      await fetchData();
    } catch (err) {
      alert('Failed to reject KYC');
    } finally {
      setActionLoading(null);
    }
  };

  const totalVolumeUsd = transactions
    .filter((tx) => tx.status === 'SETTLED')
    .reduce((sum, tx) => sum + Number(tx.sourceAmount), 0);

  const pendingKycCount = users.filter((u) => u.kycStatus === 'PENDING').length;

  const filteredTxs = search
    ? transactions.filter(
        (tx) =>
          tx.id.toLowerCase().includes(search.toLowerCase()) ||
          (tx as any).user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : transactions;

  // const statusDot = (status: string) => {
  //   if (status === 'SETTLED') return 'bg-green-500';
  //   if (status === 'FAILED') return 'bg-red-500';
  //   return 'bg-blue-500';
  // };

  if (isLoading) return null;

  return (
    <>
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Operations Portal</h2>
          <p className="text-gray-500">Platform-wide monitoring and compliance</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-xl flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700">System Live</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: 'Settled Volume',
            value: `$${totalVolumeUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            sub: `${transactions.filter((t) => t.status === 'SETTLED').length} completed transfers`,
            icon: DollarSign,
            color: 'text-primary-600 bg-primary-50',
          },
          {
            label: 'Pending KYC',
            value: String(pendingKycCount),
            sub: pendingKycCount > 0 ? 'Action required' : 'All clear',
            icon: ShieldCheck,
            color: pendingKycCount > 0 ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50',
          },
          {
            label: 'Total Users',
            value: String(users.length),
            sub: `${users.filter((u) => u.kycStatus === 'VERIFIED').length} verified`,
            icon: UsersIcon,
            color: 'text-blue-600 bg-blue-50',
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-200 shadow-sm p-6 rounded-3xl">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-gray-500 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold mt-1 text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Compliance Queue */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-semibold flex items-center gap-2 text-gray-800">
              <ShieldCheck className="w-5 h-5 text-gray-400" />
              Compliance Queue
            </h3>
            <Filter className="w-4 h-4 text-gray-400" />
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {users.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-sm">No users yet.</p>
            )}
            {users.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold border border-gray-200">
                    {u.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.email}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">
                      {u.firstName} {u.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-1 rounded-lg font-bold ${
                    u.kycStatus === 'VERIFIED'
                      ? 'bg-green-100 text-green-700'
                      : u.kycStatus === 'REJECTED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {u.kycStatus}
                  </span>
                  {u.kycStatus === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApproveKyc(u.id)}
                        disabled={!!actionLoading}
                        title="Approve KYC"
                        className="text-gray-400 hover:text-green-600 hover:bg-green-50 p-1 rounded-md disabled:opacity-40 transition-colors"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRejectKyc(u.id)}
                        disabled={!!actionLoading}
                        title="Reject KYC"
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md disabled:opacity-40 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Transaction Stream */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-semibold flex items-center gap-2 text-gray-800">
              <Layers className="w-5 h-5 text-gray-400" />
              Recent Transactions
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-xs py-1.5 pl-8 pr-3 rounded-full focus:ring-2 focus:ring-primary-500 focus:outline-none w-48"
                placeholder="Search user or tx ID..."
              />
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredTxs.length === 0 ? (
              <div className="text-center text-gray-400 py-12 text-sm flex flex-col items-center gap-3">
                <Clock className="w-8 h-8 text-gray-300" />
                No transactions found.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">USD</th>
                    <th className="px-6 py-3 font-medium">INR</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTxs.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 truncate max-w-[100px] text-xs text-gray-900 font-medium">
                        {(tx as any).user?.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">${tx.sourceAmount}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                        ₹{Number(tx.destinationAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${
                          tx.status === 'SETTLED' ? 'text-green-700 bg-green-100' : 
                          tx.status === 'FAILED' ? 'text-red-700 bg-red-100' : 
                          'text-blue-700 bg-blue-100'
                        }`}>
                          {tx.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminDashboard;
