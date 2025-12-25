import { useData } from '../context/DataContext';
import { Dashboard } from '../components/Dashboard';
import { EarlyWarning } from '../components/EarlyWarning';
import { ColumnStats } from '../utils/analysis';

import { SkeletonDashboard } from '../components/SkeletonDashboard';
import { ShareDialog } from '../components/ShareDialog';
import { Edit2, Trash2, Check, X, Share2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

export function DashboardPage() {
    const { activeDataset, activeId, datasets, setActiveId, renameDataset, deleteDataset, shareDataset, isUploading, loadingSession } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [editName, setEditName] = useState('');

    const handleStartEdit = () => {
        if (activeDataset) {
            setEditName(activeDataset.filename);
            setIsEditing(true);
        }
    };

    const handleSaveRename = async () => {
        if (activeDataset && editName.trim()) {
            await renameDataset(activeDataset.id, editName.trim());
            toast.success("Dataset renamed successfully");
            setIsEditing(false);
        }
    };

    const handleDelete = async () => {
        if (activeDataset && window.confirm(`Are you sure you want to delete "${activeDataset.filename}"? This cannot be undone.`)) {
            await deleteDataset(activeDataset.id);
            toast.success("Dataset deleted");
        }
    };



    // Show Skeleton if loading or if we have an activeId but no dataset yet (switching)
    if (loadingSession || isUploading || (activeId && !activeDataset)) {
        return (
            <AnimatePresence>
                <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <SkeletonDashboard />
                </motion.div>
            </AnimatePresence>
        );
    }

    if (!activeDataset) {
        if (datasets.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Welcome to DataFlow</h2>
                    <p className="text-gray-500 mb-6 mt-2">Get started by uploading your first dataset.</p>
                    <a href="/upload" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        Upload Data
                    </a>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-gray-500">Select a dataset from the top bar to view the dashboard.</p>
            </div>
        )
    }

    const {
        data,
        columns,
        stats,
        kpis,
        domain,
        summary,
        recommendations,
        quality_score,
        anomalies
    } = activeDataset;
    const totalMissing = stats.reduce((sum: number, stat: ColumnStats) => sum + stat.missing, 0);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={activeId || 'dashboard'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
            >
                {/* Gradient Welcome Section */}
                <div className="relative p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 overflow-hidden shadow-glow">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="text-white">
                            <h1 className="text-3xl font-black mb-2 animate-fadeInUp uppercase tracking-tighter italic">Intelligence Hub</h1>
                            <p className="text-indigo-100 text-sm font-medium animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                                Unified command center for dataset synthesis
                            </p>
                        </div>

                        {/* Dataset Switcher */}
                        {/* Dataset Switcher & Controls */}
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                            <span className="text-[10px] text-white/70 font-black uppercase tracking-widest mr-2">Stream:</span>

                            {isEditing ? (
                                <div className="flex items-center gap-2 animate-fadeIn">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="bg-black/20 text-white text-xs font-bold px-2 py-1 rounded border border-white/10 outline-none focus:border-white/50 w-40"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                                    />
                                    <button onClick={handleSaveRename} className="p-1 hover:bg-green-500/20 rounded text-green-400">
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-red-500/20 rounded text-red-400">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <select
                                        value={activeId || ''}
                                        onChange={(e) => setActiveId(e.target.value)}
                                        className="bg-transparent text-white text-xs font-black uppercase outline-none cursor-pointer max-w-[150px] truncate"
                                    >
                                        {datasets.map(ds => (
                                            <option key={ds.id} value={ds.id} className="bg-slate-800 text-white">{ds.filename}</option>
                                        ))}
                                    </select>

                                    <div className="h-4 w-px bg-white/20 mx-1"></div>

                                    <button
                                        onClick={() => setIsShareOpen(true)}
                                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                                        title="Share Dataset"
                                    >
                                        <Share2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={handleStartEdit}
                                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                                        title="Rename Dataset"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-white/70 hover:text-red-400 transition-colors"
                                        title="Delete Dataset"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                <EarlyWarning data={data} columns={columns} />

                <Dashboard
                    data={data}
                    columns={columns}
                    stats={stats}
                    domain={domain || 'General'}
                    summary={summary}
                    recommendations={recommendations}
                    quality_score={quality_score}
                    anomalies={anomalies}
                    kpis={kpis || []}
                    totalMissing={totalMissing}
                />

                {activeDataset && (
                    <ShareDialog
                        isOpen={isShareOpen}
                        onClose={() => setIsShareOpen(false)}
                        dataset={activeDataset}
                        onUpdateVisibility={shareDataset}
                    />
                )}
            </motion.div>
        </AnimatePresence>
    );
}
