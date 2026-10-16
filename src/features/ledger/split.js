// Mirrors the server's paise arithmetic (ver-px lib/money.js), so the preview matches what's saved

export const toPaise = (rupees) => {
  const value = Number(rupees);
  if (!Number.isFinite(value)) return 0;
  const [whole, fraction = ''] = value.toFixed(2).split('.');
  return Number(whole) * 100 + Math.sign(value || 1) * Number(fraction.padEnd(2, '0'));
};

// Equal split between you and one person; whoever paid keeps any odd paisa
export const splitEqually = (amountPaise, iPaid) => {
  const half = Math.floor(amountPaise / 2);
  const odd = amountPaise - half * 2;
  return iPaid
    ? { mine: half + odd, theirs: half }
    : { mine: half, theirs: half + odd };
};

// Your share and theirs in paise, or null while the inputs aren't usable yet
export const previewSplit = ({ amount, paidBy, mode, myShare }) => {
  const total = toPaise(amount);
  if (total <= 0) return null;
  if (mode === 'equal') return splitEqually(total, paidBy === 'me');
  const mine = toPaise(myShare);
  if (myShare === '' || mine < 0 || mine > total) return null;
  return { mine, theirs: total - mine };
};
