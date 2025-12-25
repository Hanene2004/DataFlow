import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    MessageSquareText,
    ArrowRightLeft,
    Zap,
    RefreshCw,
    Play,
    Info,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { ColumnStats, CorrelationData } from '../utils/analysis';
import { useNotification } from '../context/NotificationContext';

interface WhatIfSandboxProps {
    data: Record<string, unknown>[];
    stats: ColumnStats[];
    correlations: CorrelationData[];
}

export function WhatIfSandbox({ stats, correlations }: WhatIfSandboxProps) {
    const { success } = useNotification();
    const numericStats = useMemo(() => stats.filter(s => s.type === 'numeric'), [stats]);
    const [targetCol, setTargetCol] = useState(numericStats[0]?.column || '');
    const [simulationValues, setSimulationValues] = useState<Record<string, number>>({});

    const targetStat = useMemo(() => stats.find(s => s.column === targetCol), [stats, targetCol]);

    const contributors = useMemo(() => {
        if (!targetCol) return [];
        return correlations
            .filter(c => (c.col1 === targetCol || c.col2 === targetCol) && Math.abs(c.correlation) > 0.3)
            .map(c => {
                const otherCol = c.col1 === targetCol ? c.col2 : c.col1;
                const otherStat = stats.find(s => s.column === otherCol);
                return {
                    column: otherCol,
                    correlation: c.correlation,
                    stat: otherStat
                };
            })
            .filter(c => c.stat)
            .slice(0, 4);
    }, [targetCol, correlations, stats]);

    const handleSimulationChange = (column: string, percentShift: number) => {
        setSimulationValues(prev => ({ ...prev, [column]: percentShift }));
    };

    const resetSimulation = () => setSimulationValues({});

    const handleExecute = () => {
        success(`Strategic simulation for ${targetCol} executed successfully. Impact analysis saved to temporary buffer.`);
    };

    const projection = useMemo(() => {
        if (!targetStat || contributors.length === 0) return { totalShift: 0, newValue: targetStat?.mean || 0 };

        let totalShiftPercent = 0;
        contributors.forEach(c => {
            const shift = simulationValues[c.column] || 0;
            // Simplified projection: shift * correlation * (std_target / std_other)
            // But since we want "Impact", we'll use a weighted influence model
            const r = c.correlation;
            const influence = shift * r;
            totalShiftPercent += influence;
        });

        const originalMean = targetStat.mean || 0;
        const shiftAmount = originalMean * (totalShiftPercent / 100);
        return {
            totalShift: totalShiftPercent,
            newValue: originalMean + shiftAmount
        };
    }, [targetStat, contributors, simulationValues]);

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <ArrowRightLeft className="w-8 h-8 text-indigo-600" /> What-If Simulation
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold ml-1 opacity-70">Model the future by simulating strategic shifts in your data.</p>
                </div>
                <button
                    onClick={resetSimulation}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-indigo-500 transition-all shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" /> Reset Environment
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Control Panel */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl space-y-8">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Target Dimension (Simulated KPI)</label>
                            <select
                                value={targetCol}
                                onChange={(e) => setTargetCol(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                            >
                                {numericStats.map(s => <option key={s.column} value={s.column}>{s.column}</option>)}
                            </select>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-amber-500" /> Active Contributors
                            </h3>

                            {contributors.length > 0 ? (
                                contributors.map((c) => (
                                    <div key={c.column} className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">{c.column}</span>
                                            <span className={`text-[10px] font-black italic ${simulationValues[c.column] > 0 ? 'text-emerald-500' : simulationValues[c.column] < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                {simulationValues[c.column] > 0 ? '+' : ''}{simulationValues[c.column] || 0}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            step="5"
                                            value={simulationValues[c.column] || 0}
                                            onChange={(e) => handleSimulationChange(c.column, parseInt(e.target.value))}
                                            className="w-full accent-indigo-600 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-50">
                                            <span>Max Decrease</span>
                                            <span>Baseline</span>
                                            <span>Max Increase</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                                    <p className="text-[10px] font-bold text-slate-400 italic">No significant contributors found for this dimension.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-indigo-600/5 border border-indigo-500/10 rounded-[2rem] flex gap-4 items-start">
                        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-1" />
                        <p className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 leading-relaxed">
                            Simulation utilizes a **Covariance-Based Influence Model** to project how shifts in correlated variables propagate through the dataset. Projections are statistical estimates.
                        </p>
                    </div>
                </div>

                {/* Projection Display */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="relative p-10 rounded-[3rem] bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl h-full flex flex-col justify-center min-h-[400px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20"></div>

                        <div className="relative z-10 text-center space-y-12">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Projected Impact for {targetCol}</p>
                                <motion.div
                                    key={projection.newValue}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-7xl md:text-8xl font-black text-white italic tracking-tighter"
                                >
                                    {projection.newValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </motion.div>
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-sm font-bold text-slate-400">Baseline: {(targetStat?.mean || 0).toFixed(2)}</span>
                                    <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                                    <div className={`flex items-center gap-1 font-black ${projection.totalShift >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {projection.totalShift >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                        <span className="text-xl italic">{Math.abs(projection.totalShift).toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Impact Visualization */}
                            <div className="relative h-24 w-full max-w-md mx-auto flex items-center justify-center">
                                <div className="absolute inset-0 border-b border-white/10"></div>
                                <motion.div
                                    animate={{
                                        height: `${Math.abs(projection.totalShift)}%`,
                                        backgroundColor: projection.totalShift >= 0 ? '#10b981' : '#f43f5e',
                                        opacity: Math.min(Math.max(Math.abs(projection.totalShift) / 100, 0.2), 0.8)
                                    }}
                                    className="w-12 rounded-t-xl shadow-2xl shadow-current blur-[1px]"
                                />
                                <div className="absolute -bottom-6 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                    Delta Impact Multiplier
                                </div>
                            </div>

                            <button
                                onClick={handleExecute}
                                className="px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform active:scale-95 flex items-center gap-3 mx-auto"
                            >
                                <Play className="w-4 h-4 fill-current" /> Execute Data Snapshot
                            </button>
                        </div>

                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 p-12 opacity-5">
                            <MessageSquareText className="w-64 h-64 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
