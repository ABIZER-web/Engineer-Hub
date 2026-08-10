// backend/server.js — Engineer Hub v2.0 Production Server
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

console.log("DNS Servers:", dns.getServers());


import dotenv from 'dotenv';
dotenv.config();

import { validateEnv } from './src/config/validateEnv.js';
validateEnv();

import { setupSentryErrorHandler } from './src/config/sentry.js';

import express    from 'express';
import cors       from 'cors';
import helmet     from 'helmet';
import morgan     from 'morgan';
import cookieParser from 'cookie-parser';
import hpp         from 'hpp';
import connectDB  from './src/config/db.js';
import { apiLimiter, authLimiter } from './src/middleware/rateLimiter.js';

import userRoutes         from './src/routes/userRoutes.js';
import authRoutes         from './src/routes/authRoutes.js';
import marketplaceRoutes  from './src/routes/marketplaceRoutes.js';
import orderRoutes        from './src/routes/orderRoutes.js';
import earningRoutes      from './src/routes/earningRoutes.js';
import withdrawalRoutes   from './src/routes/withdrawalRoutes.js';
import attendanceRoutes   from './src/routes/attendanceRoutes.js';
import resourceRoutes     from './src/routes/resourceRoutes.js';
import eventRoutes        from './src/routes/eventRoutes.js';
import announcementRoutes from './src/routes/announcementRoutes.js';
import testimonialRoutes  from './src/routes/testimonialRoutes.js';
import resultRoutes       from './src/routes/resultRoutes.js';
import freelancerRoutes   from './src/routes/freelancerRoutes.js';
import analyticsRoutes    from './src/routes/analyticsRoutes.js';
import settingsRoutes     from './src/routes/settingsRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import reportRoutes        from './src/routes/reportRoutes.js';
import uploadRoutes        from './src/routes/uploadRoutes.js';
import placementRoutes     from './src/routes/placementRoutes.js';
import pushRoutes          from './src/routes/pushRoutes.js';
import auditLogRoutes      from './src/routes/auditLogRoutes.js';
import searchRoutes        from './src/routes/searchRoutes.js';
import messageRoutes       from './src/routes/messageRoutes.js';
import path from 'path';

connectDB();

const app  = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// Render/Vercel/most hosts sit behind a reverse proxy. Without this,
// express-rate-limit and req.ip see the proxy's IP for every request
// (either breaking rate limiting or making it trivially bypassable).
if (isProd) app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", ...(process.env.FRONTEND_URL || '').split(',').map(o => o.trim()).filter(Boolean)],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: isProd ? [] : null,
    },
  },
  hsts: isProd ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false,
}));
app.use(hpp()); // guards against ?role=admin&role=student style HTTP param pollution

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',').map(o => o.trim())
  .concat(['http://localhost:5173','http://localhost:3000','http://localhost:5174']);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || !isProd || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error('CORS: ' + origin + ' not allowed'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','Cookie'],
}));
app.options('*', cors());

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// NoSQL injection sanitisation
app.use((req, _res, next) => {
  const clean = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const k of Object.keys(obj)) {
      if (k.startsWith('$') || k.includes('.')) { delete obj[k]; }
      else if (typeof obj[k] === 'object') clean(obj[k]);
    }
  };
  clean(req.body); clean(req.query); next();
});

if (!isProd) app.use(morgan('dev'));

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'Engineer Hub API v2 running ✅', ts: new Date() }));
app.get('/', (_req, res) => res.json({ message: '🚀 Engineer Hub API v2.0' }));

app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/marketplace',   marketplaceRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/earnings',      earningRoutes);
app.use('/api/withdrawals',   withdrawalRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/resources',     resourceRoutes);
app.use('/api/events',        eventRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/testimonials',  testimonialRoutes);
app.use('/api/results',       resultRoutes);
app.use('/api/freelancers',   freelancerRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/settings',      settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/api/uploads',       uploadRoutes);
app.use('/api/placements',    placementRoutes);
app.use('/api/push',          pushRoutes);
app.use('/api/audit-logs',    auditLogRoutes);
app.use('/api/search',        searchRoutes);
app.use('/api/messages',      messageRoutes);

// Serve uploaded poster images. This directory only ever contains files written
// by our own multer config (randomized names, image-only), never arbitrary
// user-supplied paths, so this is safe to expose read-only.
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

setupSentryErrorHandler(app); // captures errors to Sentry (no-op if SENTRY_DSN isn't set) before our own handler formats the response

app.use((err, _req, res, _next) => {
  console.error('Error:', err.message);
  const code = err.status || (err.code === 11000 ? 400 : err.name?.includes('Token') ? 401 : 500);
  const msg = err.code === 11000 ? 'Email already in use' : err.message || 'Internal server error';
  res.status(code).json({ success: false, message: msg });
});

app.listen(PORT, () => {
  console.log('\n🚀 Engineer Hub API → http://localhost:' + PORT);
  console.log('📦 ' + (process.env.NODE_ENV || 'development') + ' | Helmet + Rate-Limit + Sanitize\n');
});

export default app;
