import { useState, useEffect } from 'react';
import { CorrelationData } from '../utils/analysis';

interface CorrelationMatrixProps {
  data: Record<string, unknown>[];
  initialCorrelations: CorrelationData[];
}

export function CorrelationMatrix({ data, initialCorrelations }: CorrelationMatrixProps) {
  const [correlations, setCorrelations] = useState<CorrelationData[]>(initialCorrelations);
  const [method, setMethod] = useState<'pearson' | 'spearman' | 'kendall'>('pearson');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If method is default (Pearson) and we have initial correlations, use them
    if (method === 'pearson' && initialCorrelations.length > 0 && !loading) {
      setCorrelations(initialCorrelations);
      return;
    }

    const fetchCorrelations = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8000/analyze/correlation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data, method }),
        });
        if (response.ok) {
          const result = await response.json();
          setCorrelations(result);
        }
      } catch (error) {
        console.error("Failed to fetch correlations", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCorrelations();
  }, [method, data, initialCorrelations, loading]);

  if (!correlations || correlations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">
          Not enough numeric columns to calculate correlations
        </p>
      </div>
    );
  }

  const getCorrelationColor = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs > 0.8) return 'bg-red-100 text-red-800';
    if (abs > 0.5) return 'bg-orange-100 text-orange-800';
    if (abs > 0.3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getCorrelationLabel = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs > 0.8) return 'Strong';
    if (abs > 0.5) return 'Moderate';
    if (abs > 0.3) return 'Weak';
    return 'Very Weak';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Correlation Analysis
        </h3>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as 'pearson' | 'spearman' | 'kendall')}
          className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        >
          <option value="pearson">Pearson</option>
          <option value="spearman">Spearman</option>
          <option value="kendall">Kendall</option>
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Showing correlations between numeric columns (sorted by strength)
      </p>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Recalculating...</div>
      ) : (
        <div className="space-y-3">
          {correlations.slice(0, 10).map((corr, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {corr.col1} ↔ {corr.col2}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getCorrelationColor(
                      corr.correlation
                    )}`}
                  >
                    {getCorrelationLabel(corr.correlation)}
                  </span>
                  <span className="text-sm font-bold text-gray-700 min-w-[60px] text-right">
                    {corr.correlation.toFixed(3)}
                  </span>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${corr.correlation > 0 ? 'bg-blue-500' : 'bg-red-500'
                    }`}
                  style={{
                    width: `${Math.abs(corr.correlation) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {correlations.length > 10 && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          Showing top 10 of {correlations.length} correlations
        </p>
      )}
    </div>
  );
}
