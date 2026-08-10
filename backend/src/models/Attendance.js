// backend/src/models/Attendance.js
import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'cancelled', 'holiday'], required: true },
    markedAt: { type: Date, default: Date.now },
}, { _id: false });

const lectureSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true },
    subjectCode: { type: String, trim: true, default: '' },
    professor: { type: String, trim: true, default: '' },
    dayOfWeek: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, trim: true, default: '' },
    branch: { type: String, default: '' },
    semester: { type: Number, default: null },
    records: [attendanceRecordSchema],
    totalClasses: { type: Number, default: 0 },
    presentCount: { type: Number, default: 0 },
    absentCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

// Virtual for attendance percentage
lectureSchema.virtual('attendancePercentage').get(function () {
    if (this.totalClasses === 0) return 0;
    return parseFloat(((this.presentCount / this.totalClasses) * 100).toFixed(2));
});

lectureSchema.set('toJSON', { virtuals: true });
lectureSchema.set('toObject', { virtuals: true });

const Attendance = mongoose.model('Attendance', lectureSchema);
export default Attendance;
