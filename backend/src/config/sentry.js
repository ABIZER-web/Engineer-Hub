// backend/src/config/sentry.js
//
// Sentry itself is initialized in instrument.js, which is preloaded via
// `node --import ./instrument.js` (see package.json) — that's a hard
// requirement of the SDK, not a style choice. This module just wires the
// Express error handler in and exposes a status check.
import * as Sentry from '@sentry/node';

export const isSentryEnabled = () => !!process.env.SENTRY_DSN;

// Wires Sentry's Express error capture in — call after all routes are registered,
// before your own final error-handling middleware. No-op if SENTRY_DSN isn't set.
export const setupSentryErrorHandler = (app) => {
    if (isSentryEnabled()) Sentry.setupExpressErrorHandler(app);
};

export { Sentry };

