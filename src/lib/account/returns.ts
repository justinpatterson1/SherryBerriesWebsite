// The reasons a customer can give when opening a return request. Lives here
// rather than in components/account/shared.tsx (a client module) so the
// server-rendered Returns Policy page can publish the same list the request
// form offers, without pulling client components into its graph.

export const RETURN_REASONS = [
  "Wrong Item Received",
  "Damaged Item",
  "Defective Item",
  "Changed Mind",
  "Other",
] as const;
