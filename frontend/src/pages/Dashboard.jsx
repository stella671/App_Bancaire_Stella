import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Wallet,
  ArrowLeftRight,
  Banknote,
  Plus,
  TrendingUp,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  RefreshCw,
  Building,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bankApi, accountApi, transactionApi } from '../api/client';

function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className="card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          {loading ? (
            <div className="skeleton h-8 w-24 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shadow-sm`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon: Icon, title, desc, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className="card-hover text-left w-full group cursor-pointer"
    >
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card">
          <div className="flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="card text-center py-12">
      <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-primary-400" />
      </div>
      <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
      <p className="text-gray-500 text-sm mt-1">{desc}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: 'badge-active',
    INACTIVE: 'badge-inactive',
    SUSPENDED: 'badge-suspended',
    CLOSED: 'badge-closed',
  };
  return <span className={styles[status] || 'badge-inactive'}>{status}</span>;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTransactionIcon(type) {
  if (type === 'DEPOSIT') return { icon: ArrowDownRight, color: 'bg-emerald-500' };
  if (type === 'WITHDRAWAL') return { icon: ArrowUpRight, color: 'bg-red-500' };
  if (type === 'TRANSFER') return { icon: ArrowLeftRight, color: 'bg-violet-500' };
  return { icon: Receipt, color: 'bg-gray-500' };
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ banks: 0, accounts: 0, transactions: 0, balance: 0 });
  const [recentBanks, setRecentBanks] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [banksRes, accountsRes, transactionsRes] = await Promise.all([
          bankApi.getAll(),
          accountApi.getAll(),
          transactionApi.getAll(),
        ]);

        const banks = banksRes.data;
        const accounts = accountsRes.data;
        const transactions = transactionsRes.data;

        const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

        setStats({
          banks: banks.length,
          accounts: accounts.length,
          transactions: transactions.length,
          balance: totalBalance,
        });

        setRecentBanks(banks.slice(0, 5));
        setRecentTransactions(transactions.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-orange-600 rounded-3xl p-8 text-white shadow-xl shadow-primary-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Bienvenue sur StellaBank
            </h1>
            <p className="text-primary-100 mt-2 text-lg">
              Votre plateforme de gestion bancaire centralis&eacute;e
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <TrendingUp className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Landmark}
          label="Banques"
          value={stats.banks}
          color="bg-gradient-to-br from-primary-500 to-rose-600"
          loading={loading}
        />
        <StatCard
          icon={Wallet}
          label="Comptes"
          value={stats.accounts}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
          loading={loading}
        />
        <StatCard
          icon={ArrowLeftRight}
          label="Transactions"
          value={stats.transactions}
          color="bg-gradient-to-br from-violet-500 to-purple-600"
          loading={loading}
        />
        <StatCard
          icon={Banknote}
          label="Solde total"
          value={loading ? '' : formatCurrency(stats.balance)}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          loading={loading}
        />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickActionCard
            icon={Building2}
            title="Nouvelle banque"
            desc="Ajouter une nouvelle institution bancaire"
            onClick={() => navigate('/banks')}
            color="bg-gradient-to-br from-primary-500 to-rose-600"
          />
          <QuickActionCard
            icon={Wallet}
            title="Nouveau compte"
            desc="Cr&eacute;er un compte bancaire"
            onClick={() => navigate('/accounts')}
            color="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <QuickActionCard
            icon={ArrowLeftRight}
            title="Nouvelle transaction"
            desc="Effectuer un d&eacute;p&ocirc;t, retrait ou virement"
            onClick={() => navigate('/transactions')}
            color="bg-gradient-to-br from-violet-500 to-purple-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Banques r&eacute;centes</h2>
            <button
              onClick={() => navigate('/banks')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <LoadingSkeleton />
          ) : recentBanks.length === 0 ? (
            <EmptyState
              icon={Building}
              title="Aucune banque"
              desc="Commencez par ajouter une banque"
            />
          ) : (
            <div className="space-y-3">
              {recentBanks.map((bank) => (
                <div key={bank.id} className="card-hover flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-rose-100 rounded-xl flex items-center justify-center">
                    <Landmark className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{bank.name}</p>
                    <p className="text-sm text-gray-500">{bank.country || '—'}</p>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{bank.code}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Transactions r&eacute;centes</h2>
            <button
              onClick={() => navigate('/transactions')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <LoadingSkeleton />
          ) : recentTransactions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Aucune transaction"
              desc="Effectuez votre premi&egrave;re transaction"
            />
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => {
                const { icon: TxIcon, color } = getTransactionIcon(tx.type);
                return (
                  <div key={tx.id} className="card-hover flex items-center gap-4">
                    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
                      <TxIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{tx.description || tx.type}</p>
                      <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.type === 'WITHDRAWAL' ? 'text-red-500' : 'text-emerald-600'}`}>
                        {tx.type === 'WITHDRAWAL' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </p>
                      {tx.fee > 0 && (
                        <p className="text-xs text-gray-400">Frais: {formatCurrency(tx.fee)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
