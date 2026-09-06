// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Vercel sets NEXT_PUBLIC_VERCEL_ENV to "production" | "preview" | "development"
// automatically; it is absent when running locally, which is what keeps local server
// errors off the dashboard without needing an opt-out flag.
const environment = process.env.NEXT_PUBLIC_VERCEL_ENV ?? "local";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment,

  // Local runs report nothing: the dashboard should only ever show deployed code.
  enabled: environment !== "local",

  // Full tracing everywhere except production, where it would be expensive.
  tracesSampleRate: environment === "production" ? 0.1 : 1,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});
