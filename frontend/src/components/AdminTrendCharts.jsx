// frontend/src/components/AdminTrendCharts.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, IndianRupee, ShoppingBag, Banknote } from 'lucide-react';
import { getAnalyticsTrends } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const shortDay = (day) => {
    const d = new Date(day);
    return `${d.getDate()}/${d.getMonth() + 1}`;
};

const CardShell = ({ icon: Icon, title, children, delay = 0 }) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
        className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Icon size={14} className="text-emerald-600" />
            </div>
            <h3 className="text-xs font-black text-blue-900 uppercase tracking-wide">{title}</h3>
        </div>
        {children}
    </motion.div>
);

const tooltipStyle = { background: 'white', border: '1px solid #d1fae5', borderRadius: '12px', fontSize: '11px', fontWeight: 600 };

const AdminTrendCharts = () => {
    const [trends, setTrends] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        getAnalyticsTrends()
            .then(res => { if (mounted) setTrends(res.trends); })
            .catch(() => {})
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-white/80 rounded-2xl animate-pulse" />)}
            </div>
        );
    }
    if (!trends) return null;

    const totalRevenue30d = trends.revenue.reduce((s, d) => s + d.value, 0);
    const totalSignups30d = trends.signups.reduce((s, d) => s + d.value, 0);

    return (
        <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-3">
                <TrendingUp size={14} className="text-emerald-600" />
                <h2 className="text-xs font-black text-blue-900/60 uppercase tracking-wider">Last 30 Days</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CardShell icon={IndianRupee} title={`Revenue · ${formatCurrency(totalRevenue30d, true)} total`} delay={0.05}>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={trends.revenue}>
                            <defs>
                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                            <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fontSize: 9, fill: '#64748b' }} interval={4} />
                            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} width={35} />
                            <Tooltip contentStyle={tooltipStyle} labelFormatter={shortDay} formatter={(v) => [formatCurrency(v), 'Revenue']} />
                            <Area type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} fill="url(#revGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardShell>

                <CardShell icon={TrendingUp} title={`New Signups · ${totalSignups30d} total`} delay={0.1}>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={trends.signups}>
                            <defs>
                                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eff6ff" />
                            <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fontSize: 9, fill: '#64748b' }} interval={4} />
                            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} width={30} allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} labelFormatter={shortDay} formatter={(v) => [v, 'Signups']} />
                            <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="url(#signupGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardShell>

                <CardShell icon={ShoppingBag} title="New Listings by Type" delay={0.15}>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={trends.newListings}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                            <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fontSize: 9, fill: '#64748b' }} interval={4} />
                            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} width={25} allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} labelFormatter={shortDay} />
                            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                            <Bar dataKey="marketplace" name="Marketplace" fill="#059669" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="resources" name="Resources" fill="#2563eb" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="freelance" name="Freelance" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardShell>

                <CardShell icon={Banknote} title="Withdrawals Paid Out" delay={0.2}>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={trends.withdrawals}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#fffbeb" />
                            <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fontSize: 9, fill: '#64748b' }} interval={4} />
                            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} width={35} />
                            <Tooltip contentStyle={tooltipStyle} labelFormatter={shortDay} formatter={(v) => [formatCurrency(v), 'Paid out']} />
                            <Bar dataKey="value" fill="#d97706" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardShell>
            </div>
        </div>
    );
};

export default AdminTrendCharts;
