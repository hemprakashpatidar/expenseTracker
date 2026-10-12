import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('shows the login screen when signed out', async () => {
  localStorage.clear();
  render(<App />);
  expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
});
