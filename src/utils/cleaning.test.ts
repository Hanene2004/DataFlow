import { describe, it, expect } from 'vitest';
import { cleanData } from './cleaning';
import { calculateColumnStats } from './analysis';

describe('Data Cleaning Engine', () => {
    const testData = [
        { id: 1, value: 10, category: 'A' },
        { id: 2, value: null, category: 'B' },
        { id: 3, value: 30, category: '' },
        { id: 4, value: 40, category: 'C' },
    ];

    const valStats = calculateColumnStats(testData, 'value');
    const catStats = calculateColumnStats(testData, 'category');
    const allStats = [valStats, catStats];

    it('removes rows with missing values', () => {
        const cleaned = cleanData(testData, 'value', 'drop_rows', allStats);
        expect(cleaned.length).toBe(3);
        expect(cleaned.find(r => r.id === 2)).toBeUndefined();
    });

    it('fills missing values with zero', () => {
        const cleaned = cleanData(testData, 'value', 'fill_zero', allStats);
        const row2 = cleaned.find(r => r.id === 2);
        expect(row2?.value).toBe(0);
    });

    it('fills missing values with mean', () => {
        // Mean of 10, 30, 40 is 26.666...
        const cleaned = cleanData(testData, 'value', 'fill_mean', allStats);
        const row2 = cleaned.find(r => r.id === 2);
        // The mean in stats might be pre-calculated. 
        // calculateColumnStats(testData, 'value') returns mean ~26.67
        expect(row2?.value).toBeCloseTo(26.67, 1);
    });

    it('redacts sensitive data', () => {
        const cleaned = cleanData(testData, 'category', 'redact', allStats);
        const row1 = cleaned.find(r => r.id === 1);
        expect(row1?.category).toBe('[REDACTED]');
    });
});
