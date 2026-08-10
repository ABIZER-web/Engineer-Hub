// frontend/src/config/sentry.js
import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN;
let enabled = false;

export const initSentry = () => {
    if (!DSN) return false; // graceful no-op — same pattern as VAPID/email on the backend
    Sentry.init({
        dsn: DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    });
    enabled = true;
    return true;
};

// Safe to call even when Sentry isn't configured — becomes a no-op.
export const captureException = (error, context) => {
    if (enabled) Sentry.captureException(error, context ? { extra: context } : undefined);
};

export const isSentryEnabled = () => enabled;
