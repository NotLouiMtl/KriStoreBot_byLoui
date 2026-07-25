'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import CreateAccountModal from '@/components/CreateAccountModal';
import BulkImportModal from '@/components/BulkImportModal';

export default function StockPage() {
  const [stock, setStock] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showDetail, setShowDetail] = useState<number | null>(null);
  const [editAccount, setEditAccount] = useState<any>(null);
  const [editProfile, setEditProfile] = useState<any>(null);
  const [convertProfiles, setConvertProfiles] = useState<Record<number, string>>({});
  const [addMore, setAddMore] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const router = useRouter();

  const load = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/');
      const [stockData, accountsData] = await Promise.all([api.getStock(), api.getAllAccounts()]);
      setStock(stockData);
      setAccounts(accountsData);
    } catch {
      router.push('/');
    }
  };

  useEffect(() => { load(); }, [router]);

  const handleConvert = async (accountId: number) => {
    const n = parseInt(convertProfiles[accountId] || '5');
    if (isNaN(n) || n < 1) return alert('Número de perfiles inválido');
    if (!confirm(`Convertir cuenta #${accountId} a ${n} perfiles?`)) return;
    try {
      await api.convertAccount(accountId, n);
      const next = { ...convertProfiles };
      delete next[accountId];
      setConvertProfiles(next);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm(`Eliminar cuenta #${id} y todos sus datos?`)) return;
    try {
      await api.deleteAccount(id);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteProfile = async (id: number) => {
    if (!confirm(`Eliminar perfil #${id}?`)) return;
    try {
      await api.deleteProfile(id);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveAccount = async () => {
    if (!editAccount) return;
    setSaving(true);
    try {
      await api.updateAccount(editAccount.id, { email: editAccount.email, password: editAccount.password, pin: editAccount.pin });
      setEditAccount(null);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editProfile) return;
    setSaving(true);
    try {
      await api.updateProfile(editProfile.id, { pin: editProfile.pin });
      setEditProfile(null);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddProfiles = async (accountId: number) => {
    const count = parseInt(addMore[accountId] || '1');
    if (isNaN(count) || count < 1) return alert('Numero invalido');
    try {
      await api.addProfiles(accountId, count);
      const next = { ...addMore };
      delete next[accountId];
      setAddMore(next);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMigrate = async () => {
    if (!confirm('Crear servicios de perfil y migrar cuentas convertidas?')) return;
    setMigrating(true);
    try {
      const result: any = await api.migrateConverted();
      alert(`Servicios creados: ${result.servicesCreated}\nCuentas migradas: ${result.migrated}`);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Stock</h1>
          <div className="flex gap-2">
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg px-4 py-2 text-sm transition"
            >
              {migrating ? 'Migrando...' : 'Migrar convertidas'}
            </button>
            <button
              onClick={() => setShowBulk(true)}
              className="bg-purple-600 hover:bg-purple-700 rounded-lg px-4 py-2 text-sm transition"
            >
              + Importacion masiva
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 text-sm transition"
            >
              + Agregar stock
            </button>
          </div>
        </div>

        {stock && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-400">Total unidades</p>
                <p className="text-xl font-bold text-blue-400">{stock.total}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-400">Disponibles</p>
                <p className="text-xl font-bold text-green-400">{stock.available}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-400">Vendidos</p>
                <p className="text-xl font-bold text-red-400">{stock.sold}</p>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="text-left p-4">Servicio</th>
                    <th className="text-left p-4">Cuentas</th>
                    <th className="text-left p-4">Completas</th>
                    <th className="text-left p-4">Perfiles libres</th>
                    <th className="text-left p-4">Total disp.</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.summary.map((s: any) => (
                    <>
                      <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="p-4 font-medium">{s.name}</td>
                        <td className="p-4">{s.accounts}</td>
                        <td className="p-4">{s.fullAvailable}</td>
                        <td className="p-4">{s.profileAvailable}</td>
                        <td className="p-4 font-bold">{s.available}</td>
                      </tr>
                      {s.fullAccounts.length > 0 && s.fullAccounts.map((a: any) => (
                        <tr key={a.id} className="border-b border-gray-800/30 bg-gray-800/20">
                          <td className="p-3 pl-8 text-xs text-gray-400" colSpan={2}>
                            #{a.id} — {a.email}
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={convertProfiles[a.id] || '5'}
                              onChange={(e) => setConvertProfiles({ ...convertProfiles, [a.id]: e.target.value })}
                              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-16 text-xs"
                              min="1" max="10"
                            />
                          </td>
                          <td className="p-3" colSpan={2}>
                            <button onClick={() => handleConvert(a.id)}
                              className="bg-yellow-700 hover:bg-yellow-600 text-xs rounded px-3 py-1 transition mr-2">
                              Convertir
                            </button>
                            <button onClick={() => setEditAccount(a)}
                              className="bg-blue-700 hover:bg-blue-600 text-xs rounded px-3 py-1 transition mr-2">
                              Editar
                            </button>
                            <button onClick={() => handleDeleteAccount(a.id)}
                              className="bg-red-700 hover:bg-red-600 text-xs rounded px-3 py-1 transition">
                              Borrar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="text-xl font-bold mb-4">Todas las cuentas</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="text-left p-4">#</th>
                    <th className="text-left p-4">Servicio</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Tipo</th>
                    <th className="text-left p-4">Estado</th>
                    <th className="text-left p-4">Perfiles</th>
                    <th className="text-left p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.filter(a => a.service).map((a: any) => (
                    <tr key={a.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="p-3 text-gray-400">{a.id}</td>
                      <td className="p-3">{a.service.name}</td>
                      <td className="p-3 text-xs">{a.email}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${a.type === 'full' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-blue-900/50 text-blue-400'}`}>
                          {a.type === 'full' ? 'Completa' : 'Perfiles'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs ${a.isOccupied ? 'text-red-400' : 'text-green-400'}`}>
                          {a.isOccupied ? 'Vendida' : 'Disponible'}
                        </span>
                      </td>
                      <td className="p-3 text-xs">
                        {a.type === 'profile' && (
                          <div className="space-y-1">
                            {a.profiles.length === 0 && <span className="text-gray-500">sin perfiles</span>}
                            {a.profiles.map((p: any) => (
                              <div key={p.id} className="flex items-center gap-2">
                                <span className={p.isOccupied ? 'text-red-400 line-through' : 'text-green-400'}>
                                  #{p.profileNumber}
                                </span>
                                {p.pin && <span className="text-gray-500">PIN: {p.pin}</span>}
                                {!p.isOccupied && (
                                  <>
                                    <button onClick={() => setEditProfile({ id: p.id, pin: p.pin || '' })}
                                      className="text-blue-400 hover:text-blue-300 text-xs">editar</button>
                                    <button onClick={() => handleDeleteProfile(p.id)}
                                      className="text-red-400 hover:text-red-300 text-xs">borrar</button>
                                  </>
                                )}
                              </div>
                            ))}
                            {!a.isOccupied && (
                              <div className="flex gap-1 items-center mt-1">
                                <input type="number" value={addMore[a.id] || '1'}
                                  onChange={(e) => setAddMore({ ...addMore, [a.id]: e.target.value })}
                                  className="bg-gray-800 border border-gray-700 rounded px-1 py-0.5 w-12 text-xs" min="1" max="10" />
                                <button onClick={() => handleAddProfiles(a.id)}
                                  className="text-green-400 hover:text-green-300 text-xs">+ agregar</button>
                              </div>
                            )}
                          </div>
                        )}
                        {a.type === 'full' && (
                          <span className={`text-xs ${a.isOccupied ? 'text-red-400' : 'text-green-400'}`}>
                            {a.isOccupied ? 'Vendida' : 'Disponible'}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <button onClick={() => setEditAccount(a)}
                          className="bg-blue-700 hover:bg-blue-600 text-xs rounded px-2 py-1 transition mr-1">
                          Editar
                        </button>
                        <button onClick={() => handleDeleteAccount(a.id)}
                          className="bg-red-700 hover:bg-red-600 text-xs rounded px-2 py-1 transition">
                          Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {accounts.filter(a => a.service).length === 0 && (
                    <tr><td colSpan={7} className="p-4 text-gray-500 text-center">Sin cuentas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {showCreate && <CreateAccountModal onClose={() => setShowCreate(false)} onSuccess={load} />}
        {showBulk && <BulkImportModal onClose={() => setShowBulk(false)} onSuccess={load} />}

        {editAccount && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => !saving && setEditAccount(null)}>
            <div className="bg-gray-900 p-6 rounded-xl w-96 border border-gray-800" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">Editar cuenta #{editAccount.id}</h2>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input value={editAccount.email} onChange={(e) => setEditAccount({ ...editAccount, email: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-blue-500" />
              <label className="block text-xs text-gray-400 mb-1">Contraseña</label>
              <input value={editAccount.password} onChange={(e) => setEditAccount({ ...editAccount, password: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-blue-500" />
              <label className="block text-xs text-gray-400 mb-1">PIN</label>
              <input value={editAccount.pin || ''} onChange={(e) => setEditAccount({ ...editAccount, pin: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-blue-500" />
              <div className="flex gap-3">
                <button onClick={() => setEditAccount(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-lg py-2 transition" disabled={saving}>Cancelar</button>
                <button onClick={handleSaveAccount} className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg py-2 transition" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {editProfile && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => !saving && setEditProfile(null)}>
            <div className="bg-gray-900 p-6 rounded-xl w-80 border border-gray-800" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">Editar perfil #{editProfile.id}</h2>
              <label className="block text-xs text-gray-400 mb-1">PIN</label>
              <input value={editProfile.pin} onChange={(e) => setEditProfile({ ...editProfile, pin: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-blue-500" />
              <div className="flex gap-3">
                <button onClick={() => setEditProfile(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-lg py-2 transition" disabled={saving}>Cancelar</button>
                <button onClick={handleSaveProfile} className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg py-2 transition" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}