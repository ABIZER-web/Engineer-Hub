// backend/src/controllers/searchController.js
import MarketplaceItem from '../models/MarketplaceItem.js';
import Resource from '../models/Resource.js';
import FreelanceProject from '../models/FreelanceProject.js';
import Placement from '../models/Placement.js';

const PER_CATEGORY_LIMIT = 6;

// @desc    Search across marketplace, resources, freelance projects, and placements
// @route   GET /api/search?q=...
// @access  Private
export const globalSearch = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (q.length < 2) {
            return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
        }

        const rx = { $regex: q, $options: 'i' };

        const [marketplace, resources, freelance, placements] = await Promise.all([
            MarketplaceItem.find({
                status: 'approved', isActive: true,
                $or: [{ title: rx }, { description: rx }, { techStack: rx }, { category: rx }],
            }).select('title price category images').limit(PER_CATEGORY_LIMIT),

            Resource.find({
                isApproved: true, isActive: true,
                $or: [{ title: rx }, { description: rx }, { subject: rx }],
            }).select('title subject resourceType branch semester').limit(PER_CATEGORY_LIMIT),

            FreelanceProject.find({
                isActive: true, moderationStatus: 'approved',
                $or: [{ title: rx }, { description: rx }, { skills: rx }],
            }).select('title budget status skills').limit(PER_CATEGORY_LIMIT),

            Placement.find({
                isActive: true,
                $or: [{ title: rx }, { company: rx }, { description: rx }],
            }).select('title company type deadline').limit(PER_CATEGORY_LIMIT),
        ]);

        const totalCount = marketplace.length + resources.length + freelance.length + placements.length;

        return res.status(200).json({
            success: true, totalCount,
            results: {
                marketplace: marketplace.map(i => ({ id: i._id, title: i.title, subtitle: `₹${i.price} · ${i.category}`, link: '/marketplace' })),
                resources: resources.map(r => ({ id: r._id, title: r.title, subtitle: `${r.subject || r.resourceType}${r.branch !== 'All' ? ` · ${r.branch}` : ''}`, link: '/resources' })),
                freelance: freelance.map(p => ({ id: p._id, title: p.title, subtitle: `₹${p.budget} · ${p.status}`, link: '/freelancing' })),
                placements: placements.map(p => ({ id: p._id, title: p.title, subtitle: `${p.company} · ${p.type}`, link: '/placements' })),
            },
        });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
