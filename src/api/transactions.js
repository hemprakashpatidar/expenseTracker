import { apiGet, apiPost, apiPatch, apiDelete, parse } from './client.js';

export const listTransactions = (month, year) =>
  apiGet(`/api/transactions?month=${month}&year=${year}`).then(parse).then(data => data.transactions);

export const createTransaction = (input) =>
  apiPost('/api/transactions', input).then(parse).then(data => data.transaction);

export const updateTransaction = (id, changes) =>
  apiPatch(`/api/transactions/${id}`, changes).then(parse).then(data => data.transaction);

export const deleteTransaction = (id, options) =>
  apiDelete(`/api/transactions/${id}`, options).then(parse);
