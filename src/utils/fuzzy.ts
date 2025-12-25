export function levenshteinDistance(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[len1][len2];
}

export function getSimilarityScore(s1: string, s2: string): number {
    const dist = levenshteinDistance(s1.toLowerCase(), s2.toLowerCase());
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1;
    return 1 - dist / maxLen;
}

export interface DuplicateGroup {
    mainIndex: number;
    duplicates: { index: number; score: number }[];
    column: string;
}

export function findPotentialDuplicates(
    data: Record<string, unknown>[],
    column: string,
    threshold = 0.85
): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const usedIndices = new Set<number>();

    // Optimization: Pre-sort or block by first 2 chars
    // For simplicity but better than O(N^2) on all rows:
    // Only compare if strings have similar length (+/- 3 chars)

    for (let i = 0; i < data.length; i++) {
        if (usedIndices.has(i)) continue;

        const s1 = String(data[i][column] || '').trim();
        if (s1.length < 3) continue;

        const currentDuplicates: { index: number; score: number }[] = [];

        for (let j = i + 1; j < data.length; j++) {
            if (usedIndices.has(j)) continue;

            const s2 = String(data[j][column] || '').trim();
            if (Math.abs(s1.length - s2.length) > 3) continue;

            const score = getSimilarityScore(s1, s2);
            if (score >= threshold) {
                currentDuplicates.push({ index: j, score });
            }
        }

        if (currentDuplicates.length > 0) {
            groups.push({
                mainIndex: i,
                duplicates: currentDuplicates,
                column: column
            });
            usedIndices.add(i);
            currentDuplicates.forEach(d => usedIndices.add(d.index));
        }

        // Safety break for extremely large local datasets
        if (groups.length > 50) break;
    }

    return groups;
}
