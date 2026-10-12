import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from './queryClient.js';
import { AuthProvider } from './features/auth/AuthContext.jsx';
import { useAuth } from './features/auth/useAuth.js';
import Login from './features/auth/Login.jsx';
import Register from './features/auth/Register.jsx';
import TransactionsPage from './features/transactions/TransactionsPage.jsx';

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('login');

  if (isAuthenticated) {
    return <TransactionsPage />;
  }

  // Handle page routing
  if (currentPage === 'register') {
    return <Register onSwitchToLogin={() => setCurrentPage('login')} />;
  }

  return <Login onSwitchToRegister={() => setCurrentPage('register')} />;
};

function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
