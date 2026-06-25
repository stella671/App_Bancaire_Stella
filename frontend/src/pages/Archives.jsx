import { useState, useEffect } from 'react';
import {
  Archive,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { transactionApi } from '../api/client';

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

const typeConfig = {
  DEPOSIT: { label: 'Dépôt', icon: ArrowDownRight, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  WITHDRAWAL: { label: 'Retrait', icon: ArrowUpRight, color: 'text-red-600', bg: 'bg-red-100' },
  TRANSFER: { label: 'Virement', icon: ArrowLeftRight, color: 'text-blue-600', bg: 'bg-blue-100' },
};

function Archives() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArchived();
  }, []);

  async function fetchArchived() {
    try {
      const res = await transactionApi.getArchived();
      setTransactions(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des archives');
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
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center shadow-sm">
          <Archive className="w-7 h-7 text-amber-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Archives</h1>
          <p className="text-gray-500 mt-1">Transactions des comptes supprim&eacute;s</p>
        </div>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Archive className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 text-xl">Aucune archive</h3>
          <p className="text-gray-500 mt-2">
            Les transactions des comptes supprim&eacute;s appara&icirc;tront ici
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const config = typeConfig[tx.type] || typeConfig.DEPOSIT;
            const Icon = config.icon;
            return (
              <div key={tx.id} className="card-hover">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">{config.label}</p>
                      <p className="font-bold text-gray-900">{formatCurrency(tx.amount)}</p>
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
                    {tx.description && (
                      <p className="text-sm text-gray-500 mt-1 italic">{tx.description}</p>
                    )}
                    {tx.fee > 0 && (
                      <p className="text-xs text-gray-400">Frais: {formatCurrency(tx.fee)}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Archives;