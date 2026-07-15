import api from './client';

export const getPayments = (params = {}) =>
  api.get('/api/payments', { params }).then((r) => r.data);

export const createPayment = (data) =>
  api.post('/api/payments', data).then((r) => r.data);

export const updatePayment = (id, data) =>
  api.put(`/api/payments/${id}`, data).then((r) => r.data);

export const deletePayment = (id) =>
  api.delete(`/api/payments/${id}`).then((r) => r.data);

export const getCategories = () =>
  api.get('/api/payments/categories').then((r) => r.data);
