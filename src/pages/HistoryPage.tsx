import { useState, useEffect } from 'react';
import { History, Upload, Sparkles, BarChart2, GitCompare, Clock, Calendar, User, FileDown, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { getUserActivities } from '../utils/activityLogger';

interface ActivityLog {
    id: string;
    activity_type: 'upload' | 'clean' | 'analysis' | 'comparison' | 'export_pdf' | 'share_email' | 'login' | 'logout';
    description: string;
    created_at: string;
    metadata?: Record<string, unknown>;
}

export function HistoryPage() {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadActivities();
    }, []);

    const loadActivities = async () => {
        setLoading(true);
        const data = await getUserActivities(100); // Fetch up to 100 activities
        setActivities(data);
        setLoading(false);
    };

    const getIcon = (type: ActivityLog['activity_type']) => {
        switch (type) {
            case 'upload': return Upload;
            case 'clean': return Sparkles;
            case 'analysis': return BarChart2;
            case 'comparison': return GitCompare;
            case 'export_pdf': return FileDown;
            case 'share_email': return Mail;
            case 'login':
            case 'logout': return User;
            default: return Clock;
        }
    };

    const getColor = (type: ActivityLog['activity_type']) => {
        switch (type) {
            case 'upload': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'clean': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
            case 'analysis': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            case 'comparison': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
            case 'export_pdf': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
            case 'share_email': return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const groupByDate = (activities: ActivityLog[]) => {
        const groups: { [key: string]: ActivityLog[] } = {};

        activities.forEach(activity => {
            const dateKey = format(new Date(activity.created_at), 'yyyy-MM-dd');
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(activity);
        });

        return groups;
    };

    const groupedActivities = groupByDate(activities);
    const dates = Object.keys(groupedActivities).sort((a, b) => b.localeCompare(a));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Clock className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading activity history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <History className="w-8 h-8 text-indigo-600" />
                        Activity History
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track all your data operations and activities</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{activities.length} activities</span>
                </div>
            </div>

            {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                    <History className="w-24 h-24 text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No Activity Yet</h3>
                    <p className="text-gray-500 dark:text-gray-500">Start by uploading a dataset to see your activity history</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {dates.map(date => (
                        <div key={date} className="space-y-4">
                            <div className="flex items-center gap-3 sticky top-0 bg-gray-50 dark:bg-slate-900 py-2 z-10">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                                </h2>
                                <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                            </div>

                            <div className="space-y-3">
                                {groupedActivities[date].map((activity, index) => {
                                    const Icon = getIcon(activity.activity_type);
                                    return (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-xl ${getColor(activity.activity_type)} shrink-0`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-1">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                                            {activity.description}
                                                        </h3>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                            {format(new Date(activity.created_at), 'HH:mm')}
                                                        </span>
                                                    </div>

                                                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {activity.metadata?.filename && (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-slate-700 rounded-md text-xs text-gray-600 dark:text-gray-300">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                                    {String(activity.metadata.filename)}
                                                                </span>
                                                            )}
                                                            {activity.metadata?.rows && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {String(activity.metadata.rows)} rows
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
