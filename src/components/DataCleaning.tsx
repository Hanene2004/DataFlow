import { useState, useEffect } from 'react';
import {
    Download,
    Eraser,
    CheckCircle2,
    Save,
    Zap,
    Sparkles,
    Loader
} from 'lucide-react';
import { exportProfessionalExcel, exportToCSV } from '../utils/export';
import { ColumnStats } from '../utils/analysis';
import { CleaningMethod } from '../utils/cleaning';
import { detectPII } from '../utils/pii';
import { DeduplicationDialog } from './DeduplicationDialog';
import { useData } from '../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2 } from 'lucide-react';

interface AIRecommendation {
    column: string;
    method: CleaningMethod;
    reason: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
}

interface DataCleaningProps {
    data: Record<string, unknown>[];
    stats: ColumnStats[];
    onClean: (column: string, method: CleaningMethod, value?: string) => void;
}

export function DataCleaning({ data, stats, onClean }: DataCleaningProps) {
    const [selectedColumn, setSelectedColumn] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<CleaningMethod>('fill_mean');
    const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [showDedupe, setShowDedupe] = useState(false);
    const { handleDeduplicate, handleUndo, activeDataset } = useData();

    // Ensure selected column is initialized when stats arrive
    useEffect(() => {
        if (!selectedColumn && stats.length > 0) {
            setSelectedColumn(stats[0].column);
        }
    }, [stats, selectedColumn]);

    useEffect(() => {
        const generateRecommendations = () => {
            setIsThinking(true);
            const recs: AIRecommendation[] = [];

            stats.forEach(s => {
                const missingPercent = (s.missing / s.count) * 100;
                if (s.missing > 0) {
                    if (missingPercent > 50) {
                        recs.push({
                            column: s.column,
                            method: 'drop_rows',
                            reason: 'Critical vacancy detected',
                            description: 'This column is over 50% empty. Exterminating these rows is statistically safer than intuition.',
                            impact: 'high'
                        });
                    } else if (s.type === 'numeric') {
                        recs.push({
                            column: s.column,
                            method: 'fill_median',
                            reason: 'Numerical gaps detected',
                            description: 'Filling with median preserves the data distribution better than zero.',
                            impact: 'medium'
                        });
                    }
                }
            });

            // PII Scanner Integration
            const piiThreats = detectPII(data, stats.map(s => s.column));
            piiThreats.forEach(threat => {
                const method: CleaningMethod = threat.type === 'email' ? 'mask_email' : (threat.type === 'phone' ? 'mask_phone' : 'redact');
                recs.push({
                    column: threat.column,
                    method: method,
                    reason: 'PII Exposure Detected',
                    description: `This column contains sensitive ${threat.type} data. AI recommends masking to ensure compliance.`,
                    impact: 'high'
                });
            });

            setTimeout(() => {
                setRecommendations(recs);
                setIsThinking(false);
            }, 1200);
        };

        if (stats.length > 0) generateRecommendations();
    }, [stats, data]);

    const handleClean = (column: string, method: CleaningMethod, value?: string) => {
        onClean(column, method, value);
    };

    const handleAutoRepair = () => {
        if (recommendations.length === 0) return;
        setIsThinking(true);
        setTimeout(() => {
            recommendations.forEach(rec => {
                handleClean(rec.column, rec.method, rec.method === 'fill_value' ? '0' : undefined);
            });
            setIsThinking(false);
        }, 1500);
    };

    const handleUndoAction = () => {
        handleUndo();
    };

    const handlePremiumExport = () => {
        exportProfessionalExcel(data, stats, [], 'MultiHub_Premium_Report.xlsx');
    };

    const summary = {
        totalMissing: stats.reduce((acc, s) => acc + s.missing, 0),
        qualityScore: Math.round(100 - (stats.reduce((acc, s) => acc + s.missing, 0) / (stats.reduce((acc, s) => acc + s.count, 0) || 1)) * 100)
    };

    return (
        <div className="space-y-8">
            {/* Header section with refined actions */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic leading-none mb-2">Data Forge Studio</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Precision industrial cleaning pipeline with AI-assisted repair.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUndoAction}
                        disabled={!activeDataset?.versions?.length}
                        className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-all"
                    >
                        <Undo2 className="w-4 h-4" /> Undo
                    </motion.button>
                    <div className="h-10 w-[1px] bg-gray-100 dark:bg-slate-800 hidden md:block" />
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => exportToCSV(data, 'MultiHub_Export.csv')}
                        className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> CSV
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDedupe(true)}
                        className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-sm flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Dedupe
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handlePremiumExport}
                        className="px-6 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                    >
                        <Zap className="w-4 h-4" /> Premium Excel
                    </motion.button>
                </div>
            </div>

            <AnimatePresence>
                {showDedupe && (
                    <DeduplicationDialog
                        data={data}
                        columns={stats.map(s => s.column)}
                        onResolve={(resolutions) => handleDeduplicate(resolutions)}
                        onClose={() => setShowDedupe(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isThinking && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center p-12 bg-indigo-500/5 rounded-3xl border border-dashed border-indigo-500/20 gap-4"
                    >
                        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
                        <p className="text-sm font-black text-indigo-500 uppercase tracking-widest italic">Forge engine calibrating...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {recommendations.length > 0 && !isThinking && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-[1px] rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/20"
                    >
                        <div className="bg-white dark:bg-slate-950 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                    <Sparkles className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-tighter text-lg leading-tight">Auto-Forge Optimization</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{recommendations.length} critical improvements detected for your statistical profile.</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAutoRepair}
                                className="px-8 py-3 bg-indigo-600 hover:bg-slate-900 dark:bg-white dark:hover:bg-indigo-50 text-white dark:text-slate-900 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center gap-2 group"
                            >
                                <Zap className="w-4 h-4 group-hover:animate-pulse" />
                                Autonomous Repair Engine
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Metrics Sidebar - High Visibility */}
                <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-8">
                    <div className="glass-card p-8 rounded-3xl text-center relative overflow-hidden group border border-gray-100 dark:border-slate-800 shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-100" />
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 relative z-10">Data Integrity Profile</h4>

                        <div className="relative inline-flex items-center justify-center mb-8">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="58"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className="text-gray-100 dark:text-slate-800"
                                />
                                <motion.circle
                                    cx="64"
                                    cy="64"
                                    r="58"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={364.4}
                                    initial={{ strokeDashoffset: 364.4 }}
                                    animate={{ strokeDashoffset: 364.4 - (364.4 * summary.qualityScore) / 100 }}
                                    className="text-indigo-600 dark:text-blue-400"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-gray-900 dark:text-white italic leading-none">{summary.qualityScore}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Score</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative z-10 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl">
                            <div className="text-left">
                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Missing</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{summary.totalMissing}</p>
                            </div>
                            <div className="text-left border-l border-gray-200 dark:border-slate-700 pl-4">
                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Level</p>
                                <p className={`text-xl font-black leading-none ${summary.qualityScore > 90 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {summary.qualityScore > 90 ? 'Elite' : 'Stable'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-20">
                            <Zap className="w-24 h-24 text-indigo-400" />
                        </div>
                        <div className="flex items-center gap-3 mb-3 relative z-10">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Engine Status</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed italic relative z-10">
                            The Forge engine uses vector analysis to suggest the most passive cleaning protocols for your distribution profile.
                        </p>
                    </div>
                </div>

                {/* Main Action Area */}
                <div className="lg:col-span-9 space-y-8">
                    {/* Manual Configuration Forge */}
                    <div className="glass-card p-1 p-md-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                        <div className="bg-slate-50 dark:bg-slate-800/30 p-8 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1">Custom Protocol Forge</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Define specific transformations for target data sectors.</p>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                        <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Select Target Column</label>
                                    </div>
                                    <select
                                        value={selectedColumn}
                                        onChange={(e) => setSelectedColumn(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                                    >
                                        {stats.map(s => (
                                            <option key={s.column} value={s.column}>{s.column}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
                                        <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Select Protocol</label>
                                    </div>
                                    <select
                                        value={selectedMethod}
                                        onChange={(e) => setSelectedMethod(e.target.value as CleaningMethod)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                                    >
                                        <optgroup label="DIMENSION REDUCTION">
                                            <option value="drop_rows">Exterminate Missing Rows</option>
                                        </optgroup>
                                        <optgroup label="STATISTICAL INTERPOLATION">
                                            <option value="fill_mean">Mean Projection</option>
                                            <option value="fill_median">Median Projection</option>
                                            <option value="fill_zero">Zero Injection</option>
                                        </optgroup>
                                        <optgroup label="SECURITY & PRIVACY">
                                            <option value="mask_email">Mask Email Domain</option>
                                            <option value="mask_phone">Mask Phone Numbers</option>
                                            <option value="redact">Full Data Redaction</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => handleClean(selectedColumn, selectedMethod)}
                                className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all hover:bg-indigo-600 dark:hover:bg-indigo-50"
                            >
                                <Eraser className="w-5 h-5" /> Execute Data Cleaning Engine
                            </motion.button>
                        </div>
                    </div>

                    {/* AI Recommendations - Scrollable Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Forge Intelligence Lab</h4>
                            {recommendations.length > 0 && (
                                <span className="bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                    {recommendations.length} Active Tickets
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {recommendations.map((rec, i) => (
                                <motion.div
                                    key={`${rec.column}-${rec.method}-${i}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-6 rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm hover:shadow-xl hover:border-indigo-500/20 transition-all group relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${rec.impact === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                                            }`}>
                                            {rec.impact} Priority
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h5 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight mb-1">{rec.column}</h5>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium line-clamp-3">{rec.description}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50 dark:border-slate-800/50">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-indigo-500 uppercase italic">
                                            <Zap className="w-3 h-3" /> {rec.method.replace('_', ' ')}
                                        </div>
                                        <button
                                            onClick={() => handleClean(rec.column, rec.method)}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-[9px] uppercase tracking-wider transform group-hover:scale-105 active:scale-95 transition-all"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                            {recommendations.length === 0 && !isThinking && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="col-span-full py-16 px-10 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 dark:bg-slate-900/20"
                                >
                                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full shadow-lg flex items-center justify-center">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-1">Data Gaps Exterminated</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">No missing values or anomalies detected by the Forge Engine.</p>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
