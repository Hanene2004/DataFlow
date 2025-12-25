import * as XLSX from 'xlsx';
import { ColumnStats, CorrelationData } from './analysis';

export function exportProfessionalExcel(
    data: Record<string, unknown>[],
    stats: ColumnStats[],
    correlations: CorrelationData[],
    filename: string = 'MultiHub_Export.xlsx'
) {
    const wb = XLSX.utils.book_new();

    // 1. Core Data Sheet
    const wsData = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, wsData, 'Cleaned Data');

    // 2. Data Quality Sheet
    const qualityReport = stats.map(s => ({
        Column: s.column,
        Type: s.type,
        Count: s.count,
        Missing: s.missing,
        'Missing %': s.missingPercent?.toFixed(2) + '%',
        'Unique Values': s.unique
    }));
    const wsQuality = XLSX.utils.json_to_sheet(qualityReport);
    XLSX.utils.book_append_sheet(wb, wsQuality, 'Quality Report');

    // 3. Analytics Sheet
    const analyticsReport = stats
        .filter(s => s.type === 'numeric')
        .map(s => ({
            Column: s.column,
            Mean: s.mean?.toFixed(2),
            Median: s.median?.toFixed(2),
            StdDev: s.std?.toFixed(2),
            Min: s.min,
            Max: s.max
        }));
    const wsAnalytics = XLSX.utils.json_to_sheet(analyticsReport);
    XLSX.utils.book_append_sheet(wb, wsAnalytics, 'Descriptive Stats');

    // 4. Correlations Sheet
    if (correlations.length > 0) {
        const correlationReport = correlations
            .slice(0, 50) // Top 50 correlations
            .map(c => ({
                'Factor 1': c.col1,
                'Factor 2': c.col2,
                Correlation: c.correlation.toFixed(4),
                Relationship: Math.abs(c.correlation) > 0.7 ? 'Strong' : Math.abs(c.correlation) > 0.4 ? 'Moderate' : 'Weak'
            }));
        const wsCorr = XLSX.utils.json_to_sheet(correlationReport);
        XLSX.utils.book_append_sheet(wb, wsCorr, 'Correlations');
    }

    // Write file
    XLSX.writeFile(wb, filename);
}

export function exportToCSV(data: Record<string, unknown>[], filename: string = 'export.csv') {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
