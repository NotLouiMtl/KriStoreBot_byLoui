'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [telegramId, setTelegramId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.login(telegramId, password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl w-96 border border-pink-200 shadow-lg shadow-pink-100">
        <h1 className="text-2xl font-bold mb-6 text-center text-pink-500">Panel Admin</h1>

        {error && <div className="bg-rose-50 text-rose-500 p-3 rounded-lg mb-4 text-sm border border-rose-200">{error}</div>}

        <label className="block text-sm text-gray-500 mb-2">Telegram ID o Usuario</label>
        <input
          type="text"
          value={telegramId}
          onChange={(e) => setTelegramId(e.target.value)}
          className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-pink-400"
          placeholder="123456789 o username"
          required
        />

        <label className="block text-sm text-gray-500 mb-2">Contrasena</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-pink-400"
          placeholder="••••••••"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-400 hover:bg-sky-500 disabled:opacity-50 rounded-lg py-3 font-semibold transition text-white"
        >
          {loading ? 'Entrando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
