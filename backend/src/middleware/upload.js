// backend/src/middleware/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'posters');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const ALLOWED_EXT  = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        // Never trust the client-supplied filename — generate our own to avoid
        // path traversal / overwrite tricks, keep only a safe extension.
        const ext = path.extname(file.originalname).toLowerCase();
        const safeExt = ALLOWED_EXT.includes(ext) ? ext : '.jpg';
        cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`);
    },
});

const fileFilter = (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
        return cb(new Error('Only PNG, JPEG, WEBP or GIF images are allowed'));
    }
    cb(null, true);
};

export const uploadPoster = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5MB
});
