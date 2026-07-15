import api from './client';

export const getObligations = (params = {}) =>
  api.get('/api/obligations', { params }).then((r) => r.data);

export const createObligation = (data) =>
  api.post('/api/obligations', data).then((r) => r.data);

export const updateObligation = (id, data) =>
  api.put(`/api/obligations/${id}`, data).then((r) => r.data);

export const deleteObligation = (id) =>
  api.delete(`/api/obligations/${id}`).then((r) => r.data);

export const markPaid = (id) =>
  api.post(`/api/obligations/${id}/mark-paid`).then((r) => r.data);
