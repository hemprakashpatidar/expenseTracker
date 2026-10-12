import { apiGet, apiPost, apiPatch, apiDelete } from './client.js';

// Resolves with the JSON body, or throws an Error carrying the server's { message }
const parse = async (response) => {
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }
  return data;
};

export const listTransactions = (month, year) =>
  apiGet(`/api/transactions?month=${month}&year=${year}`).then(parse).then(data => data.transactions);

export const createTransaction = (input) =>
  apiPost('/api/transactions', input).then(parse).then(data => data.transaction);

export const updateTransaction = (id, changes) =>
  apiPatch(`/api/transactions/${id}`, changes).then(parse).then(data => data.transaction);

export const deleteTransaction = (id) =>
  apiDelete(`/api/transactions/${id}`).then(parse);
