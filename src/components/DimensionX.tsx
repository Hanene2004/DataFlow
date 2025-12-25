import { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { BoxSelect, Layers, Maximize2, Zap } from 'lucide-react';

interface ThreeDAnalysisProps {
    data: Record<string, unknown>[];
    columns: string[];
}

export function DimensionX({ data, columns }: ThreeDAnalysisProps) {
    const numericColumns = useMemo(() => columns.filter(col => {
        const sample = data[0]?.[col];
        return typeof sample === 'number' || !isNaN(parseFloat(String(sample)));
    }), [data, columns]);

    const [xCol, setXCol] = useState(numericColumns[0] || '');
    const [yCol, setYCol] = useState(numericColumns[1] || numericColumns[0] || '');
    const [zCol, setZCol] = useState(numericColumns[2] || numericColumns[1] || numericColumns[0] || '');
    const [colorCol, setColorCol] = useState(columns[0] || '');

    const plotData = useMemo(() => {
        if (!xCol || !yCol || !zCol) return [];

        return [{
            x: data.map(r => r[xCol]),
            y: data.map(r => r[yCol]),
            z: data.map(r => r[zCol]),
            mode: 'markers',
            type: 'scatter3d' as const,
            marker: {
                size: 5,
                color: data.map(r => r[colorCol]),
                colorscale: 'Viridis',
                opacity: 0.8,
                line: {
                    color: 'rgba(217, 217, 217, 0.14)',
                    width: 0.5
                }
            },
            text: data.map((_, i) => `Point ${i + 1}`)
        }];
    }, [data, xCol, yCol, zCol, colorCol]);

    return (
        <div className="space-y-6">
            <div className="glass-card p-8 rounded-3xl overflow-hidden">
                <div className="flex flex-col lg:flex-row justify-between gap-8 mb-8 border-b border-gray-100 dark:border-slate-700/50 pb-8">
                    <div className="max-w-md">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500/10 rounded-xl">
                                <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Dimension X</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Explore the hidden structures of your data in high-fidelity 3D space.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                        {[
                            { label: 'Axis X', value: xCol, setter: setXCol },
                            { label: 'Axis Y', value: yCol, setter: setYCol },
                            { label: 'Axis Z', value: zCol, setter: setZCol },
                            { label: 'Spectrum', value: colorCol, setter: setColorCol }
                        ].map((axis, i) => (
                            <div key={i} className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{axis.label}</label>
                                <select
                                    value={axis.value}
                                    onChange={(e) => axis.setter(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                >
                                    {axis.label === 'Spectrum' ?
                                        columns.map(c => <option key={c} value={c}>{c}</option>) :
                                        numericColumns.map(c => <option key={c} value={c}>{c}</option>)
                                    }
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative aspect-video w-full bg-white dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                    {plotData.length > 0 ? (
                        <Plot
                            data={plotData as Partial<Plotly.PlotData>[]}
                            layout={{
                                autosize: true,
                                margin: { l: 0, r: 0, b: 0, t: 0 },
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                scene: {
                                    xaxis: { title: { text: xCol, font: { color: '#888' } }, gridcolor: 'rgba(128,128,128,0.1)' },
                                    yaxis: { title: { text: yCol, font: { color: '#888' } }, gridcolor: 'rgba(128,128,128,0.1)' },
                                    zaxis: { title: { text: zCol, font: { color: '#888' } }, gridcolor: 'rgba(128,128,128,0.1)' },
                                    camera: { eye: { x: 1.5, y: 1.5, z: 1.5 } }
                                }
                            } as Partial<Plotly.Layout>}
                            useResizeHandler={true}
                            style={{ width: '100%', height: '100%' }}
                            config={{ displayModeBar: true, responsive: true }}
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-gray-400">
                            <BoxSelect className="w-12 h-12 opacity-20" />
                            <p className="font-bold">Awaiting Data Mapping</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <Zap className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tighter">Spatial Insights</span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed italic">
                            3D analysis reveals clusters and anomalies that remain invisible in traditional 2D space. Rotate to discover depth.
                        </p>
                    </div>
                    <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                            <Maximize2 className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Controls</span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-1">
                                <p className="text-[10px] font-black text-gray-500">ROTATION</p>
                                <p className="text-[10px] text-gray-400 uppercase">Left Click + Drag</p>
                            </div>
                            <div className="flex-1 space-y-1 border-l border-slate-200 dark:border-slate-800 pl-4">
                                <p className="text-[10px] font-black text-gray-500">ZOOM</p>
                                <p className="text-[10px] text-gray-400 uppercase">Scroll Wheel</p>
                            </div>
                            <div className="flex-1 space-y-1 border-l border-slate-200 dark:border-slate-800 pl-4">
                                <p className="text-[10px] font-black text-gray-500">PAN</p>
                                <p className="text-[10px] text-gray-400 uppercase">Right Click + Drag</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
