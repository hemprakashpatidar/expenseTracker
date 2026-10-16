import { formatAmount } from '../../shared/formatters.js';

// balance > 0: they owe you; < 0: you owe them (rupees, from the server)
export const balanceTone = (balance) => (balance > 0 ? 'owed' : balance < 0 ? 'owe' : 'settled');

export const formatRupees = (amount) => `₹${formatAmount(Math.abs(amount))}`;

// Short line for a list row: "owes you ₹500", "you owe ₹300", "settled up"
export const balanceShort = (balance) => {
  if (balance > 0) return `owes you ${formatRupees(balance)}`;
  if (balance < 0) return `you owe ${formatRupees(balance)}`;
  return 'settled up';
};

// Heading for a person's page: "Rahul owes you", "You owe Rahul", "You're settled up with Rahul"
export const balanceHeading = (name, balance) => {
  if (balance > 0) return `${name} owes you`;
  if (balance < 0) return `You owe ${name}`;
  return `You're settled up with ${name}`;
};
