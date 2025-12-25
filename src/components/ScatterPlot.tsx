import { useState } from 'react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Label,
} from 'recharts';
import { ColumnStats } from '../utils/analysis';
import { ScatterChart as ScatterIcon } from 'lucide-react';

interface ScatterPlotProps {
    data: Record<string, unknown>[];
    stats: ColumnStats[];
}

export function ScatterPlot({ data, stats }: ScatterPlotProps) {
    const numericColumns = stats.filter(s => s.type === 'numeric').map(s => s.column);

    const [xColumn, setXColumn] = useState(numericColumns[0] || '');
    const [yColumn, setYColumn] = useState(numericColumns[1] || numericColumns[0] || '');

    if (numericColumns.length < 2) {
        return null;
    }

    const chartData = data.slice(0, 500).map((row, index) => ({
        x: Number(row[xColumn]) || 0,
        y: Number(row[yColumn]) || 0,
        index,
    }));

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-6">
                <ScatterIcon className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                    Scatter Plot Analysis
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        X Axis Variable
                    </label>
                    <select
                        value={xColumn}
                        onChange={(e) => setXColumn(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                    >
                        {numericColumns.map(col => (
                            <option key={col} value={col}>{col}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Y Axis Variable
                    </label>
                    <select
                        value={yColumn}
                        onChange={(e) => setYColumn(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                    >
                        {numericColumns.map(col => (
                            <option key={col} value={col}>{col}</option>
                        ))}
                    </select>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="x" name={xColumn}>
                        <Label value={xColumn} offset={-10} position="insideBottom" />
                    </XAxis>
                    <YAxis type="number" dataKey="y" name={yColumn}>
                        <Label value={yColumn} angle={-90} position="insideLeft" />
                    </YAxis>
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Data" data={chartData} fill="#8884d8" />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
