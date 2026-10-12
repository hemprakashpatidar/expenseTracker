import { useState } from 'react';
import {
  getRecurringTemplates,
  addRecurringTemplate,
  removeRecurringTemplate,
  markHandled as markHandledInStorage,
  getPendingSuggestions,
} from './storage.js';

// Recurring templates live in localStorage; this keeps React state in sync with it
export const useRecurring = (year, month) => {
  const [templates, setTemplates] = useState(getRecurringTemplates);

  const isRecurring = (transactionId) => templates.some(t => t.sourceId === transactionId);

  const toggle = (transaction) => {
    const existing = templates.find(t => t.sourceId === transaction.id);
    setTemplates(existing ? removeRecurringTemplate(existing.id) : addRecurringTemplate(transaction));
  };

  const markHandled = (templateId) => setTemplates(markHandledInStorage(templateId, year, month));

  return {
    templates,
    setTemplates,
    pending: getPendingSuggestions(templates, year, month),
    isRecurring,
    toggle,
    markHandled,
  };
};
