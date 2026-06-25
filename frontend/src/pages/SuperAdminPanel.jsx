import { useState, useEffect } from 'react';
import { Shield, Users, Building2, Wallet, TrendingUp, Loader2, RefreshCw, FileText } from 'lucide-react';
import { bankApi, accountApi, transactionApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

function SuperAdminPanel() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [banksRes, accountsRes, txRes] = await Promise.all([
        bankApi.getAll(),
        accountApi.getAll(),
        transactionApi.getAll(),
      ]);
      const banks = banksRes.data;
      const accounts = accountsRes.data;
      const transactions = txRes.data;
      setStats({
        banks: banks.length,
        accounts: accounts.length,
        transactions: transactions.length,
        totalBalance: accounts.reduce((s, a) => s + (a.balance || 0), 0),
        activeAccounts: accounts.filter((a) => a.status === 'ACTIVE').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin</h1>
            <p className="text-gray-500 mt-1">Panneau confidentiel — {user?.username}</p>
          </div>
        </div>
        <button onClick={fetchStats} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-purple-700">Banques</p>
          </div>
          <p className="text-3xl font-bold text-purple-900">{stats.banks}</p>
        </div>
        <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-emerald-700">Comptes</p>
          </div>
          <p className="text-3xl font-bold text-emerald-900">{stats.accounts}</p>
          <p className="text-xs text-emerald-600 mt-1">{stats.activeAccounts} actifs</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-blue-700">Transactions</p>
          </div>
          <p className="text-3xl font-bold text-blue-900">{stats.transactions}</p>
        </div>
        <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-amber-700">Solde total</p>
          </div>
          <p className="text-3xl font-bold text-amber-900">{formatCurrency(stats.totalBalance)}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Informations syst&egrave;me</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Admin connect&eacute;</span>
            <span className="font-medium text-gray-900">{user?.username}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">R&ocirc;le</span>
            <span className="font-medium text-gray-900">{user?.role}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">URL secr&egrave;te</span>
            <span className="font-mono text-xs text-gray-400">/stella-panel</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Version</span>
            <span className="font-medium text-gray-900">1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminPanel;