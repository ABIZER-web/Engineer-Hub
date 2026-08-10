// backend/instrument.js
//
// Sentry needs to patch Node's module system BEFORE express (and other
// libraries) are imported, which only works if this file is preloaded via
// `node --import ./instrument.js server.js` rather than imported normally
// inside server.js. See package.json's start/dev scripts.
import dotenv from 'dotenv';
dotenv.config();

import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
    console.log('✅ Sentry error monitoring enabled');
}
