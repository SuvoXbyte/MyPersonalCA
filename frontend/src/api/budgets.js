import api from './client';

export const getBudgets = (month) =>
  api.get('/api/budgets', { params: { month } }).then((r) => r.data);

export const getBudgetSummary = (month) =>
  api.get('/api/budgets/summary', { params: { month } }).then((r) => r.data);

export const createBudget = (data) =>
  api.post('/api/budgets', data).then((r) => r.data);

export const updateBudget = (id, data) =>
  api.put(`/api/budgets/${id}`, data).then((r) => r.data);

export const deleteBudget = (id) =>
  api.delete(`/api/budgets/${id}`).then((r) => r.data);
