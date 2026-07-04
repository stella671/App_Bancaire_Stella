import { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Receipt,
  Landmark,
  ChevronDown,
  Loader2,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react';
import { transactionApi, accountApi, bankApi } from '../api/client';

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

const allTabs = [
  { id: 'deposit', label: 'Dépôt', icon: ArrowDownRight },
  { id: 'withdraw', label: 'Retrait', icon: ArrowUpRight },
  { id: 'transfer', label: 'Virement', icon: ArrowLeftRight },
];

function getTransactionIcon(type) {
  if (type === 'DEPOSIT') return { icon: ArrowDownRight, color: 'bg-emerald-100 text-emerald-600' };
  if (type === 'WITHDRAWAL') return { icon: ArrowUpRight, color: 'bg-red-100 text-red-600' };
  if (type === 'TRANSFER') return { icon: ArrowLeftRight, color: 'bg-violet-100 text-violet-600' };
  return { icon: Receipt, color: 'bg-gray-100 text-gray-600' };
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card">
          <div className="flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-3 w-1/3" />
            </div>
            <div className="skeleton h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card text-center py-12">
      <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Receipt className="w-8 h-8 text-primary-400" />
      </div>
      <h3 className="font-bold text-gray-900 text-lg">Aucune transaction</h3>
      <p className="text-gray-500 text-sm mt-1">Effectuez votre premi&egrave;re transaction</p>
    </div>
  );
}

