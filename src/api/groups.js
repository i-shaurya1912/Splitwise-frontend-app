import API from './axios';

export const getGroups = () => API.get('/groups');
export const createGroup = (name) => API.post('/groups', { name });
export const addMember = (groupId, email) => API.post(`/groups/${groupId}/add-member`, { email });
export const getGroupById = (groupId) => API.get('/groups').then(res => 
  res.data.find(g => g._id === groupId)
);