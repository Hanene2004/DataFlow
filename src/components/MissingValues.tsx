import { AlertTriangle } from 'lucide-react';
interface MissingValue {
  column: string;
  missing: number;
  percent: number;
}
interface MissingValuesProps {
  missingValues: MissingValue[];
  totalRows: number;
}
export function MissingValues({ missingValues, totalRows }: MissingValuesProps) {
  if (missingValues.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <AlertTriangle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <p className="text-lg font-semibold text-gray-800 mb-2">
          No Missing Values Detected
        </p>
        <p className="text-gray-500">
          Your dataset is complete with no missing values
        </p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-800">
          Missing Values Analysis
        </h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Columns with missing data (out of {totalRows} total rows)
      </p>
      <div className="space-y-4">
        {missingValues.map((item) => (
          <div key={item.column} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-800">{item.column}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {item.missing} missing
                </span>
                <span className="text-sm font-bold text-orange-600">
                  {item.percent.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
