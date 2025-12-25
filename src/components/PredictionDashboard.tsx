import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Cpu } from 'lucide-react';


interface PredictionDashboardProps {
    data: Record<string, unknown>[];
    columns: string[];
}

interface PredictionResult {
    status: 'success' | 'error';
    message?: string;
    error?: string;
    metrics: {
        r2: number;
        mse: number;
    };
    coefficients: Record<string, number>;
    actual_vs_predicted: { index: number; actual: number; predicted: number }[];
}

export function PredictionDashboard({ data, columns }: PredictionDashboardProps) {
    const [target, setTarget] = useState<string>('');
    const [features, setFeatures] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const numericColumns = columns; // Simplified: Assuming all passed columns are candidates, ideally filter numeric/categorical

    const toggleFeature = (col: string) => {
        setFeatures(prev =>
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    };

    const runPrediction = async () => {
        if (!target || features.length === 0) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Call Backend API
            const response = await fetch('http://localhost:8000/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data,
                    target,
                    features,
                    type: 'auto' // Let backend decide regression vs classification
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Backend prediction failed");
            }

            const apiResult = await response.json();

            if (apiResult.status === 'error') {
                throw new Error(apiResult.message);
            }

            setResult({
                status: 'success',
                metrics: apiResult.metrics,
                coefficients: apiResult.coefficients,
                actual_vs_predicted: apiResult.actual_vs_predicted
            });

        } catch (err) {
            console.error("Prediction failed", err);
            // Fallback to local if backend completely fails (connection refused), 
            // BUT knowing local is weak for classification, might simply show error.
            // For now, let's keep it robust by showing the error.
            setError(err instanceof Error ? err.message : "An unexpected error occurred during analysis.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
                <Cpu className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-bold text-gray-800">Use AI Prediction</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target (What to predict)</label>
                    <select
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">Select Target...</option>
                        {numericColumns.map(col => (
                            <option key={col} value={col}>{col}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Features (Predictors)</label>
                    <div className="flex flex-wrap gap-2">
                        {numericColumns.filter(c => c !== target).map(col => (
                            <button
                                key={col}
                                onClick={() => toggleFeature(col)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${features.includes(col)
                                    ? 'bg-indigo-100 text-indigo-800 border-indigo-200 border'
                                    : 'bg-gray-100 text-gray-600 border-gray-200 border hover:bg-gray-200'
                                    }`}
                            >
                                {col}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={runPrediction}
                disabled={loading || !target || features.length === 0}
                className="w-full md:w-auto bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Running AI Model...
                    </>
                ) : (
                    <>
                        <Cpu className="w-4 h-4" />
                        Run Analysis
                    </>
                )}
            </button>

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm animate-in fade-in slide-in-from-top-1">
                    <p className="font-semibold mb-1">Error</p>
                    <p>{error}</p>
                </div>
            )}

            {result && result.status === 'success' && (
                <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-700 mb-4">Model Performance</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">R² Score</p>
                                    <p className="text-2xl font-bold text-gray-900">{(result.metrics.r2 * 100).toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Mean Squared Error</p>
                                    <p className="text-2xl font-bold text-gray-900">{result.metrics.mse.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-700 mb-4">Top Influencers</h4>
                            <div className="space-y-2">
                                {Object.entries(result.coefficients)
                                    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                                    .slice(0, 5)
                                    .map(([feature, coef]) => (
                                        <div key={feature} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">{feature}</span>
                                            <span className={`font-medium ${coef > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {coef > 0 ? '+' : ''}{coef.toFixed(4)}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-700 mb-4">Actual vs Predicted (Test Data)</h4>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={result.actual_vs_predicted}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="index" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="actual" stroke="#8884d8" name="Actual" dot={false} strokeWidth={2} />
                                    <Line type="monotone" dataKey="predicted" stroke="#82ca9d" name="Predicted" dot={false} strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
