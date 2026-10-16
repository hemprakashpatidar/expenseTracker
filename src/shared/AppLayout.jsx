import { Outlet } from 'react-router';
import TabBar from './TabBar.jsx';

// Signed-in pages: the page itself, then the bottom tab bar
const AppLayout = () => (
  <>
    <Outlet />
    <TabBar />
  </>
);

export default AppLayout;
