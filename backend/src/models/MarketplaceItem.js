// backend/src/models/MarketplaceItem.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
}, { _id: false });

const marketplaceItemSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    projectType: { type: String, default: 'Other' },
    images: [{ type: String }],
    sourceLink: { type: String, default: '' },
    demoLink: { type: String, default: '' },
    techStack: { type: String, default: '' },
    features: { type: String, default: '' },
    requirements: { type: String, default: '' },
    documentation: { type: String, default: '' },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Intermediate' },
    duration: { type: String, default: '' },
    version: { type: String, default: '1.0.0' },
    license: { type: String, default: 'MIT' },
    dependencies: { type: String, default: '' },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerEmail: { type: String, required: true },
    sellerName: { type: String, default: '' },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'sold'],
        default: 'pending'
    },
    isActive: { type: Boolean, default: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    purchaseCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviews: [reviewSchema],
    platformFee: { type: Number, default: 0 },
    sellerEarning: { type: Number, default: 0 },
    tags: [{ type: String }],
}, {
    timestamps: true
});

marketplaceItemSchema.index({ status: 1, isActive: 1 });
marketplaceItemSchema.index({ sellerId: 1 });
marketplaceItemSchema.index({ category: 1 });

const MarketplaceItem = mongoose.model('MarketplaceItem', marketplaceItemSchema);
export default MarketplaceItem;
