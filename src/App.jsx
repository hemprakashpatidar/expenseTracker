import { Suspense, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { createQueryClient } from './queryClient.js';
import { ThemeProvider } from './shared/ThemeProvider.jsx';
import { AuthProvider } from './features/auth/AuthContext.jsx';
import { useAuth } from './features/auth/useAuth.js';
import Login from './features/auth/Login.jsx';
import Register from './features/auth/Register.jsx';
import TransactionsPage from './features/transactions/TransactionsPage.jsx';
import {
  PeoplePage,
  PersonPage,
  GroupsPage,
  GroupPage,
  SharedGroupPage,
  SharedWithMePage,
  InvitePage,
} from './lazyPages.js';
import AppLayout from './shared/AppLayout.jsx';

// Signed-out visitors go to /login and come back to where they were headed afterwards
const RequireAuth = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
};

const GuestOnly = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? <Navigate to={location.state?.from || '/'} replace /> : children;
};

// The public pages wait for their code here; signed-in ones wait inside AppLayout, which keeps
// the tab bar on screen
export const AppRoutes = () => (
  <Suspense fallback={null}>
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      {/* Public, read-only: works whether or not you're signed in */}
      <Route path="/shared/:token" element={<SharedGroupPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/" element={<TransactionsPage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/people/:id" element={<PersonPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:id" element={<GroupPage />} />
        <Route path="/groups/shared/:id" element={<SharedWithMePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
