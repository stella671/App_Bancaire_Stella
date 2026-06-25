import { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, X, UserPlus, Trash2, Shield, User, Loader2 } from 'lucide-react';
import api from '../api/client';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'user' });

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/users', form);
      setUsers((prev) => [...prev, res.data]);
      setForm({ username: '', password: '', role: 'user' });
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500 mt-1">G&eacute;rer les comptes utilisateurs</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/25">
          <Plus className="w-5 h-5" />
          Nouvel utilisateur
        </button>
      </div>

      {showForm && (
        <div className="card border-primary-200 bg-gradient-to-br from-white to-rose-50/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Cr&eacute;er un utilisateur</h2>
            </div>
            <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Identifiant</label>
                <input type="text" placeholder="Ex: jean" className="input-field" value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                <input type="password" placeholder="••••••" className="input-field" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rôle</label>
                <select className="select-field" value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Création...' : 'Créer l\'utilisateur'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="card"><div className="skeleton h-12 w-full" /></div>)}</div>
      ) : users.length === 0 ? (
        <div className="card text-center py-12">
          <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun utilisateur</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="card-hover flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-rose-100 rounded-2xl flex items-center justify-center">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{u.username}</p>
                  {u.role === 'admin' ? (
                    <span className="text-xs bg-primary-500/10 text-primary-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" /> admin
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">utilisateur</span>
                  )}
                </div>
              </div>
              <button onClick={() => handleDelete(u.id)}
                className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors">
                <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Users;
