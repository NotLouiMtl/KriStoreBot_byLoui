'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface Props {
  telegramId: string;
  username: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddBalanceModal({ telegramId, username, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const value = mode === 'remove' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
      await api.addBalance(telegramId, value);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-pink-900/20 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-xl w-96 border border-pink-200 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-1 text-gray-800">{mode === 'add' ? 'Agregar' : 'Remover'} saldo</h2>
        <p className="text-sm text-gray-500 mb-4">{username} ({telegramId})</p>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('add')}
            className={`flex-1 py-2 rounded-lg transition ${mode === 'add' ? 'bg-sky-400 text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            Agregar
          </button>
          <button
            onClick={() => setMode('remove')}
            className={`flex-1 py-2 rounded-lg transition ${mode === 'remove' ? 'bg-rose-400 text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            Remover
          </button>
        </div>

        {error && <div className="bg-rose-50 text-rose-500 p-3 rounded-lg mb-4 text-sm border border-rose-200">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-pink-400"
            placeholder="Monto"
            min="1"
            required
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-lg py-2 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 disabled:opacity-50 rounded-lg py-2 transition text-white ${mode === 'add' ? 'bg-sky-400 hover:bg-sky-500' : 'bg-rose-400 hover:bg-rose-500'}`}
            >
              {loading ? 'Procesando...' : mode === 'add' ? 'Agregar' : 'Remover'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
