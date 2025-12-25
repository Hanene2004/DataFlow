import { TrendingUp, Database, CheckCircle2, Clock, Download, Share2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

interface QuickStatsWidgetProps {
    data: Record<string, unknown>[];
    stats: any[];
    quality_score?: { score: number, grade: string };
}

interface Activity {
    id: string;
    message: string;
    timestamp: Date;
    type: 'success' | 'info' | 'warning';
}

import { useSettings } from '../context/SettingsContext';

export function QuickStatsWidget({ data, stats, quality_score }: QuickStatsWidgetProps) {
    const { formatNumber } = useSettings();
    const numericColumns = stats.filter(s => s.type === 'numeric').length;
    const categoricalColumns = stats.filter(s => s.type === 'categorical').length;
    const completeness = ((data.length * stats.length - stats.reduce((acc, s) => acc + (s.missing || 0), 0)) / (data.length * stats.length) * 100).toFixed(1);

    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        // Initialize with current session activities
        const now = new Date();
        const initialActivities: Activity[] = [
            {
                id: '1',
                message: `Dataset loaded (${data.length.toLocaleString()} rows)`,
                timestamp: new Date(now.getTime() - 5000), // 5 seconds ago
                type: 'success'
            },
            {
                id: '2',
                message: `Analysis completed (${stats.length} columns)`,
                timestamp: new Date(now.getTime() - 120000), // 2 min ago
                type: 'info'
            },
            {
                id: '3',
                message: `Quality score: ${quality_score?.grade || 'A'} (${quality_score?.score || 85}/100)`,
                timestamp: new Date(now.getTime() - 300000), // 5 min ago
                type: 'success'
            }
        ];
        setActivities(initialActivities);
    }, [data.length, stats.length, quality_score]);

    const getTimeAgo = (timestamp: Date) => {
        const seconds = Math.floor((new Date().getTime() - timestamp.getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    const getActivityColor = (type: Activity['type']) => {
        switch (type) {
            case 'success': return 'bg-green-500';
            case 'info': return 'bg-blue-500';
            case 'warning': return 'bg-amber-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="space-y-4">
            {/* Data Quality Score */}
            <div className="card-3d glass-card p-6 relative overflow-hidden group animate-scale-in">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Quality</h3>
                        <CheckCircle2 className="w-5 h-5 text-green-500 animate-float" />
                    </div>

                    {/* Circular Progress */}
                    <div className="flex items-center justify-center mb-4">
                        <div className="relative w-32 h-32">
                            <svg className="transform -rotate-90 w-32 h-32">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    className="text-gray-200 dark:text-gray-700"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="url(#gradient)"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 56}`}
                                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - (quality_score?.score || 85) / 100)}`}
                                    className="transition-all duration-1000"
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
                                    {quality_score?.score || 85}
                                </span>
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                    {quality_score?.grade || 'A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {completeness}% Complete
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="card-3d glass-card p-6 relative overflow-hidden group animate-scale-in" style={{ animationDelay: '100ms' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quick Stats</h3>
                        <Database className="w-5 h-5 text-indigo-500" />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Numeric Columns</span>
                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{formatNumber(numericColumns)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Categorical</span>
                            <span className="text-sm font-black text-purple-600 dark:text-purple-400">{formatNumber(categoricalColumns)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total Rows</span>
                            <span className="text-sm font-black text-pink-600 dark:text-pink-400">{formatNumber(data.length)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card-3d glass-card p-6 relative overflow-hidden group animate-scale-in" style={{ animationDelay: '200ms' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quick Actions</h3>
                        <Sparkles className="w-5 h-5 text-blue-500" />
                    </div>

                    <div className="space-y-2">
                        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 transition-all group/btn">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover/btn:scale-110 transition-transform">
                                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Export Data</span>
                        </button>

                        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 transition-all group/btn">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover/btn:scale-110 transition-transform">
                                <Share2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Share Report</span>
                        </button>

                        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 transition-all group/btn">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover/btn:scale-110 transition-transform">
                                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Run Analysis</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Activity - Now Dynamic */}
            <div className="card-3d glass-card p-6 relative overflow-hidden group animate-scale-in" style={{ animationDelay: '300ms' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recent Activity</h3>
                        <Clock className="w-5 h-5 text-amber-500" />
                    </div>

                    <div className="space-y-3">
                        {activities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.type)} mt-1.5 ${activity.id === '1' ? 'animate-pulse' : ''}`} />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{activity.message}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{getTimeAgo(activity.timestamp)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
