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
    if (isNaN(n) || n < 1) return alert('Numero de perfiles invalido');
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

  const getDaysBadge = (days: number) => {
    if (days <= 5) return 'bg-rose-100 text-rose-500';
    if (days <= 15) return 'bg-amber-100 text-amber-600';
    return 'bg-sky-100 text-sky-600';
  };

  return (
    <>
      <Navbar />
      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Stock</h1>
          <div className="flex gap-2">
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="bg-sky-300 hover:bg-sky-400 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm transition"
            >
              {migrating ? 'Migrando...' : 'Migrar convertidas'}
            </button>
            <button
              onClick={() => setShowBulk(true)}
              className="bg-pink-400 hover:bg-pink-500 text-white rounded-lg px-4 py-2 text-sm transition"
            >
              + Importacion masiva
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-sky-400 hover:bg-sky-500 text-white rounded-lg px-4 py-2 text-sm transition"
            >
              + Agregar stock
            </button>
          </div>
        </div>

        {stock && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-pink-200 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Total unidades</p>
                <p className="text-xl font-bold text-sky-500">{stock.total}</p>
              </div>
              <div className="bg-white border border-pink-200 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Disponibles</p>
                <p className="text-xl font-bold text-pink-500">{stock.available}</p>
              </div>
              <div className="bg-white border border-pink-200 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Vendidos</p>
                <p className="text-xl font-bold text-rose-400">{stock.sold}</p>
              </div>
            </div>

            <div className="bg-white border border-pink-200 rounded-xl overflow-hidden mb-6 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pink-200 text-gray-500">
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
                      <tr key={s.id} className="border-b border-pink-100 hover:bg-pink-50/50">
                        <td className="p-4 font-medium">{s.name}</td>
                        <td className="p-4">{s.accounts}</td>
                        <td className="p-4">{s.fullAvailable}</td>
                        <td className="p-4">{s.profileAvailable}</td>
                        <td className="p-4 font-bold">{s.available}</td>
                      </tr>
                      {s.fullAccounts.length > 0 && s.fullAccounts.map((a: any) => (
                        <tr key={a.id} className="border-b border-pink-50 bg-pink-50/30">
                          <td className="p-3 pl-8 text-xs text-gray-500" colSpan={2}>
                            #{a.id} — {a.email}
                            {a.daysRemaining !== undefined && (
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${getDaysBadge(a.daysRemaining)}`}>
                                {a.daysRemaining}d
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={convertProfiles[a.id] || '5'}
                              onChange={(e) => setConvertProfiles({ ...convertProfiles, [a.id]: e.target.value })}
                              className="bg-pink-50 border border-pink-200 rounded px-2 py-1 w-16 text-xs focus:outline-none focus:border-pink-400"
                              min="1" max="10"
                            />
                          </td>
                          <td className="p-3" colSpan={2}>
                            <button onClick={() => handleConvert(a.id)}
                              className="bg-sky-300 hover:bg-sky-400 text-white text-xs rounded px-3 py-1 transition mr-2">
                              Convertir
                            </button>
                            <button onClick={() => setEditAccount(a)}
                              className="bg-sky-400 hover:bg-sky-500 text-white text-xs rounded px-3 py-1 transition mr-2">
                              Editar
                            </button>
                            <button onClick={() => handleDeleteAccount(a.id)}
                              className="bg-rose-400 hover:bg-rose-500 text-white text-xs rounded px-3 py-1 transition">
                              Borrar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {s.profileAccounts && s.profileAccounts.length > 0 && s.profileAccounts.map((a: any) => (
                        <tr key={`p-${a.id}`} className="border-b border-pink-50 bg-sky-50/30">
                          <td className="p-3 pl-8 text-xs text-sky-600" colSpan={2}>
                            #{a.id} — {a.email} ({a.profileCount} perfiles)
                            {a.daysRemaining !== undefined && (
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${getDaysBadge(a.daysRemaining)}`}>
                                {a.daysRemaining}d
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-xs text-sky-500" colSpan={2}>
                            Perfiles: {a.profiles.map((p: any) =>
                              `${p.profileNumber}${p.isOccupied ? '(vendido)' : '(libre)'}`
                            ).join(', ')}
                          </td>
                          <td className="p-3">
                            <button onClick={() => setEditAccount({ id: a.id, email: a.email, password: '', pin: '' })}
                              className="bg-sky-400 hover:bg-sky-500 text-white text-xs rounded px-2 py-1 transition mr-1">
                              Editar
                            </button>
                            <button onClick={() => handleDeleteAccount(a.id)}
                              className="bg-rose-400 hover:bg-rose-500 text-white text-xs rounded px-2 py-1 transition">
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

            <h2 className="text-xl font-bold mb-4 text-gray-800">Todas las cuentas</h2>
            <div className="bg-white border border-pink-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pink-200 text-gray-500">
                    <th className="text-left p-4">#</th>
                    <th className="text-left p-4">Servicio</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Tipo</th>
                    <th className="text-left p-4">Dias</th>
                    <th className="text-left p-4">Estado</th>
                    <th className="text-left p-4">Perfiles</th>
                    <th className="text-left p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.filter(a => a.service).map((a: any) => (
                    <tr key={a.id} className="border-b border-pink-100 hover:bg-pink-50/50">
                      <td className="p-3 text-gray-400">{a.id}</td>
                      <td className="p-3">{a.service.name}</td>
                      <td className="p-3 text-xs">{a.email}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${a.type === 'full' ? 'bg-sky-100 text-sky-600' : 'bg-pink-100 text-pink-600'}`}>
                          {a.type === 'full' ? 'Completa' : 'Perfiles'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${getDaysBadge(a.daysRemaining || 0)}`}>
                          {a.daysRemaining || 0}d
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs ${a.isOccupied ? 'text-rose-400' : 'text-sky-500'}`}>
                          {a.isOccupied ? 'Vendida' : 'Disponible'}
                        </span>
                      </td>
                      <td className="p-3 text-xs">
                        {a.type === 'profile' && (
                          <div className="space-y-1">
                            {a.profiles.length === 0 && <span className="text-gray-400">sin perfiles</span>}
                            {a.profiles.map((p: any) => (
                              <div key={p.id} className="flex items-center gap-2">
                                <span className={p.isOccupied ? 'text-rose-400 line-through' : 'text-sky-500'}>
                                  #{p.profileNumber}
                                </span>
                                {p.pin && <span className="text-gray-400">PIN: {p.pin}</span>}
                                {!p.isOccupied && (
                                  <>
                                    <button onClick={() => setEditProfile({ id: p.id, pin: p.pin || '' })}
                                      className="text-sky-400 hover:text-sky-500 text-xs">editar</button>
                                    <button onClick={() => handleDeleteProfile(p.id)}
                                      className="text-rose-400 hover:text-rose-500 text-xs">borrar</button>
                                  </>
                                )}
                              </div>
                            ))}
                            {!a.isOccupied && (
                              <div className="flex gap-1 items-center mt-1">
                                <input type="number" value={addMore[a.id] || '1'}
                                  onChange={(e) => setAddMore({ ...addMore, [a.id]: e.target.value })}
                                  className="bg-pink-50 border border-pink-200 rounded px-1 py-0.5 w-12 text-xs focus:outline-none focus:border-pink-400" min="1" max="10" />
                                <button onClick={() => handleAddProfiles(a.id)}
                                  className="text-pink-500 hover:text-pink-600 text-xs">+ agregar</button>
                              </div>
                            )}
                          </div>
                        )}
                        {a.type === 'full' && (
                          <span className={`text-xs ${a.isOccupied ? 'text-rose-400' : 'text-sky-500'}`}>
                            {a.isOccupied ? 'Vendida' : 'Disponible'}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <button onClick={() => setEditAccount(a)}
                          className="bg-sky-400 hover:bg-sky-500 text-white text-xs rounded px-2 py-1 transition mr-1">
                          Editar
                        </button>
                        <button onClick={() => handleDeleteAccount(a.id)}
                          className="bg-rose-400 hover:bg-rose-500 text-white text-xs rounded px-2 py-1 transition">
                          Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {accounts.filter(a => a.service).length === 0 && (
                    <tr><td colSpan={8} className="p-4 text-gray-400 text-center">Sin cuentas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {showCreate && <CreateAccountModal onClose={() => setShowCreate(false)} onSuccess={load} />}
        {showBulk && <BulkImportModal onClose={() => setShowBulk(false)} onSuccess={load} />}

        {editAccount && (
          <div className="fixed inset-0 bg-pink-900/20 flex items-center justify-center z-50" onClick={() => !saving && setEditAccount(null)}>
            <div className="bg-white p-6 rounded-xl w-96 border border-pink-200 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4 text-gray-800">Editar cuenta #{editAccount.id}</h2>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input value={editAccount.email} onChange={(e) => setEditAccount({ ...editAccount, email: e.target.value })}
                className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-pink-400" />
              <label className="block text-xs text-gray-500 mb-1">Contrasena</label>
              <input value={editAccount.password} onChange={(e) => setEditAccount({ ...editAccount, password: e.target.value })}
                className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-pink-400" />
              <label className="block text-xs text-gray-500 mb-1">PIN</label>
              <input value={editAccount.pin || ''} onChange={(e) => setEditAccount({ ...editAccount, pin: e.target.value })}
                className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-pink-400" />
              <div className="flex gap-3">
                <button onClick={() => setEditAccount(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-lg py-2 transition" disabled={saving}>Cancelar</button>
                <button onClick={handleSaveAccount} className="flex-1 bg-pink-400 hover:bg-pink-500 text-white rounded-lg py-2 transition" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {editProfile && (
          <div className="fixed inset-0 bg-pink-900/20 flex items-center justify-center z-50" onClick={() => !saving && setEditProfile(null)}>
            <div className="bg-white p-6 rounded-xl w-80 border border-pink-200 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4 text-gray-800">Editar perfil #{editProfile.id}</h2>
              <label className="block text-xs text-gray-500 mb-1">PIN</label>
              <input value={editProfile.pin} onChange={(e) => setEditProfile({ ...editProfile, pin: e.target.value })}
                className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-pink-400" />
              <div className="flex gap-3">
                <button onClick={() => setEditProfile(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-lg py-2 transition" disabled={saving}>Cancelar</button>
                <button onClick={handleSaveProfile} className="flex-1 bg-pink-400 hover:bg-pink-500 text-white rounded-lg py-2 transition" disabled={saving}>
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
