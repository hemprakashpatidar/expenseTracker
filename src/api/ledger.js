import { apiGet, apiPost, apiPatch, apiDelete, parse } from './client.js';

// { people: [{ id, name, archived, balance, lastActivityOn }], totals: { owedToYou, youOwe } }
// balance > 0: they owe you; < 0: you owe them
export const listPeople = ({ includeArchived = false } = {}) =>
  apiGet(`/api/people${includeArchived ? '?includeArchived=true' : ''}`).then(parse);

export const createPerson = (name) =>
  apiPost('/api/people', { name }).then(parse).then(data => data.person);

export const updatePerson = (id, changes) =>
  apiPatch(`/api/people/${id}`, changes).then(parse).then(data => data.person);

// { person, activity: [...] } — activity is newest first
export const getPerson = (id) => apiGet(`/api/people/${id}`).then(parse);

// type: 'lent' | 'borrowed' | 'split'; resolves with { id, myShareAdded, person }
export const createEntry = (entry) => apiPost('/api/ledger/entries', entry).then(parse);

// Resolves with { myShareRemoved } (null when the entry had no linked expense)
export const deleteEntry = (id) => apiDelete(`/api/ledger/entries/${id}`).then(parse);

// direction: 'they_paid' | 'i_paid'
export const createSettlement = (settlement) => apiPost('/api/ledger/settlements', settlement).then(parse);

export const deleteSettlement = (id) => apiDelete(`/api/ledger/settlements/${id}`).then(parse);
