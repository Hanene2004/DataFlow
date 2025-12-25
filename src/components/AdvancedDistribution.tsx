import { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { BarChart2, Info, Sigma } from 'lucide-react';

interface AdvancedDistributionProps {
    data: Record<string, unknown>[];
    columns: string[];
}

export function AdvancedDistribution({ data, columns }: AdvancedDistributionProps) {
    const numericColumns = useMemo(() => columns.filter(col => {
        const sample = data.find(r => r[col])?.[col];
        return typeof sample === 'number' || !isNaN(parseFloat(String(sample)));
    }), [data, columns]);

    const [selectedCols, setSelectedCols] = useState<string[]>(numericColumns.slice(0, 3));

    const plotData = useMemo(() => {
        if (selectedCols.length === 0) return [];

        return selectedCols.map(col => ({
            y: data.map(r => parseFloat(String(r[col]))).filter(v => !isNaN(v)),
            type: 'violin' as const,
            name: col,
            box: {
                visible: true
            },
            meanline: {
                visible: true
            },
            points: 'all' as const,
            jitter: 0.3,
            marker: {
                size: 2,
                opacity: 0.5
            },
            line: {
                width: 1
            }
        }));
    }, [data, selectedCols]);

    return (
        <div className="space-y-6">
            <div className="glass-card p-8 rounded-3xl border border-gray-100 dark:border-slate-800">
                <div className="flex flex-col lg:flex-row justify-between gap-8 mb-10 pb-8 border-b border-gray-100 dark:border-slate-700/50">
                    <div className="max-w-md">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-pink-500/10 rounded-xl">
                                <BarChart2 className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Distribution Pro</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Deep-dive into your data density and probability distribution using combined Violin-Box plots.
                        </p>
                    </div>

                    <div className="flex-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Compare Variables (Max 5)</label>
                        <div className="flex flex-wrap gap-2">
                            {numericColumns.map(col => (
                                <button
                                    key={col}
                                    onClick={() => {
                                        if (selectedCols.includes(col)) {
                                            setSelectedCols(selectedCols.filter(c => c !== col));
                                        } else if (selectedCols.length < 5) {
                                            setSelectedCols([...selectedCols, col]);
                                        }
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedCols.includes(col)
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                        : 'bg-white dark:bg-slate-800 text-gray-400 border border-gray-100 dark:border-slate-700'
                                        }`}
                                >
                                    {col}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="h-[500px] w-full bg-white dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex items-center justify-center">
                    {plotData.length > 0 ? (
                        <Plot
                            data={plotData as Partial<Plotly.PlotData>[]}
                            layout={{
                                autosize: true,
                                margin: { l: 60, r: 20, b: 40, t: 20 },
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                violinmode: 'group',
                                legend: { orientation: 'h', y: -0.2 },
                                yaxis: {
                                    gridcolor: 'rgba(128,128,128,0.1)',
                                    zeroline: false,
                                    tickfont: { size: 10, color: '#888' }
                                },
                                xaxis: {
                                    tickfont: { size: 10, color: '#888' }
                                }
                            } as Partial<Plotly.Layout>}
                            useResizeHandler={true}
                            style={{ width: '100%', height: '100%' }}
                            config={{ displayModeBar: false, responsive: true }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 gap-4">
                            <Sigma className="w-12 h-12 opacity-20" />
                            <p className="font-bold">Awaiting Selection</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex items-start gap-4 p-6 rounded-3xl bg-pink-500/5 border border-pink-500/10">
                        <Info className="w-6 h-6 text-pink-500 mt-1 shrink-0" />
                        <div>
                            <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1">Statistical Anatomy</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic">
                                Combined Violin and Box plots reveal both density and core statistics simultaneously.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
