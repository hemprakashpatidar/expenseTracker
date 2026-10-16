import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listPeople,
  getPerson,
  createPerson,
  updatePerson,
  createEntry,
  deleteEntry,
  createSettlement,
  deleteSettlement,
} from '../../api/ledger.js';
import { transactionKeys } from '../transactions/queries.js';

export const peopleKeys = {
  all: ['people'],
  list: () => ['people', 'list'],
  detail: (id) => ['people', 'detail', id],
};

export const usePeople = () => useQuery({ queryKey: peopleKeys.list(), queryFn: () => listPeople() });

export const usePerson = (id) => useQuery({ queryKey: peopleKeys.detail(id), queryFn: () => getPerson(id) });

// Any ledger change can move both the list totals and that person's page, so refresh both.
// Balances are computed on the server, which keeps the client from ever doing the maths twice.
const useLedgerMutation = (mutationFn, { touchesExpenses = () => false } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: peopleKeys.all });
      // "Add my share" creates (and deleting removes) a normal expense too
      if (touchesExpenses(result, variables)) {
        queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      }
    },
  });
};

export const useCreatePerson = () => useLedgerMutation(createPerson);

export const useUpdatePerson = () => useLedgerMutation(({ id, changes }) => updatePerson(id, changes));

export const useCreateEntry = () =>
  useLedgerMutation(createEntry, { touchesExpenses: (result) => result?.myShareAdded });

export const useDeleteEntry = () =>
  useLedgerMutation(deleteEntry, { touchesExpenses: (result) => result?.myShareRemoved !== null });

export const useCreateSettlement = () => useLedgerMutation(createSettlement);

export const useDeleteSettlement = () => useLedgerMutation(deleteSettlement);
