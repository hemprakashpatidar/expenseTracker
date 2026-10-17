import { toPaise } from '../ledger/split.js';
import { formatAmount } from '../../shared/formatters.js';

// Mirrors ver-px lib/splits.js so the preview matches what's saved, but reports instead of
// throwing: { shares: Map(personId -> paise) | null, status, ready }.

const rupees = (paise) => `₹${formatAmount(Math.abs(paise) / 100)}`;

const allocate = (totalPaise, weights) => {
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  const raw = weights.map(w => (totalPaise * w) / weightSum);
  const floors = raw.map(Math.floor);
  let leftover = totalPaise - floors.reduce((sum, p) => sum + p, 0);
  const byRemainder = raw
    .map((value, index) => ({ index, remainder: value - floors[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of byRemainder) {
    if (leftover === 0) break;
    floors[index] += 1;
    leftover -= 1;
  }
  return floors;
};

const hundredths = (value) => Math.round(Number(value || 0) * 100);

// participants: [{ personId, value }] in display order; payerId goes first for equal splits
export const previewGroupSplit = ({ amount, type, participants, payerId }) => {
  const total = toPaise(amount || 0);
  if (participants.length === 0) return { shares: null, status: 'Choose who to split with', ready: false };
  if (total <= 0) return { shares: null, status: 'Enter the amount first', ready: false };

  const toMap = (list, parts) => new Map(list.map((p, i) => [p.personId, parts[i]]));

  if (type === 'equal') {
    const ordered = [...participants].sort((a, b) => (b.personId === payerId) - (a.personId === payerId));
    const parts = allocate(total, ordered.map(() => 1));
    const each = Math.floor(total / participants.length);
    return { shares: toMap(ordered, parts), status: `${rupees(each)} each`, ready: true };
  }

  if (type === 'exact') {
    const parts = participants.map(p => toPaise(p.value || 0));
    const left = total - parts.reduce((a, b) => a + b, 0);
    if (left === 0) return { shares: toMap(participants, parts), status: 'Adds up to the total', ready: true };
    return {
      shares: toMap(participants, parts),
      status: left > 0 ? `${rupees(left)} left to assign` : `${rupees(left)} over the total`,
      ready: false,
    };
  }

  const weights = participants.map(p => hundredths(p.value));

  if (type === 'percent') {
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum !== 10_000) {
      return { shares: null, status: `Percentages add up to ${formatAmount(sum / 100)}% (need 100%)`, ready: false };
    }
    return { shares: toMap(participants, allocate(total, weights)), status: 'Adds up to 100%', ready: true };
  }

  // shares
  if (weights.every(w => w === 0)) return { shares: null, status: 'Give at least one person a share', ready: false };
  const shareCount = weights.reduce((a, b) => a + b, 0) / 100;
  return {
    shares: toMap(participants, allocate(total, weights)),
    status: `${formatAmount(shareCount)} shares · ${rupees(Math.floor(total / shareCount))} per share`,
    ready: true,
  };
};
