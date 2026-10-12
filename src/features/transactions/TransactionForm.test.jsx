import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TransactionForm from './TransactionForm.jsx';

const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

test('add mode: visible defaults are what gets saved, and text is not HTML-escaped', async () => {
  const onSubmit = vi.fn().mockResolvedValue();
  const onClose = vi.fn();
  render(<TransactionForm onSubmit={onSubmit} onClose={onClose} />);

  expect(screen.getByLabelText('Category')).toHaveValue('Other');
  expect(screen.getByLabelText('Payment Method')).toHaveValue('UPI');

  fill('Description', '  Tea & snacks ');
  fill('Amount', '42.5');
  fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

  await waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    expense: 'Tea & snacks', amount: 42.5, category: 'Other', paymentMethod: 'UPI',
  }));
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
  expect(screen.getByLabelText('Date')).toHaveValue('2026-10-05');
  expect(screen.getByLabelText('Category')).toHaveValue('Other (custom)');
  expect(screen.getByLabelText('Custom category')).toHaveValue('Fitness');

  fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
    expense: 'Gym', amount: 1500, date: '2026-10-05', category: 'Fitness', paymentMethod: 'Card',
  }));
});

test('shows the server error and stays open when saving fails', async () => {
  const onClose = vi.fn();
  render(<TransactionForm onSubmit={vi.fn().mockRejectedValue(new Error('category: Category cannot contain commas'))} onClose={onClose} />);
  fill('Description', 'x');
  fill('Amount', '5');
  fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));
  expect(await screen.findByText(/cannot contain commas/)).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
});

test('rejects a zero amount without calling the server', () => {
  const onSubmit = vi.fn();
  render(<TransactionForm onSubmit={onSubmit} onClose={() => {}} />);
  fill('Description', 'x');
  fill('Amount', '0');
  fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));
  expect(screen.getByText(/valid amount/)).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});
