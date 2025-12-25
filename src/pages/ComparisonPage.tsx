import { useState } from 'react';
import { useData } from '../context/DataContext';
import { FileDiff, Loader2, GitMerge } from 'lucide-react';
import { DatasetFusion } from '../components/DatasetFusion';

export function ComparisonPage() {
    const { datasets, compareDatasets, comparisonResult } = useData();
    const [mode, setMode] = useState<'compare' | 'fuse'>('compare');
    const [id1, setId1] = useState('');
    const [id2, setId2] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCompare = async () => {
        if (!id1 || !id2) {
            setError('Please select both datasets');
            return;
        }
        if (id1 === id2) {
            setError('Please select two different datasets');
            return;
        }

        setError(null);
        setLoading(true);
        try {
            await compareDatasets(id1, id2);
        } catch (err) {
            console.error('Comparison error:', err);
            setError('Failed to compare datasets. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                    {mode === 'compare' ? <FileDiff className="w-8 h-8 text-indigo-500" /> : <GitMerge className="w-8 h-8 text-indigo-500" />}
                    {mode === 'compare' ? 'Dataset Comparison' : 'Multi-Dataset Fusion'}
                </h1>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        onClick={() => setMode('compare')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${mode === 'compare' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                    >
                        Compare
                    </button>
                    <button
                        onClick={() => setMode('fuse')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${mode === 'fuse' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                    >
                        Fuse
                    </button>
                </div>
            </div>

            {mode === 'fuse' ? (
                <DatasetFusion />
            ) : (
                <div className="space-y-8">
                    {/* Selection Area */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Original Dataset (Control)</label>
                                <select
                                    value={id1}
                                    onChange={(e) => setId1(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select baseline...</option>
                                    {datasets.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Dataset (Variant)</label>
                                <select
                                    value={id2}
                                    onChange={(e) => setId2(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select variance...</option>
                                    {datasets.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleCompare}
                            disabled={!id1 || !id2 || loading}
                            className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyzing Differences...
                                </>
                            ) : (
                                <>
                                    <FileDiff className="w-5 h-5" />
                                    Launch Deep Comparison
                                </>
                            )}
                        </button>

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                                <p className="font-semibold mb-1">Error</p>
                                <p>{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Report Cards Side-by-Side */}
                    {comparisonResult && datasets.find(d => d.id === id1) && datasets.find(d => d.id === id2) && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Visual Comparison Header */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                {[{ id: id1, label: 'Control Group' }, { id: id2, label: 'Experimental Group' }].map(({ id, label }, idx) => {
                                    const ds = datasets.find(d => d.id === id)!;
                                    return (
                                        <div key={id} className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-12 rounded-full ${idx === 0 ? 'bg-slate-400' : 'bg-indigo-500'}`} />
                                                <div>
                                                    <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-xs">{label}</h3>
                                                    <p className="text-lg font-black">{ds.filename}</p>
                                                    <div className="flex gap-4 text-xs text-slate-500 mt-1">
                                                        <span>{ds.data.length.toLocaleString()} rows</span>
                                                        <span>{ds.columns.length} cols</span>
                                                        {ds.quality_score && (
                                                            <span className={`font-bold ${ds.quality_score.grade === 'A' ? 'text-green-500' : 'text-amber-500'}`}>
                                                                Grade {ds.quality_score.grade}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Mini Chart for Top Changed Column */}
                                            {comparisonResult.value_comparison.length > 0 && (
                                                <div className="h-32 bg-white dark:bg-slate-800 rounded-lg p-2 shadow-sm">
                                                    {/* Simple visual proxy - could be real chart if we import InteractiveChart */}
                                                    <div className="w-full h-full flex items-end gap-1 px-2">
                                                        {ds.data.slice(0, 20).map((row, i) => {
                                                            const col = comparisonResult.value_comparison[0].column;
                                                            const val = Number(row[col]);
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className={`w-full rounded-t-sm ${idx === 0 ? 'bg-slate-300' : 'bg-indigo-400'}`}
                                                                    style={{ height: `${Math.min(100, (val / Math.max(1, comparisonResult.value_comparison[0].mean_v1 * 2)) * 100)}%` }}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                    <p className="text-[10px] text-center mt-1 text-slate-400 truncate">
                                                        {comparisonResult.value_comparison[0].column} distribution (sample)
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Diff Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                                    <h4 className="text-gray-500 text-sm mb-1 uppercase font-semibold">Row Delta</h4>
                                    <div className={`text-3xl font-black flex items-center gap-2 ${comparisonResult.row_diff.difference !== 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                                        {comparisonResult.row_diff.difference > 0 ? '+' : ''}{comparisonResult.row_diff.difference}
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                                    <h4 className="text-gray-500 text-sm mb-1 uppercase font-semibold">Columns Added</h4>
                                    <div className="text-3xl font-black text-green-500">
                                        {comparisonResult.schema_diff.added_columns.length}
                                    </div>
                                    {comparisonResult.schema_diff.added_columns.length > 0 && (
                                        <p className="text-xs text-green-600 mt-2 truncate">{comparisonResult.schema_diff.added_columns.join(', ')}</p>
                                    )}
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                                    <h4 className="text-gray-500 text-sm mb-1 uppercase font-semibold">Columns Removed</h4>
                                    <div className="text-3xl font-black text-red-500">
                                        {comparisonResult.schema_diff.removed_columns.length}
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Table */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-50 dark:border-slate-700 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Statistical Deviations</h3>
                                        <p className="text-sm text-gray-500">Mean value shifts in matching dimensions</p>
                                    </div>
                                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                                        {comparisonResult.value_comparison.length} Metrics Tracked
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-slate-900/50 text-xs text-gray-500 uppercase">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold">Column</th>
                                                <th className="px-6 py-3 font-semibold text-right">Control Mean</th>
                                                <th className="px-6 py-3 font-semibold text-right">Variant Mean</th>
                                                <th className="px-6 py-3 font-semibold text-center">Delta</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700 text-sm">
                                            {comparisonResult.value_comparison.map((c, i) => (
                                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{c.column}</td>
                                                    <td className="px-6 py-4 text-right text-slate-500 font-mono">{c.mean_v1.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white font-mono">{c.mean_v2.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${c.status === 'increased' ? 'bg-green-100 text-green-700' :
                                                            c.status === 'decreased' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {c.diff_pct > 0 ? '+' : ''}{c.diff_pct.toFixed(2)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {comparisonResult.value_comparison.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">
                                                        No shared numeric columns found for statistical comparison.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div >
    );
}
