import { parse } from './client.js';

// Public, no login: the read-only group behind a share link. Uses plain fetch so no session
// token is sent, and a failure can't sign out whoever happens to be logged in.
export const getSharedGroup = (token) =>
  fetch(`${import.meta.env.VITE_API_PATH}/api/shared/groups/${encodeURIComponent(token)}`).then(parse);

// The link people open (served by this app, so it works for any deployment)
export const shareUrl = (token) => `${window.location.origin}/shared/${token}`;
