// One entry per category in shared/constants.js. Colours are dark enough for white text
// and for coloured icons on a light tint. `icon` names a shape in shared/Icon.jsx.
// `label` is the short name shown on chips.
const CATEGORY_STYLES = {
  'Food & Dining':     { icon: 'utensils', color: '#C2410C', label: 'Food' },
  'Transportation':    { icon: 'car', color: '#1D4ED8', label: 'Transport' },
  'Shopping':          { icon: 'bag', color: '#7E22CE', label: 'Shopping' },
  'Entertainment':     { icon: 'film', color: '#BE185D', label: 'Fun' },
  'Bills & Utilities': { icon: 'zap', color: '#B45309', label: 'Bills' },
  'Healthcare':        { icon: 'heartPulse', color: '#B91C1C', label: 'Health' },
  'Travel':            { icon: 'plane', color: '#0369A1', label: 'Travel' },
  'Education':         { icon: 'book', color: '#4338CA', label: 'Education' },
  'Groceries':         { icon: 'cart', color: '#15803D', label: 'Groceries' },
  'Housing':           { icon: 'home', color: '#6D28D9', label: 'Housing' },
  'Other':             { icon: 'package', color: '#4B5563', label: 'Other' },
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

// The Icon name for a category; render it with <CategoryIcon>
export const getCategoryIconName = (category) => styleFor(category).icon;

// Unknown or custom categories show their own name
export const getCategoryLabel = (category) => {
  const key = ALIASES[category] || category;
  return CATEGORY_STYLES[key]?.label || category;
};
