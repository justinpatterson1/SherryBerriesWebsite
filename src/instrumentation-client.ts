// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Vercel sets NEXT_PUBLIC_VERCEL_ENV to "production" | "preview" | "development"
// automatically; it is absent when running locally, which is what keeps local browser
// errors off the dashboard without needing an opt-out flag.
const environment = process.env.NEXT_PUBLIC_VERCEL_ENV ?? "local";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment,

  // Local runs report nothing: the dashboard should only ever show deployed code.
  enabled: environment !== "local",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Full tracing everywhere except production, where it would be expensive.
  tracesSampleRate: environment === "production" ? 0.1 : 1,

  // Record every session on preview builds, 10% of real traffic.
  replaysSessionSampleRate: environment === "production" ? 0.1 : 1.0,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
