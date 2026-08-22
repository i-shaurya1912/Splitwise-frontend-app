import API from './axios';

export const createOrder = (amount, toUserId, groupId) =>
  API.post('/payments/create-order', { amount, toUserId, groupId });
export const verifyPayment = (data) => API.post('/payments/verify', data);
export const getGroupPayments = (groupId) => API.get(`/payments/group/${groupId}`);