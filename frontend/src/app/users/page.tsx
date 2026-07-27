'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import AddBalanceModal from '@/components/AddBalanceModal';

interface User {
  id: number;
  telegramId: string;
  username: string | null;
  saldo: number;
  role: string;
  isBlocked: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const router = useRouter();

  const load = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/');
      const data = await api.getUsers();
      setUsers(data);
    } catch {
      router.push('/');
    }
  };

  useEffect(() => { load(); }, [router]);

  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminId, setNewAdminId] = useState('');
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [createAdminError, setCreateAdminError] = useState('');

  const [adminModal, setAdminModal] = useState<{ telegramId: string; username: string } | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordModal, setPasswordModal] = useState<{ telegramId: string; username: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleBlock = async (telegramId: string) => {
    try {
      await api.blockUser(telegramId);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (!confirm(`Eliminar usuario "${username}" (ID ${id})?\nSe borrarán todas sus compras, transacciones y depositos.`)) return;
    try {
      await api.deleteUser(id);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSetPassword = async () => {
    if (!passwordModal || !newPassword) return;
    try {
      await api.setPassword(passwordModal.telegramId, newPassword);
      setPasswordModal(null);
      setNewPassword('');
      alert('Contrasena actualizada');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMakeAdmin = async () => {
    if (!adminModal || !adminPassword) return;
    try {
      await api.makeAdmin(adminModal.telegramId, adminPassword);
      setAdminModal(null);
      setAdminPassword('');
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAdminError('');
    if (!newAdminId || !newAdminPass) { setCreateAdminError('Completa todos los campos'); return; }
    try {
      await api.makeAdmin(newAdminId, newAdminPass, newAdminUser || undefined);
      setShowCreateAdmin(false);
      setNewAdminId('');
      setNewAdminUser('');
      setNewAdminPass('');
      load();
    } catch (err: any) {
      setCreateAdminError(err.message);
    }
  };

  return (
    <>
      <Navbar />
      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <button onClick={() => setShowCreateAdmin(true)} className="bg-pink-500 hover:bg-pink-600 text-white rounded-lg px-4 py-2 text-sm transition">
            + Crear Admin
          </button>
        </div>

        <div className="bg-white border border-pink-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pink-200 text-gray-500">
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Telegram</th>
                <th className="text-left p-4">Username</th>
                <th className="text-left p-4">Saldo</th>
                <th className="text-left p-4">Rol</th>
                <th className="text-left p-4">Estado</th>
                <th className="text-right p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-pink-100 hover:bg-pink-50/50">
                  <td className="p-4">{u.id}</td>
                  <td className="p-4 font-mono text-xs">{u.telegramId}</td>
                  <td className="p-4">{u.username || '-'}</td>
                  <td className="p-4">${u.saldo}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${u.role === 'ADMIN' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-500'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${u.isBlocked ? 'bg-rose-100 text-rose-500' : 'bg-sky-100 text-sky-600'}`}>
                      {u.isBlocked ? 'Bloqueado' : 'Activo'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="bg-sky-400 hover:bg-sky-500 text-white text-xs px-3 py-1.5 rounded mr-2 transition"
                    >
                      + Saldo
                    </button>
                    <button
                      onClick={() => handleBlock(u.telegramId)}
                      className={`text-xs px-3 py-1.5 rounded transition ${u.isBlocked ? 'bg-sky-400 hover:bg-sky-500 text-white' : 'bg-rose-400 hover:bg-rose-500 text-white'}`}
                    >
                      {u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                    <button
                      onClick={() => setPasswordModal({ telegramId: u.telegramId, username: u.username || `ID ${u.id}` })}
                      className="text-xs px-3 py-1.5 rounded bg-sky-300 hover:bg-sky-400 text-white transition ml-1"
                    >
                      Pass
                    </button>
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => setAdminModal({ telegramId: u.telegramId, username: u.username || `ID ${u.id}` })}
                        className="text-xs px-3 py-1.5 rounded bg-pink-500 hover:bg-pink-600 text-white transition ml-1"
                      >
                        Admin
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(u.id, u.username || `ID ${u.id}`)}
                      className="text-xs px-3 py-1.5 rounded bg-rose-400 hover:bg-rose-500 text-white transition ml-1"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedUser && (
          <AddBalanceModal
            telegramId={selectedUser.telegramId}
            username={selectedUser.username || `ID ${selectedUser.id}`}
            onClose={() => setSelectedUser(null)}
            onSuccess={load}
          />
        )}

        {showCreateAdmin && (
          <div className="fixed inset-0 bg-pink-900/20 flex items-center justify-center z-50" onClick={() => setShowCreateAdmin(false)}>
            <div className="bg-white p-6 rounded-xl w-96 border border-pink-200 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4 text-gray-800">Crear Administrador</h2>
              {createAdminError && <div className="bg-rose-50 text-rose-500 p-3 rounded-lg mb-4 text-sm border border-rose-200">{createAdminError}</div>}
              <form onSubmit={handleCreateAdmin}>
                <input type="text" value={newAdminId} onChange={(e) => setNewAdminId(e.target.value)}
                  className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-pink-400"
                  placeholder="Telegram ID" required />
                <input type="text" value={newAdminUser} onChange={(e) => setNewAdminUser(e.target.value)}
                  className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-pink-400"
                  placeholder="Username (opcional)" />
                <input type="password" value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)}
                  className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-pink-400"
                  placeholder="Contrasena" required />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCreateAdmin(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-lg py-2 transition">Cancelar</button>
                  <button type="submit" className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-lg py-2 transition">Crear</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {adminModal && (
          <div className="fixed inset-0 bg-pink-900/20 flex items-center justify-center z-50" onClick={() => { setAdminModal(null); setAdminPassword(''); }}>
            <div className="bg-white p-6 rounded-xl w-96 border border-pink-200 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-2 text-gray-800">Hacer Admin</h2>
              <p className="text-sm text-gray-500 mb-4">{adminModal.username}</p>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-pink-400"
                placeholder="Contrasena para el admin"
              />
              <div className="flex gap-3">
                <button onClick={() => { setAdminModal(null); setAdminPassword(''); }} className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-lg py-2 transition">Cancelar</button>
                <button onClick={handleMakeAdmin} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-lg py-2 transition">Hacer Admin</button>
              </div>
            </div>
          </div>
        )}

        {passwordModal && (
          <div className="fixed inset-0 bg-pink-900/20 flex items-center justify-center z-50" onClick={() => { setPasswordModal(null); setNewPassword(''); }}>
            <div className="bg-white p-6 rounded-xl w-96 border border-pink-200 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-2 text-gray-800">Cambiar contrasena</h2>
              <p className="text-sm text-gray-500 mb-4">{passwordModal.username}</p>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-pink-400"
                placeholder="Nueva contrasena"
              />
              <div className="flex gap-3">
                <button onClick={() => { setPasswordModal(null); setNewPassword(''); }} className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-lg py-2 transition">Cancelar</button>
                <button onClick={handleSetPassword} className="flex-1 bg-sky-400 hover:bg-sky-500 text-white rounded-lg py-2 transition">Cambiar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
