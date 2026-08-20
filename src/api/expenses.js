import API from './axios';

export const getGroupExpenses = (groupId) => API.get(`/expenses/group/${groupId}`);
export const createExpense = (description, amount, groupId, splitAmong) =>
  API.post('/expenses', { description, amount, groupId, splitAmong });
export const getBalances = (groupId) => API.get(`/expenses/group/${groupId}/balances`);
export const getSettlements = (groupId) => API.get(`/expenses/group/${groupId}/settlements`);