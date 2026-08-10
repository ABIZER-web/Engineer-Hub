// backend/src/routes/uploadRoutes.js
import express from 'express';
import { uploadPoster } from '../middleware/upload.js';
import { uploadPosterImage } from '../controllers/uploadController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Wrap multer so its errors (file too large, wrong type) come back as clean
// JSON instead of crashing past Express's default error handler.
const handlePosterUpload = (req, res, next) => {
    uploadPoster.single('poster')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
        next();
    });
};

router.post('/poster', protect, adminOnly, handlePosterUpload, uploadPosterImage);

export default router;
