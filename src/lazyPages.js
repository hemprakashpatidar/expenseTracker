import { lazy } from 'react';

// Pages outside the Expenses tab load as separate chunks, so the first screen only downloads
// and parses what it shows
const loaders = {
  people: () => import('./features/ledger/PeoplePage.jsx'),
  person: () => import('./features/ledger/PersonPage.jsx'),
  groups: () => import('./features/groups/GroupsPage.jsx'),
  group: () => import('./features/groups/GroupPage.jsx'),
  sharedWithMe: () => import('./features/groups/SharedWithMePage.jsx'),
  sharedGroup: () => import('./features/groups/SharedGroupPage.jsx'),
  invite: () => import('./features/groups/InvitePage.jsx'),
};

export const PeoplePage = lazy(loaders.people);
export const PersonPage = lazy(loaders.person);
export const GroupsPage = lazy(loaders.groups);
export const GroupPage = lazy(loaders.group);
export const SharedWithMePage = lazy(loaders.sharedWithMe);
export const SharedGroupPage = lazy(loaders.sharedGroup);
export const InvitePage = lazy(loaders.invite);

// Fetch the tab pages in the background once the app is idle, so switching tabs never waits
export const preloadTabPages = () => {
  [loaders.people, loaders.person, loaders.groups, loaders.group].forEach(load => load().catch(() => {}));
};
