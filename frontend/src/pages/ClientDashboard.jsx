import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Receipt, Plus, X, TrendingUp, Loader2, Trash2, Building2, Pencil, User, Mail, ChevronDown } from 'lucide-react';
import { accountApi, transactionApi, bankApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

const FALLBACK_BANKS = [
  { id: 1, name: 'UBA Bank' },
  { id: 2, name: 'CCABank' },
  { id: 3, name: 'SGC Afriland' },
  { id: 4, name: 'Fiertbac' },
  { id: 5, name: 'ExpressUnion' },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [banks, setBanks] = useState([]);
  const [form, setForm] = useState({ ownerName: user?.username || '', ownerEmail: '', accountType: 'CHECKING', bankId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [txForm, setTxForm] = useState({ accountId: '', amount: '', description: '' });

  useEffect(() => {
    async function fetchData() {
      try {
        const [accRes, txRes, bankRes] = await Promise.all([
          accountApi.getAll(),
          transactionApi.getAll(),
          bankApi.getAll(),
        ]);
        setAccounts(accRes.data);
        setTransactions(txRes.data);
        const banksData = bankRes.data;
        setBanks(banksData);
        setForm((prev) => prev.bankId ? prev : { ...prev, bankId: String(banksData[0]?.id) });
        setTxForm((prev) => prev.accountId ? prev : { ...prev, accountId: String(accRes.data[0]?.id || '') });
      } catch (err) {
        console.error(err);
        setBanks(FALLBACK_BANKS);
        setForm((prev) => prev.bankId ? prev : { ...prev, bankId: String(FALLBACK_BANKS[0]?.id) });
      }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  async function handleCreateAccount(e) {
    e.preventDefault();
    if (!form.bankId) return;
    setSubmitting(true);
    try {
      const res = await accountApi.create(form);
      setAccounts((prev) => [res.data, ...prev]);
      setShowCreate(false);
      setForm({ ownerName: user?.username || '', ownerEmail: '', accountType: 'CHECKING', bankId: String(banks[0]?.id || '') });
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  }

  async function handleDeleteAccount(id) {
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
    setEditAccount({ ...account });
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
      alert(err.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleTransaction(type) {
    if (!txForm.accountId || !txForm.amount) return;
    setSubmitting(true);
    try {
      const fn = type === 'deposit' ? transactionApi.deposit : transactionApi.withdraw;
      const amount = parseFloat(txForm.amount);
      const res = await fn({ accountId: Number(txForm.accountId), amount, description: txForm.description || (type === 'deposit' ? 'Dépôt' : 'Retrait') });
      setTransactions((prev) => [res.data, ...prev]);
      setAccounts((prev) => prev.map((a) =>
        a.id === Number(txForm.accountId)
          ? { ...a, balance: type === 'deposit' ? (a.balance || 0) + amount : (a.balance || 0) - amount }
          : a
      ));
      setTxForm({ accountId: String(accounts[0]?.id || ''), amount: '', description: '' });
      setShowDeposit(false);
      setShowWithdraw(false);
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
    finally { setSubmitting(false); }
  }

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl p-8 text-white shadow-xl shadow-emerald-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm font-medium">Solde total de vos comptes</p>
            <h1 className="text-4xl font-bold mt-1">{formatCurrency(totalBalance)}</h1>
            <p className="text-emerald-100 text-sm mt-2">{accounts.length} compte{accounts.length > 1 ? 's' : ''}</p>
          </div>
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Wallet className="w-10 h-10" />
          </div>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="card text-center py-12">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 text-lg">Aucun compte bancaire</h3>
          <p className="text-gray-500 text-sm mt-1">Créez votre premier compte pour commencer</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">Créer un compte</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((acc) => (
            <div key={acc.id} className="card-hover group relative">
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button onClick={() => openEdit(acc)} className="w-8 h-8 rounded-lg bg-white/80 hover:bg-blue-50 flex items-center justify-center shadow-sm border">
                  <Pencil className="w-4 h-4 text-blue-500" />
                </button>
                <button onClick={() => handleDeleteAccount(acc.id)} className="w-8 h-8 rounded-lg bg-white/80 hover:bg-red-50 flex items-center justify-center shadow-sm border">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{acc.owner_name}</p>
                  <p className="text-xs font-mono text-gray-500">{acc.account_number}</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(acc.balance)}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Building2 className="w-4 h-4" />
                <span>{acc.bank_name || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => { setShowCreate(true); setShowDeposit(false); setShowWithdraw(false); }} className="card-hover text-center py-6">
          <Plus className="w-8 h-8 text-primary-500 mx-auto mb-2" />
          <p className="font-semibold text-gray-900">Nouveau compte</p>
        </button>
        <button onClick={() => { setShowDeposit(true); setShowCreate(false); setShowWithdraw(false); setTxForm({ accountId: String(accounts[0]?.id || ''), amount: '', description: '' }); }} className="card-hover text-center py-6">
          <ArrowDownRight className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold text-gray-900">Dépôt</p>
        </button>
        <button onClick={() => { setShowWithdraw(true); setShowCreate(false); setShowDeposit(false); setTxForm({ accountId: String(accounts[0]?.id || ''), amount: '', description: '' }); }} className="card-hover text-center py-6">
          <ArrowUpRight className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="font-semibold text-gray-900">Retrait</p>
        </button>
      </div>

      {showCreate && (
        <div className="card border-primary-200 bg-gradient-to-br from-white to-rose-50/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Créer un compte bancaire</h2>
            <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du titulaire</label>
                <input type="text" className="input-field" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="input-field" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="select-field" value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })}>
                  <option value="CHECKING">Courant</option>
                  <option value="SAVINGS">Épargne</option>
                  <option value="BUSINESS">Business</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banque</label>
                <select className="select-field" value={form.bankId} onChange={(e) => setForm({ ...form, bankId: e.target.value })} required>
                  {banks.length === 0 && <option value="">S&eacute;lectionner une banque</option>}
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>{bank.name}</option>
                    ))}
                </select>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Création...' : 'Créer le compte'}</button>
          </form>
        </div>
      )}

      {(showDeposit || showWithdraw) && (
        <div className="card border-primary-200 bg-gradient-to-br from-white to-rose-50/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">{showDeposit ? 'Effectuer un dépôt' : 'Effectuer un retrait'}</h2>
            <button onClick={() => { setShowDeposit(false); setShowWithdraw(false); }}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleTransaction(showDeposit ? 'deposit' : 'withdraw'); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compte</label>
                <select className="select-field" value={txForm.accountId} onChange={(e) => setTxForm({ ...txForm, accountId: e.target.value })} required>
                  {accounts.length === 0 && <option value="">S&eacute;lectionner un compte</option>}
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.owner_name} — {a.account_number}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                <input type="number" min="1" className="input-field" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" className="input-field" value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} placeholder={showDeposit ? 'Ex: Salaire' : 'Ex: Retrait DAB'} />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Traitement...' : (showDeposit ? 'Déposer' : 'Retirer')}</button>
          </form>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Dernières transactions</h2>
        {transactions.length === 0 ? (
          <div className="card text-center py-8">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune transaction</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((tx) => {
              const isDeposit = tx.type === 'DEPOSIT';
              const isWithdrawal = tx.type === 'WITHDRAWAL';
              return (
                <div key={tx.id} className="card-hover flex items-center gap-4">
                  <div className={`w-12 h-12 ${isDeposit ? 'bg-emerald-100' : isWithdrawal ? 'bg-red-100' : 'bg-violet-100'} rounded-xl flex items-center justify-center`}>
                    {isDeposit ? <ArrowDownRight className="w-5 h-5 text-emerald-600" /> : isWithdrawal ? <ArrowUpRight className="w-5 h-5 text-red-600" /> : <ArrowLeftRight className="w-5 h-5 text-violet-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{tx.description || tx.type}</p>
                    <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                  </div>
                  <p className={`font-bold ${isDeposit ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isDeposit ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
              <button onClick={() => setEditAccount(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du titulaire</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" className="input-field pl-10" value={editAccount.owner_name} onChange={(e) => setEditAccount({ ...editAccount, owner_name: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" className="input-field pl-10" value={editAccount.owner_email} onChange={(e) => setEditAccount({ ...editAccount, owner_email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de compte</label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select className="select-field pl-10 appearance-none" value={editAccount.account_type} onChange={(e) => setEditAccount({ ...editAccount, account_type: e.target.value })}>
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
                <button type="button" onClick={() => setEditAccount(null)} className="btn-secondary">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientDashboard;
