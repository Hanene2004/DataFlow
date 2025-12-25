import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ColumnStats } from '../utils/analysis';

interface ChartsProps {
  data: Record<string, unknown>[];
  stats: ColumnStats[];
}

export function Charts({ data, stats }: ChartsProps) {
  const numericColumns = stats.filter(s => s.type === 'numeric').map(s => s.column);

  if (numericColumns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No numeric columns found for visualization</p>
      </div>
    );
  }


  const chartData = data.slice(0, 50).map((row, index) => ({
    index: index + 1,
    ...numericColumns.reduce((acc, col) => ({
      ...acc,
      [col]: Number(row[col]) || 0,
    }), {}),
  }));

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Trends - Line Chart
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Showing first 50 rows for numeric columns
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" />
            <YAxis />
            <Tooltip />
            <Legend />
            {numericColumns.slice(0, 3).map((col, idx) => (
              <Line
                key={col}
                type="monotone"
                dataKey={col}
                stroke={['#3b82f6', '#10b981', '#f59e0b'][idx]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Distribution - Bar Chart
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Showing first 50 rows for numeric columns
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" />
            <YAxis />
            <Tooltip />
            <Legend />
            {numericColumns.slice(0, 3).map((col, idx) => (
              <Bar
                key={col}
                dataKey={col}
                fill={['#3b82f6', '#10b981', '#f59e0b'][idx]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Column Statistics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Column
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mean
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Median
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Std Dev
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Min
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Max
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats
                .filter(s => s.type === 'numeric')
                .map((stat) => (
                  <tr key={stat.column} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {stat.column}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {stat.type}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {stat.mean?.toFixed(2) ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {stat.median?.toFixed(2) ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {stat.std?.toFixed(2) ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {stat.min?.toFixed(2) ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {stat.max?.toFixed(2) ?? '-'}
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
