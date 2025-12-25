import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useState } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface BoxPlotProps {
    data: Record<string, unknown>[];
    columns: string[];
}

interface OutlierInfo {
    column: string;
    outliers: number[];
    count: number;
    percentage: number;
}

export function OutlierDetection({ data, columns }: BoxPlotProps) {
    const [selectedColumn, setSelectedColumn] = useState<string>(columns[0] || '');

    // Calculate outliers using IQR method
    const detectOutliers = (column: string): OutlierInfo => {
        const values = data
            .map(row => parseFloat(String(row[column])))
            .filter(val => !isNaN(val))
            .sort((a, b) => a - b);

        if (values.length === 0) {
            return { column, outliers: [], count: 0, percentage: 0 };
        }

        // Calculate quartiles
        const q1Index = Math.floor(values.length * 0.25);
        const q3Index = Math.floor(values.length * 0.75);
        const q1 = values[q1Index];
        const q3 = values[q3Index];
        const iqr = q3 - q1;

        // Define outlier bounds
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        // Find outliers
        const outliers = values.filter(val => val < lowerBound || val > upperBound);

        return {
            column,
            outliers,
            count: outliers.length,
            percentage: (outliers.length / values.length) * 100
        };
    };

    // Calculate box plot statistics
    const calculateBoxPlotStats = (column: string) => {
        const values = data
            .map(row => parseFloat(String(row[column])))
            .filter(val => !isNaN(val))
            .sort((a, b) => a - b);

        if (values.length === 0) return null;

        const min = values[0];
        const max = values[values.length - 1];
        const q1Index = Math.floor(values.length * 0.25);
        const q2Index = Math.floor(values.length * 0.5);
        const q3Index = Math.floor(values.length * 0.75);

        return {
            min,
            q1: values[q1Index],
            median: values[q2Index],
            q3: values[q3Index],
            max,
            mean: values.reduce((a, b) => a + b, 0) / values.length
        };
    };

    // Get numeric columns
    const numericColumns = columns.filter(col => {
        const sample = data[0]?.[col];
        return typeof sample === 'number' || !isNaN(parseFloat(String(sample)));
    });

    // Calculate outliers for all numeric columns
    const allOutliers = numericColumns.map(col => detectOutliers(col));
    const stats = selectedColumn ? calculateBoxPlotStats(selectedColumn) : null;
    const currentOutliers = detectOutliers(selectedColumn);

    // Prepare data for visualization
    const chartData = stats ? [
        { name: 'Min', value: stats.min, color: '#3b82f6' },
        { name: 'Q1', value: stats.q1, color: '#8b5cf6' },
        { name: 'Median', value: stats.median, color: '#10b981' },
        { name: 'Q3', value: stats.q3, color: '#8b5cf6' },
        { name: 'Max', value: stats.max, color: '#3b82f6' },
        { name: 'Mean', value: stats.mean, color: '#f59e0b' }
    ] : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-orange-600" />
                        Outlier Detection
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Identify unusual values using IQR method
                    </p>
                </div>
            </div>

            {/* Column Selector */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Column
                </label>
                <select
                    value={selectedColumn}
                    onChange={(e) => setSelectedColumn(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    {numericColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                    ))}
                </select>
            </div>

            {/* Outlier Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Outliers Found</p>
                            <p className="text-3xl font-bold text-orange-700 dark:text-orange-300 mt-1">
                                {currentOutliers.count}
                            </p>
                        </div>
                        <AlertTriangle className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Percentage</p>
                            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                                {currentOutliers.percentage.toFixed(1)}%
                            </p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Normal Values</p>
                            <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">
                                {data.length - currentOutliers.count}
                            </p>
                        </div>
                        <TrendingDown className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                </div>
            </div>

            {/* Box Plot Visualization */}
            {stats && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Box Plot Statistics
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="value" name="Value">
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* All Columns Summary */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Outliers by Column
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-slate-700">
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Column</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Outliers</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Percentage</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allOutliers.map((info, index) => (
                                <tr key={index} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">{info.column}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{info.count}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{info.percentage.toFixed(2)}%</td>
                                    <td className="py-3 px-4">
                                        {info.percentage > 5 ? (
                                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                                                High
                                            </span>
                                        ) : info.percentage > 1 ? (
                                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                                                Medium
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                                Low
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
