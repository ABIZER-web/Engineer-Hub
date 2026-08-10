// backend/src/models/Result.js
import mongoose from 'mongoose';

const subjectResultSchema = new mongoose.Schema({
    subjectName: { type: String, required: true, trim: true },
    subjectCode: { type: String, trim: true, default: '' },
    internalMarks: { type: Number, default: null, min: 0 },
    externalMarks: { type: Number, default: null, min: 0 },
    totalMarks: { type: Number, default: null, min: 0 },
    maxMarks: { type: Number, default: 100 },
    grade: { type: String, trim: true, default: '' },
    gradePoints: { type: Number, default: null },
    credits: { type: Number, default: 3, min: 1, max: 6 },
    status: { type: String, enum: ['pass', 'fail', 'absent', 'withheld', ''], default: '' },
}, { _id: false });

const resultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examType: { type: String, enum: ['midterm', 'final', 'practical', 'viva', 'other'], default: 'final' },
    semester: { type: Number, min: 1, max: 8, required: true },
    academicYear: { type: String, required: true },
    subjects: [subjectResultSchema],
    sgpa: { type: Number, default: null },
    cgpa: { type: Number, default: null },
    totalPercentage: { type: Number, default: null },
    resultStatus: { type: String, enum: ['pass', 'fail', 'atkt', 'withheld', 'pending'], default: 'pending' },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    remarks: { type: String, default: '' },
}, {
    timestamps: true
});

resultSchema.index({ userId: 1, semester: 1 });
resultSchema.index({ isApproved: 1 });

const Result = mongoose.model('Result', resultSchema);
export default Result;
