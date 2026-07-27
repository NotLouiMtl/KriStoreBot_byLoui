'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
  user: { id: number; username: string | null; telegramId: string };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/');
    api.getTransactions().then(setTransactions).catch(() => router.push('/'));
  }, [router]);

  return (
    <>
      <Navbar />
      <main className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Transacciones</h1>

        <div className="bg-white border border-pink-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pink-200 text-gray-500">
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Usuario</th>
                <th className="text-left p-4">Tipo</th>
                <th className="text-left p-4">Monto</th>
                <th className="text-left p-4">Descripcion</th>
                <th className="text-right p-4">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-pink-100 hover:bg-pink-50/50">
                  <td className="p-4">{t.id}</td>
                  <td className="p-4">{t.user.username || `#${t.user.id}`}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      t.type === 'deposit' ? 'bg-sky-100 text-sky-600' :
                      t.type === 'purchase' ? 'bg-pink-100 text-pink-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{t.type}</span>
                  </td>
                  <td className="p-4">${Number(t.amount).toFixed(2)}</td>
                  <td className="p-4 text-gray-500 text-xs">{t.description || '-'}</td>
                  <td className="p-4 text-right text-xs text-gray-400">
                    {new Date(t.createdAt).toLocaleString('es-MX')}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-gray-400">Sin transacciones</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
