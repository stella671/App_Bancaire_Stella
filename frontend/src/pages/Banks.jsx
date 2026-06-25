import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  X,
  Landmark,
  Globe,
  Hash,
  Loader2,
  Building,
  Trash2,
} from 'lucide-react';
import { bankApi } from '../api/client';

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
        <Building className="w-10 h-10 text-primary-400" />
      </div>
      <h3 className="font-bold text-gray-900 text-xl">Aucune banque</h3>
      <p className="text-gray-500 mt-2">Commencez par ajouter votre premi&egrave;re banque</p>
    </div>
  );
}

function Banks() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', country: '' });

  useEffect(() => {
    fetchBanks();
  }, []);

  async function fetchBanks() {
    try {
      const res = await bankApi.getAll();
      setBanks(res.data);
    } catch (err) {
      console.error('Error fetching banks:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;
    setSubmitting(true);
    try {
      const res = await bankApi.create(form);
      setBanks((prev) => [res.data, ...prev]);
      setForm({ name: '', code: '', country: '' });
      setShowForm(false);
    } catch (err) {
      console.error('Error creating bank:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Voulez-vous vraiment supprimer cette banque ?')) return;
    try {
      await bankApi.delete(id);
      setBanks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Error deleting bank:', err);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banques</h1>
          <p className="text-gray-500 mt-1">G&eacute;rez vos institutions bancaires</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/25"
        >
          <Plus className="w-5 h-5" />
          Nouvelle banque
        </button>
      </div>

      {showForm && (
        <div className="card border-primary-200 bg-gradient-to-br from-white to-rose-50/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <Landmark className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Ajouter une banque</h2>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de la banque</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ex: Soci&eacute;t&eacute; G&eacute;n&eacute;rale"
                    className="input-field pl-10"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Code banque</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ex: SGCM"
                    className="input-field pl-10"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ex: Cameroun"
                    className="input-field pl-10"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Cr&eacute;ation...' : 'Cr&eacute;er la banque'}
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
      ) : banks.length === 0 ? (
        <div className="grid grid-cols-1">
          <EmptyState />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banks.map((bank) => (
            <div key={bank.id} className="card-hover group relative">
              <button
                onClick={() => handleDelete(bank.id)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/80 opacity-0 group-hover:opacity-100 hover:bg-red-50 flex items-center justify-center transition-all duration-200 shadow-sm border border-gray-200"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-rose-100 rounded-2xl flex items-center justify-center shadow-sm">
                  <Landmark className="w-7 h-7 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg truncate">{bank.name}</h3>
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{bank.code}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Globe className="w-4 h-4" />
                  <span>{bank.country || 'Pays non sp&eacute;cifi&eacute;'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span>{bank.account_count || 0} compte{bank.account_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Banks;
