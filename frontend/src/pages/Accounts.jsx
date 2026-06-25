import { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  X,
  User,
  Mail,
  ChevronDown,
  Loader2,
  Landmark,
  CreditCard,
  PiggyBank,
  Briefcase,
  Trash2,
  Building2,
  Pencil,
} from 'lucide-react';
import { accountApi, bankApi } from '../api/client';

const FALLBACK_BANKS = [
  { id: 1, name: 'UBA Bank' },
  { id: 2, name: 'CCABank' },
  { id: 3, name: 'SGC Afriland' },
  { id: 4, name: 'Fiertbac' },
  { id: 5, name: 'ExpressUnion' },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="card">
          <div className="flex items-center gap-4">
            <div className="skeleton w-14 h-14 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-2/3" />
            <div className="skeleton h-8 w-24 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card text-center py-16 col-span-full">
      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <CreditCard className="w-10 h-10 text-primary-400" />
      </div>
      <h3 className="font-bold text-gray-900 text-xl">Aucun compte</h3>
      <p className="text-gray-500 mt-2">Cr&eacute;ez votre premier compte bancaire</p>
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

const accountTypeConfig = {
  CHECKING: { icon: Wallet, color: 'from-emerald-500 to-teal-600', bg: 'from-emerald-100 to-teal-50', label: 'Courant' },
  SAVINGS: { icon: PiggyBank, color: 'from-violet-500 to-purple-600', bg: 'from-violet-100 to-purple-50', label: 'Épargne' },
  BUSINESS: { icon: Briefcase, color: 'from-amber-500 to-orange-600', bg: 'from-amber-100 to-orange-50', label: 'Business' },
};

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    ownerName: '',
    ownerEmail: '',
    accountType: 'CHECKING',
    bankId: '',
  });
  const [editAccount, setEditAccount] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [accountsRes, banksRes] = await Promise.all([
          accountApi.getAll(),
          bankApi.getAll(),
        ]);
        setAccounts(accountsRes.data);
        const banksData = banksRes.data;
        setBanks(banksData);
        setForm((prev) => prev.bankId ? prev : { ...prev, bankId: String(banksData[0]?.id) });
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setBanks(FALLBACK_BANKS);
        setForm((prev) => prev.bankId ? prev : { ...prev, bankId: String(FALLBACK_BANKS[0]?.id) });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.ownerName.trim() || !form.bankId) return;
    setSubmitting(true);
    try {
      const res = await accountApi.create(form);
      setAccounts((prev) => [res.data, ...prev]);
      setForm({ ownerName: '', ownerEmail: '', accountType: 'CHECKING', bankId: String(banks[0]?.id || '') });
      setShowForm(false);
    } catch (err) {
      console.error('Error creating account:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Voulez-vous vraiment supprimer ce compte ?')) return;
    try {
      await accountApi.delete(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la suppression';
      alert(msg);
    }
  }

  function openEdit(account) {
    setEditAccount(account);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editAccount) return;
    setEditSubmitting(true);
    try {
      const res = await accountApi.update(editAccount.id, {
        ownerName: editAccount.owner_name,
        ownerEmail: editAccount.owner_email,
        accountType: editAccount.account_type,
      });
      setAccounts((prev) => prev.map((a) => (a.id === editAccount.id ? res.data : a)));
      setEditAccount(null);
    } catch (err) {
      console.error('Error updating account:', err);
      alert(err.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setEditSubmitting(false);
    }
  }

  function getBankName(bankId) {
    const bank = banks.find((b) => b.id === Number(bankId));
    return bank ? bank.name : 'Banque inconnue';
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comptes</h1>
          <p className="text-gray-500 mt-1">G&eacute;rez vos comptes bancaires</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/25"
        >
          <Plus className="w-5 h-5" />
          Nouveau compte
        </button>
      </div>

      {showForm && (
        <div className="card border-primary-200 bg-gradient-to-br from-white to-rose-50/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Cr&eacute;er un compte</h2>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du titulaire</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ex: Jean Dupont"
                    className="input-field pl-10"
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Ex: jean@email.com"
                    className="input-field pl-10"
                    value={form.ownerEmail}
                    onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de compte</label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      className="select-field pl-10 appearance-none"
                      value={form.accountType}
                      onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                    >
                    <option value="CHECKING">Courant</option>
                    <option value="SAVINGS">Épargne</option>
                    <option value="BUSINESS">Business</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Banque</label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    className="select-field pl-10 appearance-none"
                    value={form.bankId}
                    onChange={(e) => setForm({ ...form, bankId: e.target.value })}
                    required
                  >
                    {banks.length === 0 && <option value="">S&eacute;lectionner une banque</option>}
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>{bank.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Cr&eacute;ation...' : 'Cr&eacute;er le compte'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : accounts.length === 0 ? (
        <div className="grid grid-cols-1">
          <EmptyState />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const config = accountTypeConfig[account.account_type] || accountTypeConfig.CHECKING;
            const TypeIcon = config.icon;
            return (
              <div key={account.id} className="card-hover group relative">
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button
                    onClick={() => openEdit(account)}
                    className="w-8 h-8 rounded-lg bg-white/80 hover:bg-blue-50 flex items-center justify-center shadow-sm border border-gray-200"
                  >
                    <Pencil className="w-4 h-4 text-blue-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="w-8 h-8 rounded-lg bg-white/80 hover:bg-red-50 flex items-center justify-center shadow-sm border border-gray-200"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${config.bg} rounded-2xl flex items-center justify-center shadow-sm`}>
                    <TypeIcon className="w-7 h-7 text-gray-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{account.owner_name}</h3>
                    <StatusBadge status={account.status} />
                  </div>
                </div>
                <p className="text-sm font-mono text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 mb-3">
                  {account.account_number}
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-3">{formatCurrency(account.balance)}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span>{getBankName(account.bank_id)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Modifier le compte</h2>
              </div>
              <button
                onClick={() => setEditAccount(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du titulaire</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    className="input-field pl-10"
                    value={editAccount.owner_name}
                    onChange={(e) => setEditAccount({ ...editAccount, owner_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    className="input-field pl-10"
                    value={editAccount.owner_email}
                    onChange={(e) => setEditAccount({ ...editAccount, owner_email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de compte</label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    className="select-field pl-10 appearance-none"
                    value={editAccount.account_type}
                    onChange={(e) => setEditAccount({ ...editAccount, account_type: e.target.value })}
                  >
                    <option value="CHECKING">Courant</option>
                    <option value="SAVINGS">Épargne</option>
                    <option value="BUSINESS">Business</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={editSubmitting} className="btn-primary flex items-center gap-2">
                  {editSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button type="button" onClick={() => setEditAccount(null)} className="btn-secondary">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Accounts;
