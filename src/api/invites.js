import { apiGet, apiPost, apiDelete, parse } from './client.js';

// Public invite preview: { groupName, emoji, invitedBy, expiresAt, members: [{ ref, name, claimed }] }.
// Plain fetch: works signed out, and a failure can't sign anyone out.
export const previewInvite = (token) =>
  fetch(`${import.meta.env.VITE_API_PATH}/api/invites/${encodeURIComponent(token)}`).then(parse);

// Signed in: become that member. Resolves with { groupId }
export const claimInvite = (token, memberRef) =>
  apiPost(`/api/invites/${encodeURIComponent(token)}/claim`, { memberRef }).then(parse);

export const inviteUrl = (token) => `${window.location.origin}/invite/${token}`;

// Groups other people shared with you
export const listSharedWithMe = () => apiGet('/api/shared-with-me/groups').then(parse).then(data => data.groups);

export const getSharedWithMe = (groupId) => apiGet(`/api/shared-with-me/groups/${groupId}`).then(parse);

export const leaveSharedGroup = (groupId) => apiDelete(`/api/shared-with-me/groups/${groupId}`).then(parse);
