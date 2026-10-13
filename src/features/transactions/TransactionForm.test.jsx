import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TransactionForm from './TransactionForm.jsx';
import { todayISO } from '../../shared/dates.js';

const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

// The form remembers the last payment method in localStorage
beforeEach(() => localStorage.clear());
const pressed = (name) => screen.getByRole('button', { name, pressed: true });

test('add mode: no category, UPI and Today to start; text is saved as typed', async () => {
  const onSubmit = vi.fn().mockResolvedValue();
  const onClose = vi.fn();
  render(<TransactionForm onSubmit={onSubmit} onClose={onClose} />);

  expect(screen.queryAllByRole('button', { pressed: true }).map(b => b.textContent)).toEqual(['UPI', 'Today']);
  expect(pressed('UPI')).toBeInTheDocument();
  expect(pressed('Today')).toBeInTheDocument();

  fill('Amount', '42.5');
  fill('Description', '  Tea & snacks ');
  fireEvent.click(screen.getByRole('button', { name: /food/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Card' }));
  fireEvent.click(screen.getByRole('button', { name: /save expense/i }));

  await waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(onSubmit).toHaveBeenCalledWith({
    expense: 'Tea & snacks', amount: 42.5, date: todayISO(), category: 'Food & Dining', paymentMethod: 'Card',
  });
});

test('edit mode: pre-fills and keeps unknown values as custom', async () => {
  const onSubmit = vi.fn().mockResolvedValue();
  render(
    <TransactionForm
      transaction={{ id: 'x', expense: 'Gym', amount: 1500, date: '2026-10-05', category: 'Fitness', paymentMethod: 'Card' }}
      onSubmit={onSubmit}
      onClose={() => {}}
    />
  );
  expect(screen.getByLabelText('Amount')).toHaveValue('1500');
  expect(pressed('Custom category')).toBeInTheDocument();
  expect(screen.getByLabelText('Enter custom category')).toHaveValue('Fitness');
  expect(screen.getByLabelText('Pick a date')).toHaveValue('2026-10-05');

  fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
    expense: 'Gym', amount: 1500, date: '2026-10-05', category: 'Fitness', paymentMethod: 'Card',
  }));
});

test('shows the server error and stays open when saving fails', async () => {
  const onClose = vi.fn();
  render(<TransactionForm onSubmit={vi.fn().mockRejectedValue(new Error('category: Category cannot contain commas'))} onClose={onClose} />);
  fill('Amount', '5');
  fill('Description', 'x');
  // Category comes before Paid with, which also has an 'Other'
  fireEvent.click(screen.getAllByRole('button', { name: 'Other' })[0]);
  fireEvent.click(screen.getByRole('button', { name: /save expense/i }));
  expect(await screen.findByText(/cannot contain commas/)).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
});

test('rejects a zero amount without calling the server', () => {
  const onSubmit = vi.fn();
  render(<TransactionForm onSubmit={onSubmit} onClose={() => {}} />);
  fill('Amount', '0');
  fill('Description', 'x');
  fireEvent.click(screen.getByRole('button', { name: /save expense/i }));
  expect(screen.getByText(/amount greater than 0/)).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('add mode: the category follows the description until one is picked', () => {
  render(<TransactionForm onSubmit={vi.fn()} onClose={() => {}} />);
  fill('Description', 'Swiggy dinner');
  expect(pressed(/food/i)).toBeInTheDocument();
  fill('Description', 'Uber to office');
  expect(pressed(/transport/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /groceries/i }));
  fill('Description', 'Swiggy again');
  expect(pressed(/groceries/i)).toBeInTheDocument();
});

test('add mode: starts with the payment method used last time', async () => {
  const onSubmit = vi.fn().mockResolvedValue();
  const { unmount } = render(<TransactionForm onSubmit={onSubmit} onClose={() => {}} />);
  fill('Amount', '10');
  fill('Description', 'Tea');
  fireEvent.click(screen.getAllByRole('button', { name: 'Other' })[0]); // the category one
  fireEvent.click(screen.getByRole('button', { name: 'Cash' }));
  fireEvent.click(screen.getByRole('button', { name: /save expense/i }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  unmount();

  render(<TransactionForm onSubmit={vi.fn()} onClose={() => {}} />);
  expect(pressed('Cash')).toBeInTheDocument();
});

test('add mode: a recent expense fills the form in one tap', async () => {
  const onSubmit = vi.fn().mockResolvedValue();
  const recent = [{ id: 'r1', expense: 'Netflix', amount: 649, date: '2026-09-06', category: 'Entertainment', paymentMethod: 'Card' }];
  render(<TransactionForm recent={recent} onSubmit={onSubmit} onClose={() => {}} />);

  fireEvent.click(screen.getByRole('button', { name: /fill in netflix/i }));
  fireEvent.click(screen.getByRole('button', { name: /save expense/i }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
    expense: 'Netflix', amount: 649, date: todayISO(), category: 'Entertainment', paymentMethod: 'Card',
  }));
});

test('add mode: asks for a category when none is picked or matched', () => {
  const onSubmit = vi.fn();
  render(<TransactionForm onSubmit={onSubmit} onClose={() => {}} />);
  fill('Amount', '300');
  fill('Description', 'Gym');
  fireEvent.click(screen.getByRole('button', { name: /save expense/i }));
  expect(screen.getByText('Pick a category.')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('add mode: the auto-picked category clears when the text stops matching', () => {
  render(<TransactionForm onSubmit={vi.fn()} onClose={() => {}} />);
  fill('Description', 'Swiggy');
  expect(pressed(/food/i)).toBeInTheDocument();
  fill('Description', 'Gym');
  expect(screen.queryByRole('button', { name: /food/i, pressed: true })).toBeNull();
});
