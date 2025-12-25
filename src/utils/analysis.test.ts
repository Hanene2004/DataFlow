import { describe, it, expect } from 'vitest';
import { calculateColumnStats } from './analysis';

describe('Analysis Engine', () => {
    it('calculates numeric statistics correctly', () => {
        const data = [
            { id: 1, value: 10 },
            { id: 2, value: 20 },
            { id: 3, value: 30 },
            { id: 4, value: 40 },
            { id: 5, value: 50 },
        ];

        const valueStat = calculateColumnStats(data, 'value');

        expect(valueStat).toBeDefined();
        expect(valueStat.type).toBe('numeric');
        expect(valueStat.mean).toBe(30);
        expect(valueStat.min).toBe(10);
        expect(valueStat.max).toBe(50);
        expect(valueStat.missing).toBe(0);
    });

    it('handles missing values', () => {
        const data = [
            { id: 1, value: 10 },
            { id: 2, value: null },
            { id: 3, value: 30 },
        ];

        const valueStat = calculateColumnStats(data, 'value');

        expect(valueStat.missing).toBe(1);
        expect(valueStat.mean).toBe(20); // (10+30)/2
    });

    it('identifies categorical columns', () => {
        const data = [
            { category: 'A' },
            { category: 'B' },
            { category: 'A' },
        ];

        const catStat = calculateColumnStats(data, 'category');

        expect(catStat.type).toBe('text'); // "A", "B" are strings, so 'text' not 'categorical' (detection returns text/numeric/date/mixed)
        expect(catStat.unique).toBe(2);
    });
});
