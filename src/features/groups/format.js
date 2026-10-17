import { formatRupees } from '../ledger/balance.js';

// "you're owed ₹800" / "you owe ₹200" / "settled up", for your position in a group
export const groupPosition = (net) => {
  if (net > 0) return `you're owed ${formatRupees(net)}`;
  if (net < 0) return `you owe ${formatRupees(net)}`;
  return 'settled up';
};

// A member's net in a group, in the third person: "is owed ₹800" / "owes ₹200" / "settled up"
export const memberPosition = (member) => {
  const verbOwed = member.isSelf ? 'are owed' : 'is owed';
  if (member.net > 0) return `${verbOwed} ${formatRupees(member.net)}`;
  if (member.net < 0) return `${member.isSelf ? 'owe' : 'owes'} ${formatRupees(member.net)}`;
  return 'settled up';
};

// Heading for your position: "You're owed ₹800" / "You owe ₹200" / "You're settled up"
export const positionHeading = (net) => {
  if (net > 0) return `You're owed ${formatRupees(net)}`;
  if (net < 0) return `You owe ${formatRupees(net)}`;
  return 'You\'re settled up';
};
