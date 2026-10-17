import { useEffect } from 'react';
import { useSearchParams } from 'react-router';

const STORAGE_KEY = 'expense_tracker_ledger';

const readStored = () => {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
};
const store = (id) => {
  try { localStorage.setItem(STORAGE_KEY, id); } catch { /* not remembered; the URL still works */ }
};

// Which ledger the People page shows: ?ledger= in the URL (so Back and refresh keep it),
// then the last one you used, then your first. Ids that aren't in `ledgers` are skipped.
export const useSelectedLedger = (ledgers) => {
  const [params, setParams] = useSearchParams();
  const available = ledgers ?? [];
  const isAvailable = (id) => Boolean(id) && available.some(l => l.id === id);

  const fromUrl = params.get('ledger');
  const ledgerId = [fromUrl, readStored()].find(isAvailable) || available[0]?.id || null;

  useEffect(() => { if (ledgerId) store(ledgerId); }, [ledgerId]);

  const select = (id) => {
    store(id);
    setParams({ ledger: id });
  };

  return { ledgerId, ledger: available.find(l => l.id === ledgerId) ?? null, select };
};
