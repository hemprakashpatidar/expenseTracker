const wholeRupees = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const withPaise = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Indian digit grouping (1,23,456); paise only when the amount has them
export const formatAmount = (amount) => {
  const value = Number(amount) || 0;
  return (Number.isInteger(value) ? wholeRupees : withPaise).format(value);
};
