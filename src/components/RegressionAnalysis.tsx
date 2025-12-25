import { useState, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Scatter } from 'recharts';
import { TrendingUp, Info, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface RegressionAnalysisProps {
    data: Record<string, unknown>[];
    columns: string[];
}

export function RegressionAnalysis({ data, columns }: RegressionAnalysisProps) {
    const numericColumns = useMemo(() => columns.filter(col => {
        const sample = data[0]?.[col];
        return typeof sample === 'number' || !isNaN(parseFloat(String(sample)));
    }), [data, columns]);

    const [xCol, setXCol] = useState(numericColumns[0] || '');
    const [yCol, setYCol] = useState(numericColumns[1] || numericColumns[0] || '');

    const regressionData = useMemo(() => {
        if (!xCol || !yCol) return null;

        const points = data.map(row => ({
            x: parseFloat(String(row[xCol])),
            y: parseFloat(String(row[yCol]))
        })).filter(p => !isNaN(p.x) && !isNaN(p.y));

        if (points.length < 2) return null;

        // Simple Linear Regression calculation
        const n = points.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        points.forEach(p => {
            sumX += p.x;
            sumY += p.y;
            sumXY += p.x * p.y;
            sumX2 += p.x * p.x;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // R-squared calculation
        const yMean = sumY / n;
        let ssRes = 0, ssTot = 0;
        points.forEach(p => {
            const yPred = slope * p.x + intercept;
            ssRes += Math.pow(p.y - yPred, 2);
            ssTot += Math.pow(p.y - yMean, 2);
        });
        const r2 = 1 - (ssRes / ssTot);

        // Generate points for the regression line
        const minX = Math.min(...points.map(p => p.x));
        const maxX = Math.max(...points.map(p => p.x));

        const linePoints = [
            { x: minX, y_pred: slope * minX + intercept },
            { x: maxX, y_pred: slope * maxX + intercept }
        ];

        return {
            points,
            linePoints,
            slope,
            intercept,
            r2,
            equation: `y = ${slope.toFixed(4)}x ${intercept >= 0 ? '+' : '-'} ${Math.abs(intercept).toFixed(4)}`
        };
    }, [data, xCol, yCol]);

    return (
        <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-indigo-500" />
                            Regression Intelligence
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Discover mathematical relationships and predict outcomes
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Input Variable (X)</span>
                            <select
                                value={xCol}
                                onChange={(e) => setXCol(e.target.value)}
                                className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                            >
                                {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Target Variable (Y)</span>
                            <select
                                value={yCol}
                                onChange={(e) => setYCol(e.target.value)}
                                className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                            >
                                {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {regressionData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={regressionData.points}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis
                                        dataKey="x"
                                        type="number"
                                        name={xCol}
                                        stroke="#94A3B8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        type="number"
                                        stroke="#94A3B8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                            color: '#FFF'
                                        }}
                                        itemStyle={{ color: '#FFF' }}
                                    />
                                    <Scatter name="Raw Data" data={regressionData.points} fill="#818CF8" fillOpacity={0.6} />
                                    <Line
                                        data={regressionData.linePoints}
                                        dataKey="y_pred"
                                        stroke="#F43F5E"
                                        strokeWidth={3}
                                        dot={false}
                                        name="Regression Line"
                                        animationDuration={1500}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Model Metrics</h4>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm text-gray-500">R² Score</span>
                                            <span className="text-xl font-black text-indigo-600">{(regressionData.r2 * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${regressionData.r2 * 100}%` }}
                                                className={`h-full ${regressionData.r2 > 0.7 ? 'bg-green-500' : regressionData.r2 > 0.4 ? 'bg-indigo-500' : 'bg-red-500'}`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-xs text-gray-400 block mb-1">Mathematical Model</span>
                                        <code className="text-sm font-mono font-bold text-gray-900 dark:text-white bg-white dark:bg-slate-900 px-3 py-2 rounded-lg block border border-gray-100 dark:border-slate-700">
                                            {regressionData.equation}
                                        </code>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                                        <div className="flex items-start gap-2">
                                            <Sparkles className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-gray-500 leading-relaxed">
                                                {regressionData.r2 > 0.7 ?
                                                    "Excellent predictive power! These variables are strongly linked." :
                                                    regressionData.r2 > 0.3 ?
                                                        "Moderate correlation. The model captures the trend but involves noise." :
                                                        "Weak linear link. Consider non-linear models or other variables."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-400">
                        Select two variables to start the mathematical analysis
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-center gap-3 mb-4">
                        <Info className="w-5 h-5 text-indigo-600" />
                        <h4 className="font-bold text-indigo-900 dark:text-indigo-300">Predictive Power</h4>
                    </div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">
                        Linear regression models the relationship between a dependent variable (Target) and one independent variable (Input). Use it to forecast future values based on historical trends.
                    </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border border-amber-100 dark:border-amber-800">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <h4 className="font-bold text-amber-900 dark:text-amber-300">Model Limitations</h4>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                        The R² score indicates how much variance is explained by the model. A score of 100% means perfect prediction, while 0% means the model is as good as guessing the mean.
                    </p>
                </div>
            </div>
        </div>
    );
}
