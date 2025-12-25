import { useMemo } from 'react';
import { AlertTriangle, Zap, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

interface EarlyWarningProps {
    data: Record<string, unknown>[];
    columns: string[];
}

interface Anomaly {
    column: string;
    rowIndex: number;
    value: string | number | boolean | null;
    severity: 'high' | 'medium';
    reason: string;
}

export function EarlyWarning({ data, columns }: EarlyWarningProps) {
    const anomalies = useMemo(() => {
        const results: Anomaly[] = [];
        if (data.length < 5) return results;

        columns.forEach(col => {
            const values = data.map(d => d[col]).filter(v => typeof v === 'number') as number[];
            if (values.length < 5) return;

            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);

            if (stdDev === 0) return;

            data.forEach((row, idx) => {
                const val = row[col];
                if (typeof val !== 'number') return;

                const zScore = Math.abs((val - mean) / stdDev);
                if (zScore > 4) {
                    results.push({
                        column: col,
                        rowIndex: idx,
                        value: val,
                        severity: zScore > 6 ? 'high' : 'medium',
                        reason: `Z-Score of ${zScore.toFixed(2)} detected. Significant deviation from norm.`
                    });
                }
            });
        });

        return results.slice(0, 3); // Return only top 3 for brevity
    }, [data, columns]);

    if (anomalies.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-rose-500/30 overflow-hidden shadow-2xl shadow-rose-500/10 mb-8"
        >
            <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>

            <div className="p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/40 animate-pulse">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic leading-none mb-2">Early Warning Signal</h2>
                        <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">
                            The forge engine detected {anomalies.length} structural anomalies.
                        </p>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {anomalies.map((anno, i) => (
                        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-rose-200 dark:hover:border-rose-900/30 transition-all group">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldAlert className={`w-3 h-3 ${anno.severity === 'high' ? 'text-rose-600' : 'text-amber-500'}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-rose-500 transition-colors">
                                    {anno.column}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-slate-900 dark:text-gray-300 truncate">Outlier: {anno.value}</p>
                            <p className="text-[9px] text-slate-500 mt-1 leading-tight">{anno.reason}</p>
                        </div>
                    ))}
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center gap-2 group"
                >
                    <Zap className="w-4 h-4 group-hover:text-amber-400" />
                    Fix Protocols
                    <ArrowRight className="w-4 h-4" />
                </motion.button>
            </div>

            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="h-full bg-rose-500/20"
                />
            </div>
        </motion.div>
    );
}
