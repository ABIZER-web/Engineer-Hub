// backend/src/controllers/marketplaceController.js
import MarketplaceItem from '../models/MarketplaceItem.js';
import Order from '../models/Order.js';
import { createNotification } from './notificationController.js';
import { logAction } from './auditLogController.js';

const PLATFORM_FEE = 0.05; // 5%

export const getAllItems = async (req, res) => {
    try {
        const items = await MarketplaceItem.find({ isActive: true }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, items });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getApprovedItems = async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice, difficulty, sort, page = 1, limit = 24 } = req.query;
        const query = { status: 'approved', isActive: true };

        if (category && category !== 'All') query.category = category;
        if (difficulty && difficulty !== 'All') query.difficulty = difficulty;
        if (search) query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { techStack: { $regex: search, $options: 'i' } },
        ];
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        let sortQuery = { createdAt: -1 };
        if (sort === 'priceLow') sortQuery = { price: 1 };
        else if (sort === 'priceHigh') sortQuery = { price: -1 };
        else if (sort === 'rating') sortQuery = { averageRating: -1 };
        else if (sort === 'popular') sortQuery = { purchaseCount: -1 };

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(60, Math.max(1, parseInt(limit)));

        const [items, totalCount] = await Promise.all([
            MarketplaceItem.find(query).sort(sortQuery).skip((pageNum - 1) * limitNum).limit(limitNum),
            MarketplaceItem.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true, items,
            page: pageNum, totalPages: Math.ceil(totalCount / limitNum), totalCount, hasMore: pageNum * limitNum < totalCount,
        });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getPendingItems = async (req, res) => {
    try {
        const items = await MarketplaceItem.find({ status: 'pending', isActive: true }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, items });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getItemsByUser = async (req, res) => {
    try {
        const items = await MarketplaceItem.find({ sellerId: req.params.userId, isActive: true }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, items });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getItemById = async (req, res) => {
    try {
        const item = await MarketplaceItem.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        item.viewCount += 1;
        await item.save({ validateBeforeSave: false });
        return res.status(200).json({ success: true, item });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const createItem = async (req, res) => {
    try {
        const { title, description, price, category, projectType, images, sourceLink, demoLink, techStack, features, requirements, documentation, difficulty, duration, version, license, dependencies, tags } = req.body;
        if (!title || !description || price === undefined) {
            return res.status(400).json({ success: false, message: 'Title, description, and price are required' });
        }

        const numericPrice = parseFloat(price);
        const platformFee = parseFloat((numericPrice * PLATFORM_FEE).toFixed(2));
        const sellerEarning = parseFloat((numericPrice - platformFee).toFixed(2));

        const item = await MarketplaceItem.create({
            title: title.trim(), description, price: numericPrice, category, projectType,
            images: images || [], sourceLink, demoLink, techStack, features, requirements,
            documentation, difficulty, duration, version, license, dependencies,
            sellerId: req.user._id,
            sellerEmail: req.user.email,
            sellerName: `${req.user.firstName} ${req.user.lastName}`.trim(),
            platformFee, sellerEarning,
            tags: tags || [],
        });

        return res.status(201).json({ success: true, message: 'Item submitted for approval', item });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const updateItem = async (req, res) => {
    try {
        const EDITABLE_FIELDS = [
            'title', 'description', 'price', 'category', 'projectType', 'images',
            'sourceLink', 'demoLink', 'techStack', 'features', 'requirements',
            'documentation', 'difficulty', 'duration', 'version', 'license', 'dependencies',
        ];
        const updates = {};
        for (const field of EDITABLE_FIELDS) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }
        // A seller may mark their own item sold, but cannot self-approve/reject —
        // that stays admin-only via the dedicated /approve route.
        if (req.body.status === 'sold') updates.status = 'sold';

        const item = await MarketplaceItem.findOneAndUpdate(
            { _id: req.params.id, sellerId: req.user._id },
            updates,
            { new: true }
        );
        if (!item) return res.status(404).json({ success: false, message: 'Item not found or access denied' });
        return res.status(200).json({ success: true, item });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const deleteItem = async (req, res) => {
    try {
        const item = await MarketplaceItem.findOneAndDelete({ _id: req.params.id, sellerId: req.user._id });
        if (!item) return res.status(404).json({ success: false, message: 'Item not found or access denied' });
        return res.status(200).json({ success: true, message: 'Item deleted' });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const approveItem = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
        }
        const item = await MarketplaceItem.findByIdAndUpdate(
            req.params.id,
            { status, approvedBy: req.user._id, approvedAt: new Date() },
            { new: true }
        );
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        if (item.sellerId) {
            createNotification({
                user: item.sellerId,
                type: status === 'approved' ? 'item_approved' : 'item_rejected',
                title: status === 'approved' ? 'Listing approved 🎉' : 'Listing rejected',
                message: status === 'approved'
                    ? `Your item "${item.title}" is now live on the marketplace.`
                    : `Your item "${item.title}" was not approved. Check it for issues and resubmit.`,
                link: '/marketplace',
            });
        }

        logAction({ actor: req.user, action: `${status}_marketplace_item`, targetType: 'marketplace', targetId: item._id, targetLabel: item.title });

        return res.status(200).json({ success: true, message: `Item ${status}`, item });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Approve or reject many items at once
// @route   POST /api/marketplace/bulk-moderate
// @access  Private/Admin
export const bulkModerateItems = async (req, res) => {
    try {
        const { ids, status } = req.body;
        if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ success: false, message: 'ids must be a non-empty array' });
        if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });

        const items = await MarketplaceItem.find({ _id: { $in: ids } });
        await MarketplaceItem.updateMany({ _id: { $in: ids } }, { status, approvedBy: req.user._id, approvedAt: new Date() });

        for (const item of items) {
            if (item.sellerId) {
                createNotification({
                    user: item.sellerId,
                    type: status === 'approved' ? 'item_approved' : 'item_rejected',
                    title: status === 'approved' ? 'Listing approved 🎉' : 'Listing rejected',
                    message: status === 'approved'
                        ? `Your item "${item.title}" is now live on the marketplace.`
                        : `Your item "${item.title}" was not approved. Check it for issues and resubmit.`,
                    link: '/marketplace',
                });
            }
            logAction({ actor: req.user, action: `${status}_marketplace_item`, targetType: 'marketplace', targetId: item._id, targetLabel: item.title, note: 'bulk action' });
        }

        return res.status(200).json({ success: true, message: `${items.length} item(s) ${status}`, count: items.length });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Leave a review on a purchased item (one review per buyer per item)
// @route   POST /api/marketplace/:id/review
// @access  Private — must have a completed order for this item
export const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const stars = Number(rating);
        if (!stars || stars < 1 || stars > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        // Only a genuine buyer can review — prevents fake/competitor reviews
        const hasPurchased = await Order.exists({
            itemId: req.params.id, buyerId: req.user._id, status: 'completed',
        });
        if (!hasPurchased) {
            return res.status(403).json({ success: false, message: 'You can only review items you have purchased' });
        }

        const item = await MarketplaceItem.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        const existing = item.reviews.find(r => r.userId.toString() === req.user._id.toString());
        if (existing) {
            existing.rating = stars;
            existing.comment = (comment || '').slice(0, 500);
            existing.createdAt = new Date();
        } else {
            item.reviews.push({
                userId: req.user._id,
                userName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
                rating: stars,
                comment: (comment || '').slice(0, 500),
            });
        }

        item.averageRating = item.reviews.reduce((sum, r) => sum + r.rating, 0) / item.reviews.length;
        await item.save({ validateBeforeSave: false });

        if (!existing && item.sellerId) {
            createNotification({
                user: item.sellerId,
                type: 'general',
                title: 'New review on your listing',
                message: `${req.user.firstName || 'A buyer'} left a ${stars}★ review on "${item.title}".`,
                link: '/marketplace',
            });
        }

        return res.status(200).json({ success: true, message: 'Review saved', item });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
