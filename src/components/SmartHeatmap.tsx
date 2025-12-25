import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Loader2, Info } from 'lucide-react';
import { calculateCorrelations, CorrelationData } from '../utils/analysis';
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    Tooltip,
    Cell
} from 'recharts';

interface HeatmapCorrelation {
    col1: string;
    col2: string;
    correlation: number;
}

export function SmartHeatmap() {
    const { activeDataset } = useData();
    const [correlations, setCorrelations] = useState<HeatmapCorrelation[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!activeDataset) return;

        setLoading(true);
        // Use frontend utility instead of broken backend
        const cols = activeDataset.columns;
        const data = activeDataset.data;
        const results = calculateCorrelations(data, cols);

        // Transform to HeatmapCorrelation format
        const formatted = results.map((r: CorrelationData) => ({
            col1: r.col1,
            col2: r.col2,
            correlation: r.correlation
        }));

        setCorrelations(formatted);
        setLoading(false);
    }, [activeDataset]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (correlations.length === 0) {
        return (
            <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-xl text-gray-500 border border-gray-100 dark:border-slate-700">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>No significant correlations found (&gt; 0.1) in this dataset.</p>
            </div>
        );
    }

    // Prepare data for Recharts Scatter plot (as a heatmap)
    // We'll map cols to X and Y axes
    const allCols = Array.from(new Set(correlations.flatMap(c => [c.col1, c.col2])));
    const data = correlations.map(c => ({
        x: allCols.indexOf(c.col1),
        y: allCols.indexOf(c.col2),
        col1: c.col1,
        col2: c.col2,
        value: c.correlation,
        absVal: Math.abs(c.correlation)
    }));

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        Smart Correlation Heatmap
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </h3>
                    <p className="text-sm text-gray-500">Strength of relationship between variables</p>
                </div>
            </div>

            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Column 1"
                            ticks={allCols.map((_, i) => i)}
                            tickFormatter={(i) => allCols[i]}
                            interval={0}
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="Column 2"
                            ticks={allCols.map((_, i) => i)}
                            tickFormatter={(i) => allCols[i]}
                            interval={0}
                            style={{ fontSize: '12px' }}
                        />
                        <ZAxis type="number" dataKey="absVal" range={[100, 1000]} />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-2 rounded shadow-lg">
                                            <p className="font-bold text-gray-900 dark:text-white">{data.col1} ↔ {data.col2}</p>
                                            <p className="text-indigo-600 font-medium">Correlation: {data.value.toFixed(3)}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Scatter data={data} shape="circle">
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.value > 0 ? `rgba(99, 102, 241, ${entry.absVal})` : `rgba(239, 68, 68, ${entry.absVal})`}
                                />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    Positive Correlation
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    Negative Correlation
                </div>
            </div>
        </div>
    );
}
