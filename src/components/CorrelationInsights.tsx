import { TrendingUp, TrendingDown, AlertCircle, Lightbulb } from 'lucide-react';

interface CorrelationInsight {
    column1: string;
    column2: string;
    correlation: number;
    type: 'strong_positive' | 'strong_negative' | 'moderate_positive' | 'moderate_negative';
    insight: string;
}

interface CorrelationInsightsProps {
    data: Record<string, unknown>[];
    columns: string[];
}

export function CorrelationInsights({ data, columns }: CorrelationInsightsProps) {
    // Calculate correlations
    const calculateCorrelation = (col1: string, col2: string): number => {
        const values1 = data.map(row => parseFloat(String(row[col1]))).filter(v => !isNaN(v));
        const values2 = data.map(row => parseFloat(String(row[col2]))).filter(v => !isNaN(v));

        if (values1.length === 0 || values2.length === 0) return 0;

        const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
        const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;

        let numerator = 0;
        let sum1 = 0;
        let sum2 = 0;

        for (let i = 0; i < Math.min(values1.length, values2.length); i++) {
            const diff1 = values1[i] - mean1;
            const diff2 = values2[i] - mean2;
            numerator += diff1 * diff2;
            sum1 += diff1 * diff1;
            sum2 += diff2 * diff2;
        }

        const denominator = Math.sqrt(sum1 * sum2);
        return denominator === 0 ? 0 : numerator / denominator;
    };

    // Get numeric columns
    const numericColumns = columns.filter(col => {
        const sample = data[0]?.[col];
        return typeof sample === 'number' || !isNaN(parseFloat(String(sample)));
    });

    // Find interesting correlations
    const insights: CorrelationInsight[] = [];

    for (let i = 0; i < numericColumns.length; i++) {
        for (let j = i + 1; j < numericColumns.length; j++) {
            const corr = calculateCorrelation(numericColumns[i], numericColumns[j]);

            if (Math.abs(corr) > 0.5) {
                let type: CorrelationInsight['type'];
                let insight: string;

                if (corr > 0.7) {
                    type = 'strong_positive';
                    insight = `Strong positive relationship: As ${numericColumns[i]} increases, ${numericColumns[j]} tends to increase significantly.`;
                } else if (corr < -0.7) {
                    type = 'strong_negative';
                    insight = `Strong negative relationship: As ${numericColumns[i]} increases, ${numericColumns[j]} tends to decrease significantly.`;
                } else if (corr > 0.5) {
                    type = 'moderate_positive';
                    insight = `Moderate positive relationship: ${numericColumns[i]} and ${numericColumns[j]} tend to move together.`;
                } else {
                    type = 'moderate_negative';
                    insight = `Moderate negative relationship: ${numericColumns[i]} and ${numericColumns[j]} tend to move in opposite directions.`;
                }

                insights.push({
                    column1: numericColumns[i],
                    column2: numericColumns[j],
                    correlation: corr,
                    type,
                    insight
                });
            }
        }
    }

    // Sort by absolute correlation value
    insights.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    const getInsightIcon = (type: CorrelationInsight['type']) => {
        switch (type) {
            case 'strong_positive':
                return <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />;
            case 'strong_negative':
                return <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />;
            case 'moderate_positive':
                return <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
            case 'moderate_negative':
                return <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
        }
    };

    const getInsightColor = (type: CorrelationInsight['type']) => {
        switch (type) {
            case 'strong_positive':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
            case 'strong_negative':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            case 'moderate_positive':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
            case 'moderate_negative':
                return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Lightbulb className="w-6 h-6 text-yellow-600" />
                        Correlation Insights
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Automated pattern detection and relationship analysis
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Strong Correlations</p>
                            <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">
                                {insights.filter(i => i.type.includes('strong')).length}
                            </p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Insights</p>
                            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                                {insights.length}
                            </p>
                        </div>
                        <Lightbulb className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Variables Analyzed</p>
                            <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                                {numericColumns.length}
                            </p>
                        </div>
                        <AlertCircle className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                    </div>
                </div>
            </div>

            {/* Insights List */}
            {insights.length > 0 ? (
                <div className="space-y-4">
                    {insights.map((insight, index) => (
                        <div
                            key={index}
                            className={`p-5 rounded-xl border ${getInsightColor(insight.type)} transition-all hover:shadow-md`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="shrink-0 mt-1">
                                    {getInsightIcon(insight.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {insight.column1} ↔ {insight.column2}
                                        </h3>
                                        <span className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">
                                            r = {insight.correlation.toFixed(3)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {insight.insight}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-slate-800 p-12 rounded-xl border border-gray-200 dark:border-slate-700 text-center">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        No Strong Correlations Found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-500">
                        The variables in your dataset don't show strong linear relationships.
                    </p>
                </div>
            )}
        </div>
    );
}
