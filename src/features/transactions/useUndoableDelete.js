import { useCallback, useEffect, useRef, useState } from 'react';

export const UNDO_WINDOW_MS = 5000;

// Deleting hides a row and waits UNDO_WINDOW_MS before `commit` actually sends it, so Undo
// needs no request. Only one delete waits at a time: a second delete, leaving the page, or
// calling flush() sends the waiting one straight away.
export const useUndoableDelete = (commit) => {
  const [pending, setPending] = useState(null);
  const pendingRef = useRef(null);
  const timerRef = useRef(null);
  const commitRef = useRef(commit);

  useEffect(() => { commitRef.current = commit; }, [commit]);

  const flush = useCallback((options) => {
    clearTimeout(timerRef.current);
    const transaction = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    if (transaction) commitRef.current(transaction, options);
  }, []);

  const remove = useCallback((transaction) => {
    flush();
    pendingRef.current = transaction;
    setPending(transaction);
    timerRef.current = setTimeout(() => flush(), UNDO_WINDOW_MS);
  }, [flush]);

  const undo = useCallback(() => {
    clearTimeout(timerRef.current);
    pendingRef.current = null;
    setPending(null);
  }, []);

  useEffect(() => {
    // Closing or reloading the tab mid-countdown still deletes the row
    const onPageHide = () => flush({ keepalive: true });
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      flush();
    };
  }, [flush]);

  return { pending, remove, undo, flush };
};
