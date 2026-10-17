import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  addGroupExpense,
  deleteGroupExpense,
  addGroupSettlement,
  deleteGroupSettlement,
  getShareLink,
  createShareLink,
  revokeShareLink,
  getInvites,
  createInvite,
  revokeInvite,
  removeAccess,
} from '../../api/groups.js';
import { previewInvite, claimInvite, listSharedWithMe, getSharedWithMe, leaveSharedGroup } from '../../api/invites.js';
import { getSharedGroup } from '../../api/shared.js';
import { listPeople } from '../../api/ledger.js';
import { peopleKeys, ledgerKeys } from '../ledger/queries.js';
import { transactionKeys } from '../transactions/queries.js';

export const groupKeys = {
  all: ['groups'],
  list: () => ['groups', 'list'],
  detail: (id) => ['groups', 'detail', id],
  share: (id) => ['groups', 'share', id],
  invites: (id) => ['groups', 'invites', id],
  sharedWithMe: () => ['groups', 'shared-with-me'],
  sharedWithMeDetail: (id) => ['groups', 'shared-with-me', id],
};

export const useGroups = () => useQuery({ queryKey: groupKeys.list(), queryFn: listGroups });

export const useGroup = (id) => useQuery({ queryKey: groupKeys.detail(id), queryFn: () => getGroup(id) });

// Everyone across all ledgers, for picking group members
export const useAllPeople = () => useQuery({
  queryKey: [...peopleKeys.all, 'all-ledgers'],
  queryFn: () => listPeople({ allLedgers: true }),
});

// People balances include group amounts, so any group change refreshes people and ledgers too
const useGroupMutation = (mutationFn, { touchesExpenses = () => false } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      queryClient.invalidateQueries({ queryKey: peopleKeys.all });
      queryClient.invalidateQueries({ queryKey: ledgerKeys.all });
      if (touchesExpenses(result, variables)) {
        queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      }
    },
  });
};

export const useCreateGroup = () => useGroupMutation(createGroup);

export const useUpdateGroup = () => useGroupMutation(({ id, changes }) => updateGroup(id, changes));

export const useAddGroupExpense = () =>
  useGroupMutation(({ groupId, expense }) => addGroupExpense(groupId, expense), {
    touchesExpenses: (result) => result?.myShareAdded,
  });

export const useDeleteGroupExpense = () =>
  useGroupMutation(({ groupId, expenseId }) => deleteGroupExpense(groupId, expenseId), {
    touchesExpenses: (result) => result?.myShareRemoved !== null,
  });

export const useAddGroupSettlement = () =>
  useGroupMutation(({ groupId, settlement }) => addGroupSettlement(groupId, settlement));

export const useDeleteGroupSettlement = () =>
  useGroupMutation(({ groupId, settlementId }) => deleteGroupSettlement(groupId, settlementId));

// ── Share links ──

export const useShareLink = (groupId) => useQuery({
  queryKey: groupKeys.share(groupId),
  queryFn: () => getShareLink(groupId),
});

const useShareMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (link, groupId) => queryClient.setQueryData(groupKeys.share(groupId), link),
  });
};

export const useCreateShareLink = () => useShareMutation(createShareLink);
export const useRevokeShareLink = () => useShareMutation(revokeShareLink);

// The public view; no retries on 404 (the link was turned off)
export const useSharedGroup = (token) => useQuery({
  queryKey: ['shared-group', token],
  queryFn: () => getSharedGroup(token),
  retry: false,
});

// ── Member invites (owner) ──

export const useInvites = (groupId) => useQuery({ queryKey: groupKeys.invites(groupId), queryFn: () => getInvites(groupId) });

const useInviteMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_, variables) => {
      const groupId = typeof variables === 'string' ? variables : variables.groupId;
      queryClient.invalidateQueries({ queryKey: groupKeys.invites(groupId) });
    },
  });
};

export const useCreateInvite = () => useInviteMutation(createInvite);
export const useRevokeInvite = () => useInviteMutation(revokeInvite);
export const useRemoveAccess = () => useInviteMutation(({ groupId, personId }) => removeAccess(groupId, personId));

// ── Invitee ──

export const useInvitePreview = (token) => useQuery({
  queryKey: ['invite-preview', token],
  queryFn: () => previewInvite(token),
  retry: false,
});

export const useClaimInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, memberRef }) => claimInvite(token, memberRef),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.sharedWithMe() }),
  });
};

export const useSharedWithMe = () => useQuery({ queryKey: groupKeys.sharedWithMe(), queryFn: listSharedWithMe });

export const useSharedWithMeGroup = (groupId) => useQuery({
  queryKey: groupKeys.sharedWithMeDetail(groupId),
  queryFn: () => getSharedWithMe(groupId),
  retry: false,
});

export const useLeaveSharedGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveSharedGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.sharedWithMe() }),
  });
};
