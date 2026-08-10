// frontend/src/utils/formatters.js
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

// =============================================
// DATE FORMATTERS
// =============================================

/**
 * Format a date to a human-readable string
 * @param {Date|string} date
 * @param {string} formatStr - date-fns format string
 */
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
    if (!date) return '—';
    try {
        const d = typeof date === 'string' ? parseISO(date) : new Date(date);
        if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
        if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
        return format(d, formatStr);
    } catch {
        return '—';
    }
};

/**
 * Format date to short form: Jan 15, 2025
 */
export const formatDateShort = (date) => {
    if (!date) return '—';
    try {
        return format(new Date(date), 'MMM d, yyyy');
    } catch {
        return '—';
    }
};

/**
 * Format date with time: Jan 15, 2025 at 3:30 PM
 */
export const formatDateWithTime = (date) => {
    if (!date) return '—';
    try {
        return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
    } catch {
        return '—';
    }
};

/**
 * Relative time: "3 days ago", "just now"
 */
export const formatRelativeTime = (date) => {
    if (!date) return '—';
    try {
        return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
        return '—';
    }
};

/**
 * Format date for input fields: YYYY-MM-DD
 */
export const formatDateForInput = (date) => {
    if (!date) return '';
    try {
        return format(new Date(date), 'yyyy-MM-dd');
    } catch {
        return '';
    }
};

/**
 * Format time: 10:30 AM
 */
export const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    try {
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm}`;
    } catch {
        return timeStr;
    }
};

// =============================================
// CURRENCY FORMATTERS
// =============================================

/**
 * Format Indian Rupee currency
 * @param {number} amount
 * @param {boolean} compact - use K/L/Cr abbreviations
 */
export const formatCurrency = (amount, compact = false) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
    const num = Number(amount);

    if (compact) {
        if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
        if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
        if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
        return `₹${num}`;
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(num);
};

/**
 * Format compact number with Indian suffixes
 */
export const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    const n = Number(num);
    if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
};

// =============================================
// ATTENDANCE UTILITIES
// =============================================

/**
 * Calculate attendance percentage
 * @param {number} present
 * @param {number} total
 */
export const calcAttendancePercent = (present, total) => {
    if (!total || total === 0) return 0;
    return parseFloat(((present / total) * 100).toFixed(2));
};

/**
 * Calculate minimum classes to attend for 75% target
 * @param {number} present - classes attended
 * @param {number} total   - total classes held
 * @param {number} target  - target % (default 75)
 */
export const classesNeededFor = (present, total, target = 75) => {
    // present + x / (total + x) >= target/100
    // => present + x >= (target/100) * (total + x)
    // => present + x - (target/100)*total - (target/100)*x >= 0
    // => x(1 - target/100) >= (target/100)*total - present
    const t = target / 100;
    const needed = Math.ceil((t * total - present) / (1 - t));
    return Math.max(0, needed);
};

/**
 * Calculate classes you can bunk while maintaining target
 */
export const classesCanBunk = (present, total, target = 75) => {
    // (present) / (total + x) >= target/100 => x <= present/(target/100) - total
    const t = target / 100;
    const canBunk = Math.floor(present / t - total);
    return Math.max(0, canBunk);
};

/**
 * Get color class based on attendance percentage
 */
export const getAttendanceColor = (percent) => {
    if (percent >= 85) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (percent >= 75) return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (percent >= 60) return { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
};

// =============================================
// GRADE UTILITIES
// =============================================

export const getGradeFromPercent = (percent) => {
    if (percent >= 90) return 'O';
    if (percent >= 80) return 'A+';
    if (percent >= 70) return 'A';
    if (percent >= 60) return 'B+';
    if (percent >= 50) return 'B';
    if (percent >= 45) return 'C';
    if (percent >= 40) return 'D';
    return 'F';
};

export const getGradePoints = (percent) => {
    if (percent >= 90) return 10;
    if (percent >= 80) return 9;
    if (percent >= 70) return 8;
    if (percent >= 60) return 7;
    if (percent >= 50) return 6;
    if (percent >= 45) return 5;
    if (percent >= 40) return 4;
    return 0;
};

// =============================================
// FILE SIZE FORMATTER
// =============================================

export const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
