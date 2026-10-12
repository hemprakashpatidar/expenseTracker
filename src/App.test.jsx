import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { AuthProvider } from './features/auth/AuthContext.jsx';
import { AppRoutes } from './App.jsx';
import { AUTH_STORAGE_KEY } from './features/auth/session.js';

// A JWT whose payload only carries an expiry; the signature is never checked client-side
const fakeToken = (expSeconds) => `x.${btoa(JSON.stringify({ exp: expSeconds }))}.y`;

const renderAt = (path) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  </QueryClientProvider>
);

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({ transactions: [] }), { status: 200 }))));
});
afterEach(() => vi.unstubAllGlobals());

test('signed out: / redirects to the login screen', async () => {
  renderAt('/');
  expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
});

test('the login screen links to register and back', async () => {
  renderAt('/login');
  fireEvent.click(screen.getByRole('link', { name: /create one here/i }));
  expect(await screen.findByRole('button', { name: /create account/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: /sign in here/i }));
  expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
});

test('signed in: /login redirects to the transactions page', async () => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: fakeToken(Date.now() / 1000 + 3600), userName: 'demo', isMe: false }));
  renderAt('/login');
  expect(await screen.findByText(/hi, demo/i)).toBeInTheDocument();
});

test('an expired saved session is discarded', async () => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: fakeToken(Date.now() / 1000 - 60), userName: 'demo' }));
  renderAt('/');
  expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
  expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
});

test('unknown paths fall back to /', async () => {
  renderAt('/nope');
  expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
});
