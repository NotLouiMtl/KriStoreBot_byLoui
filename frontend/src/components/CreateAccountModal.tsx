'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAccountModal({ onClose, onSuccess }: Props) {
  const [services, setServices] = useState<{ id: number; name: string }[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [type, setType] = useState('profile');
  const [profiles, setProfiles] = useState('5');
  const [profilePins, setProfilePins] = useState<string[]>(['', '', '', '', '']);

  const updateProfilePins = (newCount: number) => {
    setProfilePins((prev) => {
      if (newCount > prev.length) return [...prev, ...Array(newCount - prev.length).fill('')];
      return prev.slice(0, newCount);
    });
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getServices().then(setServices).catch(() => {});
  }, []);

  const numProfiles = Number(profiles);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.createAccount({
        serviceId: Number(serviceId),
        email,
        password,
        pin: pin || undefined,
        type,
        profiles: type === 'profile' ? numProfiles : undefined,
        profilePins: type === 'profile' ? profilePins.slice(0, numProfiles).map((p) => p || undefined) as any : undefined,
      });
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
      <div className="bg-white p-6 rounded-xl w-96 border border-pink-200 shadow-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4 text-gray-800">Agregar stock</h2>

        {error && <div className="bg-rose-50 text-rose-500 p-3 rounded-lg mb-4 text-sm border border-rose-200">{error}</div>}

        <form onSubmit={handleSubmit}>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-pink-400"
            required
          >
            <option value="">Seleccionar servicio</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div className="flex gap-3 mb-3">
            <button type="button" onClick={() => setType('full')}
              className={`flex-1 py-2 rounded-lg text-sm transition ${type === 'full' ? 'bg-sky-400 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
              Cuenta completa
            </button>
            <button type="button" onClick={() => setType('profile')}
              className={`flex-1 py-2 rounded-lg text-sm transition ${type === 'profile' ? 'bg-sky-400 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
              Perfiles
            </button>
          </div>

          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-pink-400"
            placeholder="Email"
            required
          />

          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-pink-400"
            placeholder="Contrasena"
            required
          />

          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-pink-400"
            placeholder="PIN (opcional)"
          />

          {type === 'profile' && (
            <>
              <input
                type="number"
                value={profiles}
                onChange={(e) => {
                  setProfiles(e.target.value);
                  updateProfilePins(Number(e.target.value) || 0);
                }}
                className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-pink-400"
                placeholder="Numero de perfiles"
                min="1"
              />

              {Array.from({ length: numProfiles }, (_, i) => (
                <input
                  key={i}
                  type="text"
                  value={profilePins[i] || ''}
                  onChange={(e) => {
                    const newPins = [...profilePins];
                    newPins[i] = e.target.value;
                    setProfilePins(newPins);
                  }}
                  className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 mb-2 focus:outline-none focus:border-pink-400"
                  placeholder={`PIN del perfil #${i + 1} (opcional)`}
                />
              ))}
            </>
          )}

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-lg py-2 transition">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-pink-400 hover:bg-pink-500 disabled:opacity-50 text-white rounded-lg py-2 transition">
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
