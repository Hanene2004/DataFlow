import { useState } from 'react';
import { Clock, RotateCcw, GitCompare, Calendar, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';
import { ColumnStats } from '../utils/analysis';

interface Version {
    timestamp: number;
    data: Record<string, unknown>[];
    stats: ColumnStats[];
}

export function TimeMachine() {
    const { activeDataset, updateDataset } = useData();
    const [selectedA, setSelectedA] = useState<number | null>(null);
    const [selectedB, setSelectedB] = useState<number | null>(null);

    if (!activeDataset || !activeDataset.versions || activeDataset.versions.length === 0) {
        return (
            <div className="p-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
                <Clock className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Timeline is Empty</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Modify your data in the Control Center to generate snapshots</p>
            </div>
        );
    }

    const versions = [...(activeDataset.versions || [])].reverse();

    const handleRestore = (version: Version) => {
        if (!window.confirm("Are you sure you want to restore this version? Current changes will be moved to history.")) return;

        const currentVersion = {
            timestamp: Date.now(),
            data: [...activeDataset.data],
            stats: [...activeDataset.stats]
        };

        updateDataset(activeDataset.id, {
            data: version.data,
            stats: version.stats,
            versions: [...(activeDataset.versions || []), currentVersion]
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Timeline Column */}
            <div className="lg:col-span-1 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Snapshots History</h2>
                </div>

                <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                    <div className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-900 z-10 shadow-lg shadow-indigo-500/20" />
                        <div className="p-5 bg-indigo-600 text-white rounded-3xl shadow-xl">
                            <h4 className="text-xs font-black uppercase tracking-tighter">Current Intelligence State</h4>
                            <p className="text-[10px] opacity-70 mt-1 uppercase font-bold tracking-widest">{format(Date.now(), 'HH:mm:ss')}</p>
                        </div>
                    </div>

                    {versions.map((v, i) => (
                        <motion.div
                            key={v.timestamp}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="relative group cursor-pointer"
                        >
                            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-slate-900 z-10 group-hover:bg-indigo-500 transition-colors" />
                            <div className={`p-5 rounded-3xl border border-gray-100 dark:border-slate-800 transition-all ${selectedA === v.timestamp || selectedB === v.timestamp
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200'
                                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-slate-400 font-bold" />
                                        <span className="text-[10px] font-black text-slate-500 tracking-widest">{format(v.timestamp, 'MMM dd, HH:mm')}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRestore(v)}
                                        className="p-1.5 hover:bg-indigo-600 hover:text-white rounded-lg transition-all text-slate-400"
                                        title="Restore this version"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                    </button>
                                </div>
                                <h4 className="text-[10px] font-black uppercase text-slate-900 dark:text-gray-300">Data Snapshot</h4>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-400 uppercase">Rows</span>
                                        <span className="text-xs font-black text-slate-900 dark:text-white tracking-tighter">{v.data.length}</span>
                                    </div>
                                    <div className="w-[1px] h-4 bg-slate-100 dark:bg-slate-800" />
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-400 uppercase">Cols</span>
                                        <span className="text-xs font-black text-slate-900 dark:text-white tracking-tighter">{v.stats.length}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!selectedA) setSelectedA(v.timestamp);
                                            else if (!selectedB) setSelectedB(v.timestamp);
                                            else { setSelectedA(v.timestamp); setSelectedB(null); }
                                        }}
                                        className="ml-auto text-[8px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700"
                                    >
                                        Select for Diff
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Analysis/Diff Column */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900 rounded-[2.5rem] p-10 min-h-[600px] text-white relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <GitCompare className="w-40 h-40" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none mb-2">Diff Engine</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-10">Structural delta between temporal intelligence points</p>
                    </div>

                    {(selectedA && selectedB) ? (
                        <div className="flex-1 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                    <p className="text-[10px] uppercase opacity-50 font-black mb-1">State A</p>
                                    <p className="text-lg font-black uppercase italic">{format(selectedA, 'HH:mm:ss')}</p>
                                </div>
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                    <p className="text-[10px] uppercase opacity-50 font-black mb-1">State B</p>
                                    <p className="text-lg font-black uppercase italic">{format(selectedB, 'HH:mm:ss')}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">Delta Intelligence</h3>
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                        <span className="text-sm font-bold opacity-70">Row Count Shift</span>
                                        <span className={`text-sm font-black ${selectedA && selectedB && (activeDataset.versions.find(v => v.timestamp === selectedB)!.data.length >= activeDataset.versions.find(v => v.timestamp === selectedA)!.data.length) ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {selectedA && selectedB && (activeDataset.versions.find(v => v.timestamp === selectedB)!.data.length - activeDataset.versions.find(v => v.timestamp === selectedA)!.data.length)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold opacity-70">Quality Delta</span>
                                        <span className="text-sm font-black text-indigo-400">
                                            {selectedA && selectedB ? (
                                                (() => {
                                                    const vA = activeDataset.versions.find(v => v.timestamp === selectedA)!;
                                                    const vB = activeDataset.versions.find(v => v.timestamp === selectedB)!;
                                                    const missingA = vA.stats.reduce((acc, s) => acc + s.missing, 0);
                                                    const missingB = vB.stats.reduce((acc, s) => acc + s.missing, 0);
                                                    const diff = missingA - missingB;
                                                    return diff > 0 ? `+${diff} Values Repaired` : diff < 0 ? `${diff} Values Lost` : 'Neutral Impact';
                                                })()
                                            ) : 'Calculating...'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-indigo-600 rounded-3xl shadow-2xl">
                                <h4 className="text-sm font-black uppercase tracking-widest mb-4">Strategic Recommendation</h4>
                                <p className="text-xs font-medium leading-relaxed italic opacity-90">
                                    {selectedA && selectedB ? (
                                        (() => {
                                            const vA = activeDataset.versions.find(v => v.timestamp === selectedA)!;
                                            const vB = activeDataset.versions.find(v => v.timestamp === selectedB)!;
                                            const rowsA = vA.data.length;
                                            const rowsB = vB.data.length;
                                            const colsA = vA.stats.length;
                                            const colsB = vB.stats.length;

                                            if (rowsB > rowsA) return `State B introduced ${rowsB - rowsA} new records. Audit the source for data duplication or expansion patterns.`;
                                            if (rowsB < rowsA) return `State B removed ${rowsA - rowsB} records. This refinement suggests an aggressive cleaning or subsetting operation.`;
                                            if (colsB !== colsA) return `Schema evolved from ${colsA} to ${colsB} columns. Verify downstream compatibility for the newly added dimensions.`;
                                            return "Mathematical equilibrium maintained. No significant structural shifts detected between these temporal points.";
                                        })()
                                    ) : "Awaiting selection..."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <List className="w-8 h-8 text-slate-700" />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tighter opacity-50 italic">Select Two Snapshots</h3>
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-2">To perform a full delta analysis between data points</p>
                        </div>
                    )}

                    {(selectedA || selectedB) && (
                        <button
                            onClick={() => { setSelectedA(null); setSelectedB(null); }}
                            className="mt-auto text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                        >
                            Reset Delta Engine
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
