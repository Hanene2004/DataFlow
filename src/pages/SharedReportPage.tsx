import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { FileText, Sigma, LineChart, Layout, BarChart3, TrendingUp, ShieldAlert, Lightbulb, Target, ArrowUpRight, ArrowDownRight, GitMerge, ListChecks, Activity, Check } from 'lucide-react';
import { calculateCorrelations } from '../utils/analysis';
import Plot from 'react-plotly.js';
import type { Data as PlotlyData } from 'plotly.js';

export function SharedReportPage() {
    const { id } = useParams<{ id: string }>();
    const [report, setReport] = useState<SharedReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    interface SharedReport {
        id: string;
        title: string;
        config: ReportElement[];
        created_at: string;
        datasets: {
            data: Record<string, unknown>[];
        };
    }

    interface ReportElement {
        id: string;
        type: 'text' | 'stat' | 'chart' | 'table' | 'kpi' | 'recommendation' | 'risk' | 'driver' | 'action_plan' | 'simulation';
        title: string;
        config: Record<string, unknown>;
    }

    useEffect(() => {
        const fetchReport = async () => {
            try {
                // Fetch report config
                const { data, error: fetchError } = await supabase
                    .from('shared_reports')
                    .select('*, datasets(*)')
                    .eq('id', id)
                    .single();

                if (fetchError || !data) {
                    // Fallback: Try to fetch from 'datasets' table if it's a public dataset
                    const { data: datasetData, error: datasetError } = await supabase
                        .from('datasets')
                        .select('*')
                        .eq('id', id)
                        .single();

                    if (datasetError || !datasetData) throw fetchError || datasetError;

                    // access control check
                    if (datasetData.visibility !== 'public' && datasetData.visibility !== 'shared') {
                        throw new Error("This dataset is private.");
                    }

                    // Construct a virtual report
                    const virtualReport: SharedReport = {
                        id: datasetData.id,
                        title: datasetData.filename,
                        created_at: datasetData.created_at || new Date().toISOString(),
                        datasets: { data: datasetData.data },
                        config: [
                            { id: 'summary', type: 'text', title: 'Executive Summary', config: { content: datasetData.summary || "No summary available." } },
                            { id: 'stats', type: 'stat', title: 'Key Statistics', config: { column: datasetData.columns[0] } }, // simplified
                            { id: 'data_table', type: 'table', title: 'Data Preview', config: {} }
                        ]
                    };

                    // If we have recommended charts, add them
                    if (datasetData.recommendations && datasetData.recommendations.length > 0) {
                        // This would require parsing the text description into a chart config, which is hard.
                        // Let's just add a generic chart if possible.
                        const numericCols = datasetData.stats.filter((s: any) => s.type === 'numeric').map((s: any) => s.column);
                        if (numericCols.length >= 2) {
                            virtualReport.config.push({
                                id: 'auto_chart',
                                type: 'chart',
                                title: 'Trend Analysis',
                                config: { xAxis: numericCols[0], yAxis: numericCols[1], chartType: 'scatter' }
                            });
                        }
                    }

                    setReport(virtualReport);
                } else {
                    setReport(data);
                }
            } catch (err: unknown) {
                console.error("Failed to fetch shared report:", err);
                setError(err instanceof Error ? err.message : "Report not found");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchReport();
    }, [id]);

    if (loading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Initializing Portal...</p>
        </div>
    );

    if (error || !report) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
            <div className="p-6 bg-rose-500/10 rounded-3xl mb-6">
                <Layout className="w-12 h-12 text-rose-500" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Access Denied</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold max-w-md">The report you are looking for does not exist or has been revoked by the administrator.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Nav Header */}
            <div className="border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tighter italic leading-none">MultiHub</h2>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Public Intelligence Agency</p>
                        </div>
                    </div>
                    <div className="hidden md:block px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-[10px] font-black uppercase text-slate-500">
                        Shared on {new Date(report.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-20 text-center">
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-4">
                        {report.title || 'Untitled Discovery'}
                    </h1>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-12 h-1 bg-indigo-500 rounded-full"></div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Scientific Report Analysis</p>
                        <div className="w-12 h-1 bg-indigo-500 rounded-full"></div>
                    </div>
                </div>

                <div className="space-y-12">
                    {(() => {
                        const data = report.datasets?.data || [];
                        const columns = data.length > 0 ? Object.keys(data[0]) : [];
                        const correlations = calculateCorrelations(data, columns);
                        const stats = columns.map(c => {
                            const values = data.map(r => r[c]);
                            const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
                            const numeric = nonNull.map(v => Number(v)).filter(v => !isNaN(v));
                            const mean = numeric.length > 0 ? numeric.reduce((a, b) => a + b, 0) / numeric.length : null;
                            const variance = numeric.length > 0 ? numeric.reduce((acc, val) => acc + Math.pow(val - mean!, 2), 0) / numeric.length : 0;
                            return {
                                column: c,
                                count: values.length,
                                missingPercent: ((values.length - nonNull.length) / values.length) * 100,
                                mean,
                                std: Math.sqrt(variance)
                            };
                        });

                        return report.config?.map((el: ReportElement) => (
                            <motion.div
                                key={el.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-slate-50/50 dark:bg-slate-900/30 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800"
                            >
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8 italic flex items-center gap-3">
                                    {el.type === 'text' && <FileText className="w-6 h-6 text-indigo-500" />}
                                    {el.type === 'stat' && <Sigma className="w-6 h-6 text-emerald-500" />}
                                    {el.type === 'chart' && <LineChart className="w-6 h-6 text-purple-500" />}
                                    {el.type === 'table' && <Layout className="w-6 h-6 text-blue-500" />}
                                    {el.type === 'kpi' && <Target className="w-6 h-6 text-indigo-600" />}
                                    {el.type === 'recommendation' && <Lightbulb className="w-6 h-6 text-amber-500" />}
                                    {el.type === 'risk' && <ShieldAlert className="w-6 h-6 text-rose-500" />}
                                    {el.type === 'driver' && <GitMerge className="w-6 h-6 text-cyan-500" />}
                                    {el.type === 'action_plan' && <ListChecks className="w-6 h-6 text-emerald-500" />}
                                    {el.type === 'simulation' && <Activity className="w-6 h-6 text-fuchsia-500" />}
                                    {el.title}
                                </h3>

                                <div className="prose dark:prose-invert max-w-none">
                                    {el.type === 'text' && (
                                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium transition-colors">
                                            {el.config.content as string}
                                        </p>
                                    )}
                                    {el.type === 'kpi' && (
                                        <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
                                            <div className="text-center md:text-left mb-6 md:mb-0">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{(el.config.label as string) || 'Executive Indicator'}</p>
                                                <h2 className="text-6xl font-black text-slate-950 dark:text-white italic tracking-tighter">{(el.config.value as string) || '0'}</h2>
                                            </div>
                                            <div className="h-12 w-[1px] bg-slate-100 dark:bg-slate-800 hidden md:block" />
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{(el.config.sublabel as string) || 'Current Status'}</p>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${el.config.status === 'positive' ? 'text-emerald-500' : el.config.status === 'negative' ? 'text-rose-500' : 'text-slate-400'
                                                        }`}>
                                                        {el.config.status as string}
                                                    </p>
                                                </div>
                                                <div className={`p-4 rounded-2xl ${el.config.status === 'positive' ? 'bg-emerald-500/10 text-emerald-500' : el.config.status === 'negative' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    {el.config.status === 'positive' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {el.type === 'recommendation' && (
                                        <div className="bg-indigo-600 dark:bg-indigo-900/30 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                                            <div className="absolute -right-10 -top-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                                <TrendingUp className="w-40 h-40" />
                                            </div>
                                            <h4 className="text-2xl font-black uppercase tracking-tighter mb-4 italic relative z-10">Strategic Action Item</h4>
                                            <div className="relative z-10 space-y-4">
                                                <p className="text-xl font-bold border-l-4 border-white/30 pl-6 leading-tight">{(el.config.headline as string) || ''}</p>
                                                <p className="text-sm text-indigo-100 dark:text-indigo-200/70 font-medium leading-relaxed max-w-2xl">{(el.config.bullet as string) || ''}</p>
                                            </div>
                                        </div>
                                    )}
                                    {el.type === 'risk' && (
                                        <div className="bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start gap-8">
                                            <div className="flex-shrink-0 flex flex-col items-center">
                                                <div className="w-20 h-20 bg-rose-500 text-white rounded-3xl flex items-center justify-center text-4xl font-black italic shadow-lg shadow-rose-500/30 mb-2">
                                                    {el.config.severity as number || 5}
                                                </div>
                                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Risk Index</p>
                                            </div>
                                            <div className="pt-2">
                                                <h4 className="text-lg font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight mb-2 italic">Intelligence Warning</h4>
                                                <p className="text-slate-600 dark:text-rose-200/70 font-medium leading-relaxed">
                                                    {(el.config.description as string) || ''}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {el.type === 'driver' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(() => {
                                                const relevantCorrs = correlations.filter(c => c.col1 === el.config.target || c.col2 === el.config.target)
                                                    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
                                                    .slice(0, 4);

                                                if (relevantCorrs.length === 0) return <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No significant drivers detected for this target.</p>;

                                                return relevantCorrs.map(c => {
                                                    const other = c.col1 === el.config.target ? c.col2 : c.col1;
                                                    const impactValue = Math.abs(c.correlation) * 100;
                                                    return (
                                                        <div key={other} className="flex flex-col p-5 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{other}</span>
                                                                <span className="text-[10px] font-black text-cyan-500 uppercase">Impact: {impactValue.toFixed(1)}%</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    whileInView={{ width: `${impactValue}%` }}
                                                                    className="h-full bg-cyan-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}
                                    {el.type === 'action_plan' && (
                                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[2.5rem] space-y-4">
                                            {((el.config.items as { label: string, completed: boolean }[]) || []).map((item, i) => (
                                                <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all group">
                                                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                                                        {item.completed && <Check className="w-4 h-4 text-emerald-500" />}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {el.type === 'simulation' && (
                                        <div className="bg-gradient-to-br from-fuchsia-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                                <Activity className="w-32 h-32" />
                                            </div>
                                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                                <div>
                                                    <h4 className="text-3xl font-black uppercase tracking-tighter italic mb-2">Sensitivity Analysis</h4>
                                                    <p className="text-sm text-fuchsia-100/70 font-medium">Predicting the direct impact of variable shifts on core indicators.</p>
                                                </div>
                                                <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
                                                    {(() => {
                                                        const correlation = correlations.find(c =>
                                                            (c.col1 === el.config.factor && c.col2 === el.config.impact) ||
                                                            (c.col1 === el.config.impact && c.col2 === el.config.factor)
                                                        )?.correlation || 0;
                                                        const sensitivity = Math.abs(correlation) > 0.7 ? 'High' : Math.abs(correlation) > 0.4 ? 'Moderate' : 'Low';
                                                        return (
                                                            <>
                                                                <div className="flex justify-between items-end mb-4">
                                                                    <div className="text-center">
                                                                        <p className="text-[8px] font-black uppercase opacity-60">Variable</p>
                                                                        <p className="text-xs font-black">{String(el.config.factor)}</p>
                                                                    </div>
                                                                    <div className="h-6 w-[1px] bg-white/20" />
                                                                    <div className="text-center px-4">
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300">{sensitivity}</p>
                                                                        <p className="text-[8px] font-black uppercase opacity-60">Coupling</p>
                                                                    </div>
                                                                    <div className="h-6 w-[1px] bg-white/20" />
                                                                    <div className="text-center">
                                                                        <p className="text-[8px] font-black uppercase opacity-60">Indicator</p>
                                                                        <p className="text-xs font-black">{String(el.config.impact)}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-center pt-4 border-t border-white/10">
                                                                    <p className="text-[10px] font-black italic">"A +10% shift in {String(el.config.factor)} is projected to yield a {(correlation * 10).toFixed(1)}% {correlation >= 0 ? 'increase' : 'decrease'} in {String(el.config.impact)} targets."</p>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {el.type === 'stat' && (
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                            {(() => {
                                                const col = el.config.column as string;
                                                const s = stats.find(x => x.column === col) || { count: 0, missingPercent: 0 };
                                                return [
                                                    { label: 'Sample Count', value: s.count.toLocaleString() },
                                                    { label: 'Mean Value', value: ('mean' in s ? (s.mean as number)?.toFixed(2) : 'N/A') },
                                                    { label: 'Std Deviation', value: ('std' in s ? (s.std as number)?.toFixed(2) : 'N/A') },
                                                    { label: 'Integrity', value: (100 - s.missingPercent).toFixed(1) + '%' }
                                                ].map((item, i) => (
                                                    <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                                        <p className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic">{item.value}</p>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                    {el.type === 'chart' && (
                                        <div className="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                            {(() => {
                                                const chartType = (el.config.chartType as 'bar' | 'scatter' | 'line') || 'bar';
                                                const plotData: Partial<PlotlyData>[] = [{
                                                    x: data.map(r => r[el.config.xAxis as string] as number),
                                                    y: data.map(r => r[el.config.yAxis as string] as number),
                                                    type: chartType === 'line' ? 'scatter' : chartType,
                                                    mode: chartType === 'line' ? 'lines+markers' : 'markers',
                                                    marker: { color: '#6366f1' }
                                                }];
                                                return (
                                                    <Plot
                                                        data={plotData}
                                                        layout={{
                                                            autosize: true,
                                                            height: 400,
                                                            margin: { l: 60, r: 40, t: 40, b: 60 },
                                                            paper_bgcolor: 'rgba(0,0,0,0)',
                                                            plot_bgcolor: 'rgba(0,0,0,0)',
                                                            xaxis: { gridcolor: '#f1f5f9', title: { text: String(el.config.xAxis), font: { size: 10, family: 'Inter' } } },
                                                            yaxis: { gridcolor: '#f1f5f9', title: { text: String(el.config.yAxis), font: { size: 10, family: 'Inter' } } },
                                                            font: { color: '#64748b', family: 'Inter' }
                                                        }}
                                                        useResizeHandler
                                                        style={{ width: '100%' }}
                                                        config={{ displayModeBar: false }}
                                                    />
                                                );
                                            })()}
                                        </div>
                                    )}
                                    {el.type === 'table' && report.datasets?.data && (
                                        <div className="overflow-x-auto rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <table className="w-full text-left text-xs bg-white dark:bg-slate-900">
                                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                                    <tr>
                                                        {Object.keys(report.datasets.data[0] || {}).slice(0, 5).map(c => (
                                                            <th key={c} className="px-6 py-4 font-black text-slate-400 uppercase italic tracking-tighter">
                                                                {c}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {report.datasets.data.slice(0, 10).map((r: Record<string, unknown>, i: number) => (
                                                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                                                            {Object.keys(r).slice(0, 5).map(c => (
                                                                <td key={c} className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                                                                    {String(r[c])}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ));
                    })()}
                </div>

                <div className="mt-32 pt-12 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-2">Authenticated By</p>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter opacity-50">MultiHub Research Protocol</h4>
                </div>
            </main>
        </div>
    );
}
