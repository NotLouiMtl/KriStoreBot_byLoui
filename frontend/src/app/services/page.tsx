'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';

interface Service {
  id: number;
  name: string;
  price: number;
  active: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [createError, setCreateError] = useState('');
  const router = useRouter();

  const load = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/');
      const data = await api.getServices();
      setServices(data);
    } catch {
      router.push('/');
    }
  };

  useEffect(() => { load(); }, [router]);

  const handleToggleActive = async (id: number, active: boolean) => {
    try {
      await api.updateService(id, { active: !active });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Borrar "${name}" y todas sus cuentas/perfiles?`)) return;
    try {
      await api.deleteService(id);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSave = async (id: number) => {
    try {
      await api.updateService(id, { name: editName, price: Number(editPrice) });
      setEditingId(null);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      await api.createService({ name: newName, price: Number(newPrice) });
      setShowCreate(false);
      setNewName('');
      setNewPrice('');
      load();
    } catch (err: any) {
      setCreateError(err.message);
    }
  };

  return (
    <>
      <Navbar />
      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Servicios</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-sky-400 hover:bg-sky-500 text-white rounded-lg px-4 py-2 text-sm transition"
          >
            + Crear servicio
          </button>
        </div>

        <div className="bg-white border border-pink-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pink-200 text-gray-500">
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Nombre</th>
                <th className="text-left p-4">Precio</th>
                <th className="text-left p-4">Activo</th>
                <th className="text-right p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-pink-100 hover:bg-pink-50/50">
                  <td className="p-4">{s.id}</td>
                  <td className="p-4">
                    {editingId === s.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-pink-50 border border-pink-200 rounded px-2 py-1 w-48 focus:outline-none focus:border-pink-400"
                      />
                    ) : (
                      s.name
                    )}
                  </td>
                  <td className="p-4">
                    {editingId === s.id ? (
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="bg-pink-50 border border-pink-200 rounded px-2 py-1 w-24 focus:outline-none focus:border-pink-400"
                        step="0.01"
                      />
                    ) : (
                      `$${s.price}`
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${s.active ? 'bg-sky-100 text-sky-600' : 'bg-rose-100 text-rose-500'}`}>
                      {s.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {editingId === s.id ? (
                      <>
                        <button onClick={() => handleSave(s.id)} className="text-pink-500 hover:text-pink-600 text-xs px-3 py-1.5 rounded bg-pink-100 mr-2 transition">
                          Guardar
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-500 text-xs px-3 py-1.5 rounded bg-gray-100 transition">
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(s.id); setEditName(s.name); setEditPrice(s.price.toString()); }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded mr-2 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleActive(s.id, s.active)}
                          className={`text-xs px-3 py-1.5 rounded transition ${s.active ? 'bg-rose-400 hover:bg-rose-500 text-white' : 'bg-sky-400 hover:bg-sky-500 text-white'}`}
                        >
                          {s.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="text-xs px-3 py-1.5 rounded bg-gray-100 hover:bg-rose-100 text-rose-400 transition ml-1"
                        >
                          Borrar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-pink-900/20 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
            <div className="bg-white p-6 rounded-xl w-96 border border-pink-200 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4 text-gray-800">Crear servicio</h2>

              {createError && <div className="bg-rose-50 text-rose-500 p-3 rounded-lg mb-4 text-sm border border-rose-200">{createError}</div>}

              <form onSubmit={handleCreate}>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-pink-400"
                  placeholder="Nombre del servicio"
                  required
                />
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-pink-400"
                  placeholder="Precio"
                  min="0"
                  step="0.01"
                  required
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCreate(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-lg py-2 transition">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 bg-pink-400 hover:bg-pink-500 text-white rounded-lg py-2 transition">
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
