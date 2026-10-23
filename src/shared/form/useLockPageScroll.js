import { useEffect } from 'react';

// While a sheet is open the page behind it stays put: it can't be scrolled through the overlay,
// and phones don't scroll the long list around as the keyboard opens or focus moves between fields.
// Counted, so closing one of two stacked sheets keeps the lock.
let openSheets = 0;

export const useLockPageScroll = () => {
  useEffect(() => {
    openSheets += 1;
    document.documentElement.classList.add('sheet-open');
    return () => {
      openSheets -= 1;
      if (openSheets === 0) document.documentElement.classList.remove('sheet-open');
    };
  }, []);
};
