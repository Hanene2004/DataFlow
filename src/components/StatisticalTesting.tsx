import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sigma, Info, FlaskConical, BarChart2 } from 'lucide-react';

interface StatisticalTestProps {
    data: Record<string, unknown>[];
    columns: string[];
}

interface TestOutput {
    stat: number;
    pValue: number;
    df?: number;
    significant: boolean;
    conclusion: string;
    details: string;
    error?: string;
}

export function StatisticalTesting({ data, columns }: StatisticalTestProps) {
    const numericColumns = useMemo(() => columns.filter(col => {
        const sample = data[0]?.[col];
        return typeof sample === 'number' || !isNaN(parseFloat(String(sample)));
    }), [data, columns]);

    const [testType, setTestType] = useState<'t-test' | 'anova' | 'normality'>('t-test');
    const [col1, setCol1] = useState(numericColumns[0] || '');
    const [col2, setCol2] = useState(numericColumns[1] || numericColumns[0] || '');

    const testResults = useMemo<TestOutput | null>(() => {
        if (!col1 || (testType !== 'normality' && !col2)) return null;

        const v1 = data.map(r => parseFloat(String(r[col1]))).filter(v => !isNaN(v));
        const v2 = col2 ? data.map(r => parseFloat(String(r[col2]))).filter(v => !isNaN(v)) : [];

        if (v1.length < 3 || (testType !== 'normality' && v2.length < 3)) {
            return {
                stat: 0,
                pValue: 1,
                significant: false,
                conclusion: "Selection Error",
                details: "",
                error: "Insufficient data points (min 3 required)"
            };
        }

        const mean1 = v1.reduce((a, b) => a + b, 0) / v1.length;
        const mean2 = v2.length > 0 ? v2.reduce((a, b) => a + b, 0) / v2.length : 0;

        if (testType === 't-test') {
            const var1 = v1.reduce((acc, v) => acc + Math.pow(v - mean1, 2), 0) / (v1.length - 1);
            const var2 = v2.reduce((acc, v) => acc + Math.pow(v - mean2, 2), 0) / (v2.length - 1);

            const t = (mean1 - mean2) / Math.sqrt((var1 / v1.length) + (var2 / v2.length));
            const df = Math.floor(Math.pow((var1 / v1.length) + (var2 / v2.length), 2) /
                ((Math.pow(var1 / v1.length, 2) / (v1.length - 1)) + (Math.pow(var2 / v2.length, 2) / (v2.length - 1))));

            const p = 2 * (1 - normalCDF(Math.abs(t)));

            return {
                stat: t,
                pValue: p,
                df,
                significant: p < 0.05,
                conclusion: p < 0.05 ?
                    `The difference between ${col1} and ${col2} is statistically significant.` :
                    `No significant difference found between ${col1} and ${col2}.`,
                details: `T-Score: ${t.toFixed(4)} | P-Value: ${p.toFixed(4)} | DF: ${df}`
            };
        }

        if (testType === 'normality') {
            const std1 = Math.sqrt(v1.reduce((acc, v) => acc + Math.pow(v - mean1, 2), 0) / v1.length);
            const skew = v1.reduce((acc, v) => acc + Math.pow((v - mean1) / std1, 3), 0) / v1.length;
            const kurt = v1.reduce((acc, v) => acc + Math.pow((v - mean1) / std1, 4), 0) / v1.length;

            const jb = (v1.length / 6) * (Math.pow(skew, 2) + Math.pow(kurt - 3, 2) / 4);
            const p = 1 - chiSquareCDF(jb, 2);

            return {
                stat: jb,
                pValue: p,
                significant: p < 0.05,
                conclusion: p < 0.05 ?
                    `${col1} does not appear to follow a normal distribution.` :
                    `${col1} appears to be normally distributed.`,
                details: `JB Statistic: ${jb.toFixed(4)} | P-Value: ${p.toFixed(4)} | Skewness: ${skew.toFixed(2)}`
            };
        }

        return { stat: 0, pValue: 1, significant: false, conclusion: "Test unimplemented", details: "" };
    }, [data, col1, col2, testType]);

    function normalCDF(x: number) {
        const t = 1 / (1 + 0.2316419 * Math.abs(x));
        const d = 0.3989423 * Math.exp(-x * x / 2);
        const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        return x > 0 ? 1 - p : p;
    }

    function chiSquareCDF(x: number, df: number) {
        if (x <= 0) return 0;
        if (df === 2) return 1 - Math.exp(-x / 2);
        return 0.5;
    }

    return (
        <div className="space-y-6">
            <div className="glass-card p-8 rounded-3xl">
                <div className="flex flex-col lg:flex-row justify-between gap-8 mb-10">
                    <div className="max-w-md">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <FlaskConical className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Statistics Mastery</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Validate your hypotheses with scientific precision using industry-standard statistical tests.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        {(['t-test', 'anova', 'normality'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setTestType(type)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${testType === type ?
                                    'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' :
                                    'bg-white dark:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-100 dark:border-slate-700'
                                    }`}
                            >
                                {type.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Variable A</label>
                                <select
                                    value={col1}
                                    onChange={(e) => setCol1(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                                >
                                    {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            {testType !== 'normality' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Variable B</label>
                                    <select
                                        value={col2}
                                        onChange={(e) => setCol2(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                                    >
                                        {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <div className="flex items-start gap-4">
                                <Info className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Methodology</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                        {testType === 't-test' ?
                                            "Compares the means of two independent groups to determine if there is statistical evidence that the associated population means are significantly different." :
                                            testType === 'normality' ?
                                                "Checks if the sample data comes from a population with a normal distribution. Essential before applying Parametric tests." :
                                                "Compares means of 3 or more groups. (Beta: Currently limited to 2 group comparison)"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <AnimatePresence mode="wait">
                            {testResults ? (
                                <motion.div
                                    key={testType + col1 + col2}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`p-8 rounded-3xl border-2 transition-all duration-500 ${testResults.significant ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-500/5' : 'border-slate-200 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter text-xl">Test Output</h4>
                                        {testResults.significant ?
                                            <FlaskConical className="w-8 h-8 text-purple-500 animate-pulse" /> :
                                            < Sigma className="w-8 h-8 text-slate-400" />
                                        }
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                                                {testResults.error || testResults.conclusion}
                                            </p>
                                        </div>

                                        {!testResults.error && (
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                                                    <span className="text-[10px] font-bold text-gray-400 block uppercase">P-Value</span>
                                                    <span className={`text-sm font-black ${testResults.pValue < 0.05 ? 'text-green-500' : 'text-slate-500'}`}>
                                                        {testResults.pValue.toFixed(4)}
                                                    </span>
                                                </div>
                                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                                                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Score</span>
                                                    <span className="text-sm font-black text-gray-900 dark:text-white">
                                                        {testResults.stat.toFixed(4)}
                                                    </span>
                                                </div>
                                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                                                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Status</span>
                                                    <span className={`text-[10px] font-black uppercase ${testResults.significant ? 'text-purple-500' : 'text-gray-400'}`}>
                                                        {testResults.significant ? 'Significant' : 'Nil'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                                            <p className="text-[10px] font-mono font-bold text-slate-400">
                                                {testResults.details}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-full min-h-[300px] border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-gray-400 p-10 text-center">
                                    <BarChart2 className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="font-bold">Waiting for selection</p>
                                    <p className="text-sm">Please choose variables to initiate test</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
