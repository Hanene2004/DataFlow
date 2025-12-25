export interface ColumnStats {
  column: string;
  name: string; // Added for compatibility
  type: 'numeric' | 'text' | 'date' | 'mixed';
  count: number;
  missing: number;
  missingPercent: number;
  unique?: number;
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  // Advanced Stats
  q1?: number;
  q3?: number;
  iqr?: number;
  skew?: number;
  kurtosis?: number;
}

export interface CorrelationData {
  col1: string;
  col2: string;
  correlation: number;
}

export function detectColumnType(values: unknown[]): 'numeric' | 'text' | 'date' | 'mixed' {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');

  if (nonNullValues.length === 0) return 'text';

  const numericCount = nonNullValues.filter(v => !isNaN(Number(v))).length;
  const dateCount = nonNullValues.filter(v => !isNaN(Date.parse(String(v)))).length;

  if (numericCount / nonNullValues.length > 0.8) return 'numeric';
  if (dateCount / nonNullValues.length > 0.8) return 'date';

  return 'text';
}

export function calculateColumnStats(data: Record<string, unknown>[], column: string): ColumnStats {
  const values = data.map(row => row[column]);
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  const missing = values.length - nonNullValues.length;
  // Sample for faster type detection
  const sampleValues = nonNullValues.slice(0, 500);
  const type = detectColumnType(sampleValues.length > 0 ? sampleValues : nonNullValues);

  const stats: ColumnStats = {
    column,
    name: column,
    type,
    count: values.length,
    missing,
    missingPercent: (missing / values.length) * 100,
    unique: new Set(nonNullValues).size,
  };

  if (type === 'numeric') {
    const numericValues = nonNullValues.map(v => Number(v)).filter(v => !isNaN(v));

    if (numericValues.length > 0) {
      const sorted = [...numericValues].sort((a, b) => a - b);
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const mean = sum / numericValues.length;

      stats.mean = mean;
      stats.median = sorted[Math.floor(sorted.length / 2)];
      stats.min = sorted[0];
      stats.max = sorted[sorted.length - 1];

      const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericValues.length;
      stats.std = Math.sqrt(variance);
    }
  }

  return stats;
}

/**
 * Optimized single-pass statistics calculation for large datasets.
 */
export function calculateAllColumnStats(data: Record<string, unknown>[], columns: string[]): ColumnStats[] {
  const rowCount = data.length;
  // Use map for faster lookups
  const statsMap: Map<string, any> = new Map();

  columns.forEach(col => {
    statsMap.set(col, {
      column: col,
      count: 0,
      missing: 0,
      uniqueSet: new Set(),
      sum: 0,
      numericValues: [],
      typeSamples: []
    });
  });

  // Single pass over data
  for (let i = 0; i < rowCount; i++) {
    const row = data[i];
    for (let j = 0; j < columns.length; j++) {
      const col = columns[j];
      const val = row[col];
      const s = statsMap.get(col);

      s.count++;
      if (val === null || val === undefined || val === '') {
        s.missing++;
      } else {
        s.uniqueSet.add(val);
        if (s.typeSamples.length < 500) s.typeSamples.push(val);

        // Potential numeric optimization
        const num = Number(val);
        if (!isNaN(num)) {
          s.sum += num;
          s.numericValues.push(num);
        }
      }
    }
  }

  // Finalize stats
  return columns.map(col => {
    const s = statsMap.get(col);
    const type = detectColumnType(s.typeSamples);
    const result: ColumnStats = {
      column: col,
      name: col,
      type,
      count: rowCount,
      missing: s.missing,
      missingPercent: (s.missing / rowCount) * 100,
      unique: s.uniqueSet.size
    };

    if (type === 'numeric' && s.numericValues.length > 0) {
      const nums = s.numericValues;
      const sorted = [...nums].sort((a, b) => a - b);
      const mean = s.sum / nums.length;

      result.mean = mean;
      result.median = sorted[Math.floor(sorted.length / 2)];
      result.min = sorted[0];
      result.max = sorted[sorted.length - 1];

      const variance = nums.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) / nums.length;
      result.std = Math.sqrt(variance);
    }

    return result;
  });
}

