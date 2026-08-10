// frontend/src/components/PasswordStrengthMeter.jsx
import React, { useMemo } from 'react';

// Lightweight heuristic scorer — no external dependency (zxcvbn is ~800kb).
// Not cryptographically rigorous, just enough to nudge people away from "password123".
const scorePassword = (pwd) => {
    if (!pwd) return { score: 0, label: '', feedback: [] };

    let score = 0;
    const feedback = [];

    if (pwd.length >= 8) score++; else feedback.push('At least 8 characters');
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++; else feedback.push('Mix upper & lowercase');
    if (/\d/.test(pwd)) score++; else feedback.push('Add a number');
    if (/[^A-Za-z0-9]/.test(pwd)) score++; else feedback.push('Add a symbol');

    // common weak patterns knock points off regardless of the above
    const lower = pwd.toLowerCase();
    const weakPatterns = ['password', '12345', 'qwerty', 'letmein', 'admin', pwd.length && lower === lower[0].repeat(pwd.length)];
    if (weakPatterns.some(p => p && lower.includes(String(p)))) {
        score = Math.min(score, 1);
        feedback.unshift('Avoid common words/patterns');
    }

    const levels = [
        { label: 'Very weak', color: 'bg-red-500', text: 'text-red-600' },
        { label: 'Weak', color: 'bg-orange-500', text: 'text-orange-600' },
        { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' },
        { label: 'Good', color: 'bg-emerald-500', text: 'text-emerald-600' },
        { label: 'Strong', color: 'bg-emerald-600', text: 'text-emerald-700' },
    ];
    const level = levels[Math.min(score, levels.length - 1)];

    return { score: Math.min(score, 5), label: level.label, color: level.color, text: level.text, feedback: feedback.slice(0, 2) };
};

const PasswordStrengthMeter = ({ password }) => {
    const { score, label, color, text, feedback } = useMemo(() => scorePassword(password), [password]);
    if (!password) return null;

    return (
        <div className="mt-1.5">
            <div className="flex gap-1 mb-1">
                {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? color : 'bg-gray-150'}`} style={{ backgroundColor: i < score ? undefined : '#e5e7eb' }} />
                ))}
            </div>
            <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase ${text}`}>{label}</span>
                {feedback.length > 0 && (
                    <span className="text-[10px] text-blue-900/40 font-medium">{feedback.join(' · ')}</span>
                )}
            </div>
        </div>
    );
};

export default PasswordStrengthMeter;
