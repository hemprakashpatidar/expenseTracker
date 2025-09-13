// Function to format amount - only show decimals if they exist
export const formatAmount = (amount) => {
  return amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
};

// Function to format date from YYYY-MM-DD to dd-mm-yy
export const formatDate = (dateString) => {
  if (!dateString || dateString === '—') return '—';
  
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  } catch (error) {
    return '—';
  }
};

// Format month for display
export const formatMonthDisplay = (monthYear) => {
  const [year, month] = monthYear.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};