export function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  if (denomX === 0 || denomY === 0) return 0;

  return numerator / Math.sqrt(denomX * denomY);
}

export function calculateCorrelations(data: Record<string, unknown>[], columns: string[]): CorrelationData[] {
  const numericColumns = columns.filter(col => {
    const type = detectColumnType(data.map(row => row[col]));
    return type === 'numeric';
  });

  const correlations: CorrelationData[] = [];

  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];

      const values1 = data.map(row => Number(row[col1])).filter(v => !isNaN(v));
      const values2 = data.map(row => Number(row[col2])).filter(v => !isNaN(v));

      const correlation = calculateCorrelation(values1, values2);

      correlations.push({
        col1,
        col2,
        correlation,
      });
    }
  }

  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

export function getMissingValuesSummary(data: Record<string, unknown>[], columns: string[]) {
  return columns.map(col => {
    const values = data.map(row => row[col]);
    const missing = values.filter(v => v === null || v === undefined || v === '').length;
    return {
      column: col,
      missing,
      percent: (missing / values.length) * 100,
    };
  }).filter(item => item.missing > 0);
}
export interface RegressionResult {
  r2: number;
  mse: number;
  coefficients: Record<string, number>;
  actualVsPredicted: { index: number; actual: number; predicted: number }[];
}

export function runMultivariateRegression(
  data: Record<string, unknown>[],
  target: string,
  features: string[]
): RegressionResult {
  const points = data.map(row => ({
    y: parseFloat(String(row[target])),
    x: features.map(f => parseFloat(String(row[f])))
  })).filter(p => !isNaN(p.y) && p.x.every(val => !isNaN(val)));

  if (points.length < 5) {
    throw new Error("Insufficient data for stable prediction model.");
  }

  // Normalize features for better convergence
  const means = features.map((_, i) => points.reduce((acc, p) => acc + p.x[i], 0) / points.length);
  const stds = features.map((_, i) => {
    const mean = means[i];
    const variance = points.reduce((acc, p) => acc + Math.pow(p.x[i] - mean, 2), 0) / points.length;
    return Math.sqrt(variance) || 1;
  });

  const normalizedPoints = points.map(p => ({
    y: p.y,
    x: p.x.map((val, i) => (val - means[i]) / stds[i])
  }));

  // Gradient Descent
  let weights = new Array(features.length).fill(0);
  let bias = 0;
  const lr = 0.1;
  const iterations = 100;

  for (let i = 0; i < iterations; i++) {
    const dW = new Array(features.length).fill(0);
    let dB = 0;

    normalizedPoints.forEach(p => {
      const pred = p.x.reduce((acc, val, idx) => acc + val * weights[idx], 0) + bias;
      const error = pred - p.y;
      p.x.forEach((val, idx) => dW[idx] += error * val);
      dB += error;
    });

    weights = weights.map((w, idx) => w - (lr * dW[idx]) / points.length);
    bias = bias - (lr * dB) / points.length;
  }

  // Denormalize weights
  const finalCoefficients: Record<string, number> = {};
  features.forEach((f, i) => {
    finalCoefficients[f] = weights[i] / stds[i];
  });
  finalCoefficients['(Intercept)'] = bias - weights.reduce((acc, w, i) => acc + (w * means[i]) / stds[i], 0);

  // Evaluation
  const results = points.map((p, i) => {
    const predicted = p.x.reduce((acc, val, idx) => acc + val * finalCoefficients[features[idx]], 0) + finalCoefficients['(Intercept)'];
    return { index: i, actual: p.y, predicted };
  });

  const yMean = points.reduce((acc, p) => acc + p.y, 0) / points.length;
  const ssRes = results.reduce((acc, r) => acc + Math.pow(r.actual - r.predicted, 2), 0);
  const ssTot = points.reduce((acc, p) => acc + Math.pow(p.y - yMean, 2), 0);
  const r2 = 1 - (ssRes / (ssTot || 1));
  const mse = ssRes / points.length;

  return {
    r2: Math.max(0, r2),
    mse,
    coefficients: finalCoefficients,
    actualVsPredicted: results.slice(0, 50) // Return first 50 for visualization efficiency
  };
}
