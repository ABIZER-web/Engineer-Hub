// backend/src/config/validateEnv.js
//
// Runs once at boot, right after dotenv loads. Fails loudly (and, in
// production, refuses to start) rather than silently running with a
// missing or guessable secret — the kind of gap that's invisible until
// someone actually exploits it.

const WEAK_SUBSTRINGS = [
    'secret', 'changeme', 'change_me', 'password', '123456',
    'testing', 'example', 'placeholder', 'your_jwt_secret_here',
    'your_secret_here', 'your_cookie_secret_here',
];
const WEAK_EXACT = ['test', 'default', 'admin', 'password', '123456', 'changeme'];

// For long random secrets (JWT/cookie) — substring match catches "...your_secret_here..." style leftovers
const isWeak = (value) => {
    if (!value) return true;
    const lower = value.toLowerCase().trim();
    return WEAK_SUBSTRINGS.some(weak => lower.includes(weak));
};

// For shorter values like passcodes — exact match only, so a strong passcode that merely
// contains a common word as part of a longer random string (e.g. "eh-admin-xS-CY42WyBQE")
// isn't flagged just because it says "admin" somewhere in it
const isWeakExact = (value) => {
    if (!value) return true;
    const lower = value.toLowerCase().trim();
    if (WEAK_EXACT.includes(lower) || value.length < 8) return true;
    // catches "admin123", "superadmin123", "password1" etc — a dictionary
    // word immediately followed by digits is a textbook guessable pattern,
    // even past the 8-char minimum above
    return /^(admin|superadmin|password|test|user|student|welcome|changeme)\d*$/i.test(lower);
};

const looksLikePlaceholder = (value) =>
    !value || /your_|_here$|example\.com|changeme/i.test(value);

export const validateEnv = () => {
    const errors = [];
    const warnings = [];
    const isProd = process.env.NODE_ENV === 'production';

    // ── Required, security-critical ────────────────────────────────────
    if (!process.env.MONGODB_URI) {
        errors.push('MONGODB_URI is not set — the app cannot connect to a database.');
    } else if (!/^mongodb(\+srv)?:\/\//.test(process.env.MONGODB_URI)) {
        errors.push('MONGODB_URI does not look like a valid MongoDB connection string.');
    }

    if (!process.env.JWT_SECRET) {
        errors.push('JWT_SECRET is not set — auth tokens cannot be signed.');
    } else if (process.env.JWT_SECRET.length < 32) {
        errors.push('JWT_SECRET is too short (< 32 chars) — tokens would be forgeable. Generate a long random value, e.g. `openssl rand -hex 64`.');
    } else if (isWeak(process.env.JWT_SECRET)) {
        errors.push('JWT_SECRET looks like a placeholder/weak value, not a real secret. Generate a long random value, e.g. `openssl rand -hex 64`.');
    }

    if (!process.env.COOKIE_SECRET) {
        errors.push('COOKIE_SECRET is not set — signed cookies cannot be verified.');
    } else if (process.env.COOKIE_SECRET.length < 32 || isWeak(process.env.COOKIE_SECRET)) {
        errors.push('COOKIE_SECRET is too short or looks like a placeholder. Generate a long random value, e.g. `openssl rand -hex 32`.');
    }

    if (!process.env.FRONTEND_URL) {
        errors.push('FRONTEND_URL is not set — CORS will reject every browser request.');
    } else if (isProd && /localhost|127\.0\.0\.1/.test(process.env.FRONTEND_URL)) {
        errors.push('FRONTEND_URL is set to localhost while NODE_ENV=production — set it to your real deployed frontend URL.');
    }

    // ── Privilege-escalation surface — warn even though not strictly "broken" ──
    if (process.env.ADMIN_PASSCODE && isWeakExact(process.env.ADMIN_PASSCODE)) {
        warnings.push('ADMIN_PASSCODE looks guessable — anyone who finds it can self-register as an admin.');
    }
    if (process.env.SUPER_ADMIN_PASSCODE && isWeakExact(process.env.SUPER_ADMIN_PASSCODE)) {
        warnings.push('SUPER_ADMIN_PASSCODE looks guessable — anyone who finds it can self-register as a super admin.');
    }

    // ── Optional features with graceful fallbacks — informational only ──
    if (looksLikePlaceholder(process.env.EMAIL_USER) || looksLikePlaceholder(process.env.EMAIL_PASS)) {
        warnings.push('EMAIL_USER/EMAIL_PASS are unset or placeholders — emails will be logged to the console instead of sent.');
    }
    if (looksLikePlaceholder(process.env.VAPID_PUBLIC_KEY) || looksLikePlaceholder(process.env.VAPID_PRIVATE_KEY)) {
        warnings.push('VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY are unset — browser push notifications will silently no-op.');
    }
    if (looksLikePlaceholder(process.env.CLOUDINARY_CLOUD_NAME)) {
        warnings.push('CLOUDINARY_* vars are placeholders — note the app does not currently use Cloudinary anywhere (marketplace images and posters use plain URLs / local uploads), so this is likely dead config, not a missing feature.');
    }
    if (!process.env.SENTRY_DSN) {
        warnings.push('SENTRY_DSN is not set — errors will only be logged to the console, not tracked in Sentry. Fine for local dev, worth setting for production.');
    }

    // ── Report ────────────────────────────────────────────────────────
    if (warnings.length) {
        console.warn('\n⚠️  Environment warnings (non-fatal):');
        warnings.forEach(w => console.warn(`   - ${w}`));
    }

    if (errors.length) {
        console.error('\n❌ Environment validation failed:');
        errors.forEach(e => console.error(`   - ${e}`));
        console.error(`\nFix these in backend/.env before ${isProd ? 'deploying' : 'continuing'}.\n`);
        if (isProd) {
            process.exit(1); // refuse to boot in production with insecure/missing config
        } else {
            console.error('⚠️  Continuing in development mode despite the errors above — this would refuse to start in production.\n');
        }
    } else {
        console.log('✅ Environment validated');
    }
};
