const STORAGE_KEY = 'expense_tracker_recurring';

const save = (templates) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  return templates;
};

export const getRecurringTemplates = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
};

export const addRecurringTemplate = (transaction) => {
  const templates = getRecurringTemplates();
  if (templates.some(t => t.sourceId === transaction.id)) return templates;
  return save([...templates, {
    id: `rec-${Date.now()}`,
    sourceId: transaction.id,
    expense: transaction.expense,
    amount: transaction.amount,
    category: transaction.category,
    paymentMethod: transaction.paymentMethod,
    handledMonths: [],
  }]);
};

export const removeRecurringTemplate = (templateId) => {
  return save(getRecurringTemplates().filter(t => t.id !== templateId));
};

export const markHandled = (templateId, year, month) => {
  const key = `${year}-${String(month).padStart(2, '0')}`;
  return save(getRecurringTemplates().map(t =>
    t.id === templateId ? { ...t, handledMonths: [...t.handledMonths, key] } : t
  ));
};

export const getPendingSuggestions = (templates, year, month) => {
  const key = `${year}-${String(month).padStart(2, '0')}`;
  return templates.filter(t => !t.handledMonths.includes(key));
};
