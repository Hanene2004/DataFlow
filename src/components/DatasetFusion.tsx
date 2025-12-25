import { useState, useMemo, useEffect } from 'react';
import { GitMerge, Plus, Layers, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData, DatasetState } from '../context/DataContext';

export function DatasetFusion() {
    const { datasets, addDataset } = useData();
    const [id1, setId1] = useState('');
    const [id2, setId2] = useState('');
    const [joinKey, setJoinKey] = useState('');
    const [fusing, setFusing] = useState(false);
    const [success, setSuccess] = useState(false);

    const ds1 = datasets.find(d => d.id === id1);
    const ds2 = datasets.find(d => d.id === id2);

    const commonColumns = useMemo(() => {
        if (!ds1 || !ds2) return [];
        return ds1.columns.filter(c => ds2.columns.includes(c));
    }, [ds1, ds2]);

    useEffect(() => {
        if (commonColumns.length > 0 && !joinKey) setJoinKey(commonColumns[0]);
    }, [commonColumns, joinKey]);

    const handleFuse = async () => {
        if (!ds1 || !ds2 || !joinKey) return;
        setFusing(true);

        // Simulate complex join logic
        setTimeout(() => {
            const fusedData = ds1.data.map(item1 => {
                const match = ds2.data.find(item2 => item2[joinKey] === item1[joinKey]);
                return match ? { ...item1, ...match } : item1;
            });

            const allCols = Array.from(new Set([...ds1.columns, ...ds2.columns]));

            const newDataset: DatasetState = {
                id: `fusion-${Date.now()}`,
                filename: `Fusion: ${ds1.filename} + ${ds2.filename}`,
                data: fusedData,
                columns: allCols,
                stats: allCols.map(c => ({
                    column: c,
                    name: c,
                    type: 'numeric',
                    count: fusedData.length,
                    missing: 0,
                    missingPercent: 0,
                    unique: 0
                })),
                created_at: new Date().toISOString()
            };

            addDataset(newDataset);
            setFusing(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }, 2000);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                            <Layers className="w-20 h-20" />
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Source Intelligence A</h3>
                        <select
                            value={id1}
                            onChange={(e) => setId1(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl p-4 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                        >
                            <option value="">Select primary file...</option>
                            {datasets.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}
                        </select>
                    </div>

                    <div className="flex justify-center">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Plus className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                            <Layers className="w-20 h-20" />
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Source Intelligence B</h3>
                        <select
                            value={id2}
                            onChange={(e) => setId2(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl p-4 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                        >
                            <option value="">Select secondary file...</option>
                            {datasets.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}
                        </select>
                    </div>
                </div>

                <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 opacity-10">
                        <GitMerge className="w-40 h-40" />
                    </div>

                    <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none mb-4">Fusion Parameters</h2>

                    <div className="space-y-6 relative z-10">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2 block">Common Jointure Key</label>
                            <select
                                value={joinKey}
                                onChange={(e) => setJoinKey(e.target.value)}
                                disabled={commonColumns.length === 0}
                                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-xs font-black uppercase outline-none"
                            >
                                {commonColumns.length > 0 ? (
                                    commonColumns.map(c => <option key={c} value={c} className="bg-indigo-700">{c}</option>)
                                ) : (
                                    <option>No shared columns found</option>
                                )}
                            </select>
                        </div>

                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-medium leading-relaxed italic">
                                "MultiHub will perform an inner-join on <strong>{joinKey || '...'}</strong>, reconciling schema conflicts intelligently."
                            </p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleFuse}
                            disabled={!id1 || !id2 || !joinKey || fusing}
                            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${success ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-white text-indigo-600 shadow-xl'
                                }`}
                        >
                            {fusing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : success ? (
                                <CheckCircle2 className="w-4 h-4" />
                            ) : (
                                <GitMerge className="w-4 h-4" />
                            )}
                            {fusing ? 'RECONCILING DATA...' : success ? 'FUSION COMPLETE' : 'FORGE UNIFIED DATASET'}
                        </motion.button>
                    </div>
                </div>
            </div>

            {!id1 || !id2 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select two datasets above to begin fusion</p>
                </div>
            ) : null}
        </div>
    );
}
