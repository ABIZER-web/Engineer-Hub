// backend/src/controllers/uploadController.js

// @desc    Upload a poster image (admin only) — returns a URL to use as posterUrl
// @route   POST /api/uploads/poster
// @access  Private/Admin
export const uploadPosterImage = (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file received' });
    const url = `/uploads/posters/${req.file.filename}`;
    return res.status(201).json({ success: true, url });
};
