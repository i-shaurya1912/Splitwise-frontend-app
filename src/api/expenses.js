import API from './axios';

export const getGroupExpenses = (groupId) => API.get(`/expenses/group/${groupId}`);
export const createExpense = (description, amount, groupId) =>
  API.post('/expenses', { description, amount, groupId });
export const getBalances = (groupId) => API.get(`/expenses/group/${groupId}/balances`);
export const getSettlements = (groupId) => API.get(`/expenses/group/${groupId}/settlements`);