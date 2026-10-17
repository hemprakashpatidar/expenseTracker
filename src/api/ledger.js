import { apiGet, apiPost, apiPatch, apiDelete, parse } from './client.js';

// [{ id, name, archived, peopleCount, totals: { owedToYou, youOwe } }], oldest first
export const listLedgers = () => apiGet('/api/ledgers').then(parse).then(data => data.ledgers);

export const createLedger = (name) =>
  apiPost('/api/ledgers', { name }).then(parse).then(data => data.ledger);

// { name?, archived? }
export const updateLedger = (id, changes) =>
  apiPatch(`/api/ledgers/${id}`, changes).then(parse).then(data => data.ledger);

// { ledger, people: [{ id, name, ledger, archived, balance, lastActivityOn }], totals: { owedToYou, youOwe } }
// balance > 0: they owe you; < 0: you owe them. Without ledgerId the server uses your default ledger.
// allLedgers: everyone across your ledgers (each person carries their ledger)
export const listPeople = ({ ledgerId, allLedgers = false, includeArchived = false } = {}) => {
  const params = new URLSearchParams();
  if (ledgerId) params.set('ledgerId', ledgerId);
  if (allLedgers) params.set('allLedgers', 'true');
  if (includeArchived) params.set('includeArchived', 'true');
  const qs = params.toString();
  return apiGet(`/api/people${qs ? `?${qs}` : ''}`).then(parse);
};

export const createPerson = (name, ledgerId) =>
  apiPost('/api/people', { name, ledgerId }).then(parse).then(data => data.person);

// { name?, archived?, ledgerId? } — ledgerId moves them to another ledger
export const updatePerson = (id, changes) =>
  apiPatch(`/api/people/${id}`, changes).then(parse).then(data => data.person);

// { person, activity: [...] } — activity is newest first
export const getPerson = (id) => apiGet(`/api/people/${id}`).then(parse);

// type: 'lent' | 'borrowed' | 'split'; resolves with { id, myShareAdded, person }
export const createEntry = (entry) => apiPost('/api/ledger/entries', entry).then(parse);

// Resolves with { myShareRemoved } (null when the entry had no linked expense)
export const deleteEntry = (id) => apiDelete(`/api/ledger/entries/${id}`).then(parse);

// direction: 'they_paid' | 'i_paid'. scope: 'direct' (default) | 'group' (with groupId) | 'all'
// ('all' clears the combined balance: amount must equal it)
export const createSettlement = (settlement) => apiPost('/api/ledger/settlements', settlement).then(parse);

export const deleteSettlement = (id) => apiDelete(`/api/ledger/settlements/${id}`).then(parse);
