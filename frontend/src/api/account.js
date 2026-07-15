import api from './client';

export const getAccount = () =>
  api.get('/api/account').then((r) => r.data);

export const setBalance = (amount) =>
  api.put('/api/account/balance', { amount }).then((r) => r.data);

export const addFunds = (amount, description) =>
  api.post('/api/account/add-funds', { amount, description }).then((r) => r.data);

export const getHistory = (page = 1, limit = 20) =>
  api.get('/api/account/history', { params: { page, limit } }).then((r) => r.data);

export const getProjected = () =>
  api.get('/api/account/projected').then((r) => r.data);

export const updateSettings = (data) =>
  api.put('/api/account/settings', data).then((r) => r.data);
