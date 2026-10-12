// Function to format amount - only show decimals if they exist
export const formatAmount = (amount) => {
  return amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
};
