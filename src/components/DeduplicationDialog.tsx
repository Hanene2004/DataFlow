import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Check,
    X,
    AlertTriangle,
    Zap,
    Layers
} from 'lucide-react';
import { DuplicateGroup, findPotentialDuplicates } from '../utils/fuzzy';

interface DeduplicationDialogProps {
    data: Record<string, unknown>[];
    columns: string[];
    onResolve: (resolutions: { group: DuplicateGroup, action: 'keep_main' | 'keep_duplicate' | 'merge' | 'ignore', selectedDuplicateIndex?: number }[]) => void;
    onClose: () => void;
}

export function DeduplicationDialog({ data, columns, onResolve, onClose }: DeduplicationDialogProps) {
    const [selectedCol, setSelectedCol] = useState(columns[0] || '');
    const [threshold, setThreshold] = useState(0.85);
    const [resolutions, setResolutions] = useState<Record<string, 'keep_main' | 'keep_duplicate' | 'merge' | 'ignore'>>({});

    const groups = useMemo(() => {
        if (!selectedCol) return [];
        return findPotentialDuplicates(data, selectedCol, threshold);
    }, [data, selectedCol, threshold]);

    const handleAction = (groupId: string, action: 'keep_main' | 'keep_duplicate' | 'merge' | 'ignore') => {
        setResolutions(prev => ({ ...prev, [groupId]: action }));
    };

    const handleApply = () => {
        const resolutionList = groups.map((g, i) => ({
            group: g,
            action: resolutions[i] || 'ignore'
        }));
        onResolve(resolutionList);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/30">
                                <Layers className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Deduplication Studio</h2>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered fuzzy matching and record resolution.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Controls */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Dimension</label>
                        <select
                            value={selectedCol}
                            onChange={(e) => setSelectedCol(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none shadow-sm"
                        >
                            {columns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Similarity Threshold</label>
                            <span className="text-[10px] font-black text-indigo-500 italic">{Math.round(threshold * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="0.99"
                            step="0.01"
                            value={threshold}
                            onChange={(e) => setThreshold(parseFloat(e.target.value))}
                            className="w-full accent-indigo-500"
                        />
                    </div>
                </div>

                {/* Groups List */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {groups.length > 0 ? (
                        groups.map((group, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`p-6 rounded-[2rem] border-2 transition-all ${resolutions[idx] && resolutions[idx] !== 'ignore'
                                    ? 'border-indigo-500/30 bg-indigo-500/5'
                                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                                    }`}
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> Potential Conflict
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 italic">Group #{idx + 1}</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent hover:border-indigo-500/20 transition-all">
                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Original Record</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{String(data[group.mainIndex][selectedCol])}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent hover:border-indigo-500/20 transition-all">
                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Duplicate Entry</p>
                                                <p className="font-bold text-indigo-500">{String(data[group.duplicates[0].index][selectedCol])}</p>
                                                <p className="text-[10px] font-black italic opacity-50 mt-1">Similarity: {Math.round(group.duplicates[0].score * 100)}%</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex md:flex-col gap-2 justify-center">
                                        {[
                                            { id: 'keep_main', label: 'Keep Original', icon: <Check className="w-3 h-3" /> },
                                            { id: 'merge', label: 'Smart Merge', icon: <Zap className="w-3 h-3" /> },
                                            { id: 'ignore', label: 'Ignore', icon: <X className="w-3 h-3" /> }
                                        ].map(action => (
                                            <button
                                                key={action.id}
                                                onClick={() => handleAction(String(idx), action.id as 'keep_main' | 'keep_duplicate' | 'merge' | 'ignore')}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${resolutions[idx] === action.id
                                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                                                    : 'bg-white dark:bg-slate-800 text-gray-400 border border-gray-100 dark:border-slate-700 hover:border-indigo-500/50'
                                                    }`}
                                            >
                                                {action.icon} {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 gap-4">
                            <Check className="w-12 h-12 opacity-10" />
                            <p className="font-black uppercase tracking-widest opacity-50">Zero Redundancy Detected</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <div className="text-[10px] font-bold text-gray-400 italic">
                        {Object.values(resolutions).length} of {groups.length} conflicts resolved
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={groups.length === 0}
                            className="px-10 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm shadow-2xl disabled:opacity-50 flex items-center gap-2"
                        >
                            Commit Resolutions
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
