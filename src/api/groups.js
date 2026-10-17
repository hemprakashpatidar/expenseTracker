import { apiGet, apiPost, apiPatch, apiDelete, parse } from './client.js';

// [{ id, name, emoji, simplifyDebts, archived, memberCount, totalSpent, myNet, lastActivityOn }]
// myNet > 0: you're owed in that group; < 0: you owe
export const listGroups = () => apiGet('/api/groups').then(parse).then(data => data.groups);

// { group, members: [{ id, name, isSelf, ledger, net }], debts: [{ from, to, amount }], activity }
export const getGroup = (id) => apiGet(`/api/groups/${id}`).then(parse);

// { name, emoji?, simplifyDebts?, memberIds?, newMemberNames? } — resolves with the full group
export const createGroup = (group) => apiPost('/api/groups', group).then(parse);

// { name?, emoji?, simplifyDebts?, memberIds?, newMemberNames? }
export const updateGroup = (id, changes) => apiPatch(`/api/groups/${id}`, changes).then(parse);

// { description, amount, date, paidById, split: { type, participants: [{ personId, value? }] },
//   category?, addMyShare?, paymentMethod? } — resolves with { id, myShareAdded, ...group }
export const addGroupExpense = (groupId, expense) =>
  apiPost(`/api/groups/${groupId}/expenses`, expense).then(parse);

// Resolves with { myShareRemoved } (null when there was no linked expense)
export const deleteGroupExpense = (groupId, expenseId) =>
  apiDelete(`/api/groups/${groupId}/expenses/${expenseId}`).then(parse);

// { fromPersonId, toPersonId, amount, date, note? } — any two members
export const addGroupSettlement = (groupId, settlement) =>
  apiPost(`/api/groups/${groupId}/settlements`, settlement).then(parse);

export const deleteGroupSettlement = (groupId, settlementId) =>
  apiDelete(`/api/groups/${groupId}/settlements/${settlementId}`).then(parse);

// Read-only share link: { active, token?, createdAt?, needsNewLink? }
export const getShareLink = (groupId) => apiGet(`/api/groups/${groupId}/share`).then(parse);

// Makes a new link; any previous one stops working
export const createShareLink = (groupId) => apiPost(`/api/groups/${groupId}/share`).then(parse);

export const revokeShareLink = (groupId) => apiDelete(`/api/groups/${groupId}/share`).then(parse);