function Transactions() {
  const tabs = allTabs;
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'deposit');
  const [accounts, setAccounts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const [depositForm, setDepositForm] = useState({ accountId: '', amount: '', description: '', bankId: '' });
  const [withdrawForm, setWithdrawForm] = useState({ accountId: '', amount: '', description: '' });
  const [transferForm, setTransferForm] = useState({ fromAccountId: '', toAccountId: '', amount: '', description: '' });

  useEffect(() => {
    async function fetchData() {
      try {
        const [accountsRes, transactionsRes, banksRes] = await Promise.all([
          accountApi.getAll(),
          transactionApi.getAll(),
          bankApi.getAll(),
        ]);
        const accs = accountsRes.data;
        const banksData = banksRes.data;
        setAccounts(accs);
        setBanks(banksData);
        setTransactions(transactionsRes.data);
        setDepositForm((prev) => prev.accountId ? prev : { ...prev, accountId: String(accs[0]?.id || ''), bankId: String(banksData[0]?.id || '') });
        setWithdrawForm((prev) => prev.accountId ? prev : { ...prev, accountId: String(accs[0]?.id || '') });
        setTransferForm((prev) => prev.fromAccountId ? prev : { ...prev, fromAccountId: String(accs[0]?.id || ''), toAccountId: String(accs[1]?.id || accs[0]?.id || '') });
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function showNotification(type, message) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }

  function resetForms() {
    setDepositForm({ accountId: '', amount: '', description: '', bankId: '' });
    setWithdrawForm({ accountId: '', amount: '', description: '' });
    setTransferForm({ fromAccountId: '', toAccountId: '', amount: '', description: '' });
  }

  async function handleDeposit(e) {
    e.preventDefault();
    if (!depositForm.accountId || !depositForm.amount || !depositForm.bankId) return;
    setSubmitting(true);
    try {
      const amount = parseFloat(depositForm.amount);
      const res = await transactionApi.deposit({
        accountId: depositForm.accountId,
        amount,
        description: depositForm.description || 'Dépôt',
        bankId: depositForm.bankId,
      });
      setTransactions((prev) => [res.data, ...prev]);
      setAccounts((prev) => prev.map((a) =>
        a.id === Number(depositForm.accountId)
          ? { ...a, balance: (a.balance || 0) + amount }
          : a
      ));
      showNotification('success', 'Dépôt effectué avec succès');
      setDepositForm({ accountId: String(accounts[0]?.id || ''), amount: '', description: '', bankId: String(banks[0]?.id || '') });
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Erreur lors du dépôt');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw(e) {
    e.preventDefault();
    if (!withdrawForm.accountId || !withdrawForm.amount) return;
    setSubmitting(true);
    try {
      const amount = parseFloat(withdrawForm.amount);
      const res = await transactionApi.withdraw({
        accountId: withdrawForm.accountId,
        amount,
        description: withdrawForm.description || 'Retrait',
      });
      setTransactions((prev) => [res.data, ...prev]);
      setAccounts((prev) => prev.map((a) =>
        a.id === Number(withdrawForm.accountId)
          ? { ...a, balance: (a.balance || 0) - amount }
          : a
      ));
      showNotification('success', 'Retrait effectué avec succès');
      setWithdrawForm({ accountId: String(accounts[0]?.id || ''), amount: '', description: '' });
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Erreur lors du retrait');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount) return;
    if (transferForm.fromAccountId === transferForm.toAccountId) {
      showNotification('error', 'Les comptes doivent être différents');
      return;
    }
    setSubmitting(true);
    try {
      const amount = parseFloat(transferForm.amount);
      const res = await transactionApi.transfer({
        fromAccountId: transferForm.fromAccountId,
        toAccountId: transferForm.toAccountId,
        amount,
        description: transferForm.description || 'Virement',
      });
      setTransactions((prev) => [res.data, ...prev]);
      setAccounts((prev) => prev.map((a) => {
        if (a.id === Number(transferForm.fromAccountId)) return { ...a, balance: (a.balance || 0) - amount };
        if (a.id === Number(transferForm.toAccountId)) return { ...a, balance: (a.balance || 0) + amount };
        return a;
      }));
      showNotification('success', 'Virement effectué avec succès');
      setTransferForm({ fromAccountId: String(accounts[0]?.id || ''), toAccountId: String(accounts[1]?.id || accounts[0]?.id || ''), amount: '', description: '' });
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Erreur lors du virement');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 mt-1">Effectuez des opérations bancaires</p>
        </div>
      </div>

      {notification && (
        <div
          className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-lg border ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          )}
          <p className="flex-1 text-sm font-medium">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="flex-shrink-0">
            <X className="w-4 h-4 opacity-60 hover:opacity-100" />
          </button>
        </div>
      )}

      <div className="card p-1.5">
        <div className="flex items-center gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === id
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card border-primary-100 bg-gradient-to-br from-white to-rose-50/30">
        {activeTab === 'deposit' && (
          <form onSubmit={handleDeposit} className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Effectuer un dépôt</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Compte destinataire</label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    className="select-field pl-10 appearance-none"
                    value={depositForm.accountId}
                    onChange={(e) => setDepositForm({ ...depositForm, accountId: e.target.value })}
                    required
                  >
                    {accounts.length === 0 && <option value="">S&eacute;lectionner un compte</option>}
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.owner_name} — {acc.account_number}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Banque source</label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    className="select-field pl-10 appearance-none"
                    value={depositForm.bankId}
                    onChange={(e) => setDepositForm({ ...depositForm, bankId: e.target.value })}
                    required
                  >
                    {banks.length === 0 && <option value="">S&eacute;lectionner une banque</option>}
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant (FCFA)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 50000"
                  className="input-field"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optionnelle)</label>
              <input
                type="text"
                placeholder="Ex: Salaire mois de juin"
                className="input-field"
                value={depositForm.description}
                onChange={(e) => setDepositForm({ ...depositForm, description: e.target.value })}
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Traitement...' : 'Effectuer le dépôt'}
            </button>
          </form>
        )}

        {activeTab === 'withdraw' && (
          <form onSubmit={handleWithdraw} className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Effectuer un retrait</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Compte source</label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    className="select-field pl-10 appearance-none"
                    value={withdrawForm.accountId}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountId: e.target.value })}
                    required
                  >
                    {accounts.length === 0 && <option value="">S&eacute;lectionner un compte</option>}
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.owner_name} — {acc.account_number} ({formatCurrency(acc.balance)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant (FCFA)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 25000"
                  className="input-field"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optionnelle)</label>
              <input
                type="text"
                placeholder="Ex: Retrait DAB"
                className="input-field"
                value={withdrawForm.description}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, description: e.target.value })}
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Traitement...' : 'Effectuer le retrait'}
            </button>
          </form>
        )}

        {activeTab === 'transfer' && (
          <form onSubmit={handleTransfer} className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-violet-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Effectuer un virement</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Compte expéditeur</label>
                <div className="relative">
                  <ArrowUpRight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    className="select-field pl-10 appearance-none"
                    value={transferForm.fromAccountId}
                    onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                    required
                  >
                    {accounts.length === 0 && <option value="">S&eacute;lectionner un compte</option>}
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.owner_name} — {acc.account_number} ({formatCurrency(acc.balance)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Compte destinataire</label>
                <div className="relative">
                  <ArrowDownRight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    className="select-field pl-10 appearance-none"
                    value={transferForm.toAccountId}
                    onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                    required
                  >
                    {accounts.length === 0 && <option value="">S&eacute;lectionner un compte</option>}
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.owner_name} — {acc.account_number}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant (FCFA)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 10000"
                  className="input-field"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optionnelle)</label>
                <input
                  type="text"
                  placeholder="Ex: Remboursement"
                  className="input-field"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Traitement...' : 'Effectuer le virement'}
            </button>
          </form>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Historique des transactions</h2>
        </div>
        {loading ? (
          <LoadingSkeleton />
        ) : transactions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const { icon: TxIcon, color } = getTransactionIcon(tx.type);
              const typeLabels = {
                DEPOSIT: 'Dépôt',
                WITHDRAWAL: 'Retrait',
                TRANSFER: 'Virement',
              };
              return (
                <div key={tx.id} className="card-hover flex items-center gap-4">
                  <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
                    <TxIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{tx.description || typeLabels[tx.type]}</p>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {typeLabels[tx.type]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(tx.created_at)}</p>
                    {tx.source_account_id && tx.destination_account_id && tx.type === 'TRANSFER' && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Compte #{tx.source_account_id} → #{tx.destination_account_id}
                      </p>
                    )}
                    {tx.destination_account_id && tx.type === 'DEPOSIT' && (
                      <p className="text-xs text-gray-400 mt-0.5">Compte #{tx.destination_account_id}</p>
                    )}
                    {tx.source_account_id && tx.type === 'WITHDRAWAL' && (
                      <p className="text-xs text-gray-400 mt-0.5">Compte #{tx.source_account_id}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      tx.type === 'DEPOSIT' ? 'text-emerald-600' :
                      tx.type === 'WITHDRAWAL' ? 'text-red-500' :
                      'text-violet-600'
                    }`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}
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
  );
}

export default Transactions;
