import { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router';
import TabBar from './TabBar.jsx';
import { preloadTabPages } from '../lazyPages.js';
import page from './Page.module.css';

// Signed-in pages: the page itself, then the bottom tab bar
const AppLayout = () => {
  useEffect(() => {
    const timer = setTimeout(preloadTabPages, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Just the page background while a tab's code is still downloading */}
      <Suspense fallback={<div className={page.root} />}>
        <Outlet />
      </Suspense>
      <TabBar />
    </>
  );
};

export default AppLayout;
