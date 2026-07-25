const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function request(path: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error' }));
    throw new Error(err.message || err.error || 'Error de conexión');
  }

  return res.json();
}

export const api = {
  login: (identifier: string, password: string) =>
    request('/admin/login', { method: 'POST', body: JSON.stringify({ [identifier.includes('@') ? 'username' : /^\d+$/.test(identifier) ? 'telegramId' : 'username']: identifier, password }) }),

  getStats: () => request('/admin/stats'),
  getUsers: () => request('/admin/users'),
  getStock: () => request('/admin/stock'),
  getServices: () => request('/admin/services'),

  addBalance: (telegramId: string, amount: number) =>
    request('/admin/add-balance', { method: 'POST', body: JSON.stringify({ telegramId, amount }) }),

  blockUser: (telegramId: string) =>
    request('/admin/block-user', { method: 'POST', body: JSON.stringify({ telegramId }) }),

  deleteUser: (id: number) =>
    request(`/admin/user/${id}`, { method: 'DELETE' }),

  setPassword: (telegramId: string, password: string) =>
    request('/admin/set-password', { method: 'POST', body: JSON.stringify({ telegramId, password }) }),

  convertAccount: (id: number, profiles: number) =>
    request(`/admin/convert-account/${id}`, { method: 'POST', body: JSON.stringify({ profiles }) }),
  getAllAccounts: () => request('/admin/stock/accounts'),
  updateAccount: (id: number, data: { email?: string; password?: string; pin?: string }) =>
    request(`/admin/stock/account/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAccount: (id: number) =>
    request(`/admin/stock/account/${id}`, { method: 'DELETE' }),
  addProfiles: (id: number, count: number) =>
    request(`/admin/stock/account/${id}/profiles`, { method: 'POST', body: JSON.stringify({ count }) }),
  deleteProfile: (id: number) =>
    request(`/admin/stock/profile/${id}`, { method: 'DELETE' }),
  updateProfile: (id: number, data: { pin?: string }) =>
    request(`/admin/stock/profile/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createAccount: (data: { serviceId: number; email: string; password: string; pin?: string; type?: string; profiles?: number; profilePins?: (string | undefined)[] }) =>
    request('/admin/create-account', { method: 'POST', body: JSON.stringify(data) }),

  createService: (data: { name: string; price: number }) =>
    request('/admin/services', { method: 'POST', body: JSON.stringify(data) }),

  updateService: (id: number, data: { price?: number; active?: boolean }) =>
    request(`/admin/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id: number) =>
    request(`/admin/services/${id}`, { method: 'DELETE' }),

  getTransactions: () => request('/admin/transactions'),
  setUsername: (username: string) =>
    request('/admin/set-username', { method: 'POST', body: JSON.stringify({ username }) }),
  makeAdmin: (telegramId: string, password: string, username?: string) =>
    request('/admin/make-admin', { method: 'POST', body: JSON.stringify({ telegramId, password, username }) }),
  bulkImport: (data: { serviceId: number; emails: string[]; password: string; pin?: string }) =>
    request('/admin/stock/bulk-import', { method: 'POST', body: JSON.stringify(data) }),

  migrateConverted: () =>
    request('/admin/migrate-converted', { method: 'POST' }),
};
