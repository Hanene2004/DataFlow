import { maskEmail, maskPhone, redact } from './pii';
import { ColumnStats } from './analysis';

export type CleaningMethod = 'drop_rows' | 'fill_mean' | 'fill_median' | 'fill_zero' | 'fill_value' | 'mask_email' | 'mask_phone' | 'redact';

export function cleanData(
  data: Record<string, unknown>[],
  column: string,
  method: CleaningMethod,
  columnsInfo: ColumnStats[],
  customValue?: string | number
): Record<string, unknown>[] {
  const newData = [...data];
  const colStats = columnsInfo.find(s => s.column === column);

  if (!colStats) return data;

  switch (method) {
    case 'drop_rows':
      return newData.filter(row => {
        const val = row[column];
        return val !== null && val !== undefined && val !== '';
      });

    case 'fill_mean':
      if (colStats.type === 'numeric' && colStats.mean !== undefined) {
        return newData.map(row => ({
          ...row,
          [column]: isEmpty(row[column]) ? colStats.mean : row[column],
        }));
      }
      return data;

    case 'fill_median':
      if (colStats.type === 'numeric' && colStats.median !== undefined) {
        return newData.map(row => ({
          ...row,
          [column]: isEmpty(row[column]) ? colStats.median : row[column],
        }));
      }
      return data;

    case 'fill_zero':
      return newData.map(row => ({
        ...row,
        [column]: isEmpty(row[column]) ? 0 : row[column],
      }));

    case 'fill_value':
      if (customValue !== undefined) {
        return newData.map(row => ({
          ...row,
          [column]: isEmpty(row[column]) ? customValue : row[column],
        }));
      }
      return data;

    case 'mask_email':
      return newData.map(row => ({
        ...row,
        [column]: typeof row[column] === 'string' ? maskEmail(row[column] as string) : row[column],
      }));

    case 'mask_phone':
      return newData.map(row => ({
        ...row,
        [column]: typeof row[column] === 'string' ? maskPhone(row[column] as string) : row[column],
      }));

    case 'redact':
      return newData.map(row => ({
        ...row,
        [column]: redact(row[column]),
      }));

    default:
      return data;
  }
}

function isEmpty(val: unknown): boolean {
  return val === null || val === undefined || val === '';
}
