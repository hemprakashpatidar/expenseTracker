// Function to sort data
export const sortData = (data, sortBy, direction = 'desc') => {
  return data.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        if (a.date === '—' && b.date === '—') return 0;
        if (a.date === '—') return 1;
        if (b.date === '—') return -1;
        
        const [dayA, monthA, yearA] = a.date.split('-').map(Number);
        const [dayB, monthB, yearB] = b.date.split('-').map(Number);
        
        const dateA = new Date(2000 + yearA, monthA - 1, dayA);
        const dateB = new Date(2000 + yearB, monthB - 1, dayB);
        
        comparison = dateB - dateA;
        break;
      
      case 'amount':
        comparison = b.amount - a.amount;
        break;
      
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      
      case 'expense':
        comparison = a.expense.localeCompare(b.expense);
        break;
      
      default:
        return 0;
    }
    
    return direction === 'asc' ? -comparison : comparison;
  });
};

// Get available months from data
export const getAvailableMonths = (data) => {
  const months = new Set();
  data.forEach(item => {
    if (item.date && item.date !== '—') {
      try {
        const date = new Date(item.date.split('-').reverse().join('-'));
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthYear);
      } catch (error) {
        console.error('Error parsing date:', item.date);
      }
    }
  });
  
  return Array.from(months).sort().reverse(); // Most recent first
};

// Filter data by month
export const filterByMonth = (data, monthFilter) => {
  if (monthFilter === 'All') return data;
  
  return data.filter(item => {
    if (!item.date || item.date === '—') return false;
    
    try {
      const date = new Date(item.date.split('-').reverse().join('-'));
      const itemMonthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return itemMonthYear === monthFilter;
    } catch (error) {
      console.error('Error parsing date:', item.date);
      return false;
    }
  });
};
