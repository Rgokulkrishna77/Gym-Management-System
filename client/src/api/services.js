import api from './axios';

// Each call resolves to the response body: { success, message?, data }
const body = (p) => p.then((r) => r.data);

export const authApi = {
  login: (payload) => body(api.post('/auth/login', payload)),
  register: (payload) => body(api.post('/auth/register', payload)),
  me: () => body(api.get('/auth/me')),
};

export const plansApi = {
  list: () => body(api.get('/plans')),
  create: (payload) => body(api.post('/plans', payload)),
  update: (id, payload) => body(api.put(`/plans/${id}`, payload)),
  remove: (id) => body(api.delete(`/plans/${id}`)),
};

export const trainersApi = {
  list: () => body(api.get('/trainers')),
  create: (payload) => body(api.post('/trainers', payload)),
  update: (id, payload) => body(api.put(`/trainers/${id}`, payload)),
  remove: (id) => body(api.delete(`/trainers/${id}`)),
};

export const membersApi = {
  list: () => body(api.get('/members')),
  get: (id) => body(api.get(`/members/${id}`)),
  me: () => body(api.get('/members/me')),
  create: (payload) => body(api.post('/members', payload)),
  update: (id, payload) => body(api.put(`/members/${id}`, payload)),
  remove: (id) => body(api.delete(`/members/${id}`)),
};

export const membershipsApi = {
  expired: () => body(api.get('/memberships/expired')),
  renew: (payload) => body(api.post('/memberships/renew', payload)),
  pendingPayments: () => body(api.get('/payments/pending')),
  markPaid: (id, method) => body(api.patch(`/payments/${id}/pay`, { method })),
};

export const workoutsApi = {
  mine: () => body(api.get('/workouts/me')),
  forMember: (memberId) => body(api.get('/workouts', { params: { memberId } })),
  create: (payload) => body(api.post('/workouts', payload)),
  update: (id, payload) => body(api.put(`/workouts/${id}`, payload)),
};

export const statsApi = {
  dashboard: () => body(api.get('/admin/stats')),
};
