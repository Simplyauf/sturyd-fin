import { useState, useEffect } from 'react';
import { api } from '../api/fintech-api';
import type { Transaction, Beneficiary, User } from '../api/fintech-api';
import {
  Plus,
  Send as SendIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  Wallet,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SendMoneyModal from '../components/SendMoneyModal';
import AddBeneficiaryModal from '../components/AddBeneficiaryModal';
import KYCModal from '../components/KYCModal';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddBenOpen, setIsAddBenOpen] = useState(false);
  const [isKycOpen, setIsKycOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('500');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [u, txs, bens, wallet] = await Promise.all([
        api.getMe(),
        api.getTransactions(),
        api.getBeneficiaries(),
        api.getWalletBalance(),
      ]);
      setUser(u);
      setTransactions(txs);
      setBeneficiaries(bens);
      setWalletBalance(Number(wallet.balanceUsd));
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyKyc = () => {
    setIsKycOpen(true);
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;
    setIsDepositing(true);
    try {
      await api.depositToWallet(amount);
      setIsDepositOpen(false);
      fetchData();
    } catch (err) {
      alert('Deposit failed');
    } finally {
      setIsDepositing(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'SETTLED': return 'text-green-700 bg-green-100';
      case 'FAILED': return 'text-red-700 bg-red-100';
      case 'PENDING': return 'text-yellow-700 bg-yellow-100';
      default: return 'text-blue-700 bg-blue-100';
    }
  };

  if (isLoading) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome & Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="w-40 h-40" />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Hello, {user?.email.split('@')[0]}!</h2>
          <p className="text-gray-500 mb-8 max-w-sm">Complete your KYC to access higher transfer limits and additional currency pairs.</p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-semibold shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Send New Transfer
            </button>
            <button
              onClick={() => setIsAddBenOpen(true)}
              className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-2xl border border-gray-200 font-medium transition-all"
            >
              Manage Recipients
            </button>
          </div>
        </div>

        {/* Right column: KYC + Wallet stacked */}
        <div className="flex flex-col gap-4">
          {/* KYC Status Card */}
          <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-3xl flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 font-medium lowercase">Verification Status</span>
                {user?.kycStatus === 'VERIFIED' ? (
                  <CheckCircle className="text-green-500 w-5 h-5" />
                ) : (
                  <AlertCircle className="text-yellow-500 w-5 h-5" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{user?.kycStatus}</h3>
            </div>

            {user?.kycStatus !== 'VERIFIED' && (
              <button
                onClick={handleVerifyKyc}
                className="w-full mt-4 bg-primary-50 hover:bg-primary-100 text-primary-600 border border-primary-200 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-5 h-5" />
                Complete KYC
              </button>
            )}
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 font-medium text-sm">USD Wallet</span>
              <Wallet className="text-primary-400 w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold">${walletBalance.toFixed(2)}</h3>
            <button
              onClick={() => setIsDepositOpen((v) => !v)}
              className="w-full mt-4 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 border border-primary-500/20 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Add Funds (Simulated)
            </button>

            {isDepositOpen && (
              <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500 text-gray-900"
                  />
                <button
                  onClick={handleDeposit}
                  disabled={isDepositing}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
                >
                  {isDepositing ? '...' : 'Add'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Transaction History */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-semibold">Recent Transfers</h3>
          </div>

          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="bg-white border border-gray-200 shadow-sm p-12 rounded-3xl text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-400">No transactions yet. Start by sending money!</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <motion.div
                  layout
                  key={tx.id}
                  className="bg-white border border-gray-200 shadow-sm p-5 rounded-2xl flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      tx.status === 'SETTLED' ? 'bg-green-500/10' : 'bg-primary-500/10'
                    }`}>
                      {tx.status === 'SETTLED' ? (
                        <ArrowUpRight className="w-6 h-6 text-green-500" />
                      ) : (
                        <SendIcon className="w-6 h-6 text-primary-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{tx.beneficiary?.name || 'Unknown Recipient'}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt || '').toLocaleDateString()} • {tx.sourceCurrency} to {tx.destinationCurrency}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${tx.sourceAmount}</p>
                    <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${statusColor(tx.status)}`}>
                      {tx.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Saved Recipients */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-semibold">Saved Recipients</h3>
            <button
              onClick={() => setIsAddBenOpen(true)}
              title="Add recipient"
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-primary-50 flex items-center justify-center transition-colors border border-gray-200"
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {beneficiaries.map((ben) => (
              <div key={ben.id} className="bg-white border border-gray-200 shadow-sm p-4 rounded-2xl flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                  {ben.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{ben.name}</p>
                  <p className="text-xs text-gray-500">{ben.bankName} • {ben.ifscCode}</p>
                </div>
              </div>
            ))}
            {beneficiaries.length === 0 && (
              <button
                onClick={() => setIsAddBenOpen(true)}
                className="w-full p-6 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm hover:border-primary-500/40 hover:text-primary-600 transition-colors"
              >
                + Add your first recipient
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <SendMoneyModal
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
              setIsModalOpen(false);
              fetchData();
            }}
            beneficiaries={beneficiaries}
          />
        )}
        {isAddBenOpen && (
          <AddBeneficiaryModal
            onClose={() => setIsAddBenOpen(false)}
            onSuccess={() => {
              setIsAddBenOpen(false);
              fetchData();
            }}
          />
        )}
        {isKycOpen && (
          <KYCModal
            onClose={() => setIsKycOpen(false)}
            onSuccess={() => {
              setIsKycOpen(false);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
