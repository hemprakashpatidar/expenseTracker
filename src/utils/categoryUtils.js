// Function to get category color based on category name
export const getCategoryColor = (category) => {
  const colors = {
    'Food': '#FF6B35',
    'Travel': '#4A90E2',
    'Groceries': '#2ECC71',
    'Medicine': '#E74C3C',
    'Housing': '#8E44AD',
    'Utilities': '#F39C12',
    'Entertainment': '#E91E63',
    'Shopping': '#9C27B0',
    'Default': '#6C757D'
  };
  return colors[category] || colors['Default'];
};

// Function to get category icons
export const getCategoryIcon = (category) => {
  const icons = {
    'Food': '🛒',
    'Travel': '🚗',
    'Groceries': '🛒',
    'Medicine': '💊',
    'Housing': '🏠',
    'Utilities': '⚡',
    'Entertainment': '🎬',
    'Shopping': '🛍️',
    'Other': '📦'
  };
  return icons[category] || '📦';
};
