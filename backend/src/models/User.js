// backend/src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
        type: String,
        enum: ['student', 'developer', 'admin', 'super_admin'],
        default: 'student'
    },
    phone: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    profileImage: { type: String, default: '' },
    bio: { type: String, default: '' },
    branch: {
        type: String,
        enum: ['CSE', 'ECE', 'ME', 'CE', 'EE', 'Other', ''],
        default: ''
    },
    semester: { type: Number, min: 1, max: 8, default: null },
    rollNumber: { type: String, trim: true, default: '' },
    skills: [{ type: String }],
    upiId: { type: String, default: '' },
    freelancerRating: { type: Number, default: 0 },
    freelancerReviewCount: { type: Number, default: 0 },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastLogin: { type: Date, default: null },
    totalEarnings: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    googleId: { type: String, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
}, {
    timestamps: true
});

// Is the account currently locked out?
userSchema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    const parts = [this.firstName, this.middleName, this.lastName].filter(Boolean);
    return parts.join(' ');
});

// Strip sensitive/internal fields from every JSON response, even if a
// route forgets to .select('-password') explicitly (defense in depth).
userSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret) => {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        delete ret.__v;
        return ret;
    },
});
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);
export default User;
