// One entry per category in shared/constants.js. Colours are dark enough for white text
// (category breakdown tiles) and for coloured text on white (expanded card).
// `label` is the short name shown on the add form's category tiles.
const CATEGORY_STYLES = {
  'Food & Dining':     { icon: '🍽️', color: '#C2410C', label: 'Food' },
  'Transportation':    { icon: '🚗', color: '#1D4ED8', label: 'Transport' },
  'Shopping':          { icon: '🛍️', color: '#7E22CE', label: 'Shopping' },
  'Entertainment':     { icon: '🎬', color: '#BE185D', label: 'Fun' },
  'Bills & Utilities': { icon: '💡', color: '#B45309', label: 'Bills' },
  'Healthcare':        { icon: '💊', color: '#B91C1C', label: 'Health' },
  'Travel':            { icon: '✈️', color: '#0369A1', label: 'Travel' },
  'Education':         { icon: '📚', color: '#4338CA', label: 'Education' },
  'Groceries':         { icon: '🛒', color: '#15803D', label: 'Groceries' },
  'Housing':           { icon: '🏠', color: '#6D28D9', label: 'Housing' },
  'Other':             { icon: '📦', color: '#4B5563', label: 'Other' },
};

// Older rows in Notion use these shorter names
const ALIASES = {
  'Food': 'Food & Dining',
  'Medicine': 'Healthcare',
  'Utilities': 'Bills & Utilities',
};

const DEFAULT_STYLE = CATEGORY_STYLES.Other;

const styleFor = (category) => CATEGORY_STYLES[ALIASES[category] || category] || DEFAULT_STYLE;

export const getCategoryColor = (category) => styleFor(category).color;

export const getCategoryIcon = (category) => styleFor(category).icon;

// Unknown or custom categories show their own name
export const getCategoryLabel = (category) => {
  const key = ALIASES[category] || category;
  return CATEGORY_STYLES[key]?.label || category;
};
