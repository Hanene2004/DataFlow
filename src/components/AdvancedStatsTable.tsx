import { ColumnStats } from '../utils/analysis';

interface AdvancedStatsTableProps {
    stats: ColumnStats[];
}

export function AdvancedStatsTable({ stats }: AdvancedStatsTableProps) {
    const numericStats = stats.filter(s => s.type === 'numeric');

    if (numericStats.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white font-mono uppercase tracking-tighter">Advanced Diagnostics</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 font-black uppercase text-[10px] tracking-widest whitespace-nowrap">
                        <tr>
                            <th className="px-6 py-3">Variable</th>
                            <th className="px-6 py-3">Mean</th>
                            <th className="px-6 py-3">Median</th>
                            <th className="px-6 py-3">Min</th>
                            <th className="px-6 py-3">Max</th>
                            <th className="px-6 py-3">Std Dev</th>
                            <th className="px-6 py-3">Skewness</th>
                            <th className="px-6 py-3">Kurtosis</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {numericStats.map((stat) => (
                            <tr key={stat.column} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                <td className="px-6 py-3 font-bold text-gray-900 dark:text-white">{stat.column}</td>
                                <td className="px-6 py-3 text-gray-600 dark:text-slate-300 font-medium">{stat.mean?.toFixed(2) ?? '-'}</td>
                                <td className="px-6 py-3 text-gray-600 dark:text-slate-300 font-medium">{stat.median?.toFixed(2) ?? '-'}</td>
                                <td className="px-6 py-3 text-gray-600 dark:text-slate-300 font-medium">{stat.min?.toFixed(2) ?? '-'}</td>
                                <td className="px-6 py-3 text-gray-600 dark:text-slate-300 font-medium">{stat.max?.toFixed(2) ?? '-'}</td>
                                <td className="px-6 py-3 text-gray-600 dark:text-slate-300 font-medium">{stat.std?.toFixed(2) ?? '-'}</td>
                                <td className="px-6 py-3 text-gray-600 dark:text-slate-300 font-medium">{stat.skew?.toFixed(2) ?? '-'}</td>
                                <td className="px-6 py-3 text-gray-600 dark:text-slate-300 font-medium">{stat.kurtosis?.toFixed(2) ?? '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
