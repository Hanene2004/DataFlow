import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

interface UploadedDataset {
  data: Record<string, unknown>[];
  filename: string;
  columns: string[];
  file: File;
  sheetName?: string;
}

interface FileUploadProps {
  onUpload: (datasets: UploadedDataset[]) => void;
  isUploading?: boolean;
}

export function FileUpload({ onUpload, isUploading: externalIsUploading = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [internalProcessing, setInternalProcessing] = useState(false);

  const isProcessing = internalProcessing || externalIsUploading;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sheet selection state
  const [pendingFile, setPendingFile] = useState<{ file: File, sheets: string[] } | null>(null);

  const processFile = async (file: File, selectedSheet?: string): Promise<UploadedDataset | null> => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      console.warn(`Skipped ${file.name}: Invalid file type`);
      return null;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      if (workbook.SheetNames.length > 1 && !selectedSheet) {
        setPendingFile({ file, sheets: workbook.SheetNames });
        return null;
      }

      const activeSheetName = selectedSheet || workbook.SheetNames[0];
      const firstSheet = workbook.Sheets[activeSheetName];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      if (jsonData.length === 0) {
        console.warn(`Skipped ${file.name} (${activeSheetName}): Empty sheet`);
        return null;
      }

      const columns = Object.keys(jsonData[0] as Record<string, unknown>);

      // Fallback for semicolon-delimited CSVs or other non-standard formats
      if (file.name.endsWith('.csv') && (columns.length === 1 || columns[0].includes(';'))) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length > 0) {
          // Detect separator by counting occurrences in first line
          const possibleSeps = [';', '\t', '|', ','];
          const counts = possibleSeps.map(s => ({
            sep: s,
            count: (lines[0].split(s).length - 1)
          }));
          const bestSep = counts.reduce((a, b) => a.count > b.count ? a : b).sep;

          if (lines[0].includes(bestSep) && counts.find(c => c.sep === bestSep)!.count > 0) {
            const header = lines[0].split(bestSep).map(h => h.replace(/^"(.*)"$/, '$1').trim());
            const data = lines.slice(1).map(line => {
              const values = line.split(bestSep);
              const row: Record<string, unknown> = {};
              header.forEach((h, i) => {
                let val: any = values[i] ? values[i].replace(/^"(.*)"$/, '$1').trim() : '';
                if (!isNaN(Number(val)) && val !== '') val = Number(val);
                row[h] = val;
              });
              return row;
            });

            return {
              data,
              filename: file.name,
              columns: header,
              file,
              sheetName: activeSheetName
            };
          }
        }
      }

      return {
        data: jsonData as Record<string, unknown>[],
        filename: file.name,
        columns,
        file,
        sheetName: activeSheetName
      };
    } catch (error) {
      console.error(`Error parsing ${file.name}:`, error);
      return null;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    setInternalProcessing(true);
    const fileArray = Array.from(files);
    const results: UploadedDataset[] = [];

    try {
      for (const file of fileArray) {
        // Optimization: For large files (> 2MB), skip browser parsing and send raw file
        const isLarge = file.size > 2 * 1024 * 1024;

        if (isLarge) {
          results.push({
            data: [], // Empty data, backend will populate
            filename: file.name,
            columns: [],
            file
          });
          continue;
        }

        const result = await processFile(file);
        if (result) {
          results.push(result);
        } else {
          // If parsing fails but it's a valid extension, still try to upload raw
          results.push({
            data: [],
            filename: file.name,
            columns: [],
            file
          });
        }
      }

      if (results.length > 0) {
        onUpload(results);
      } else if (fileArray.length > 0) {
        alert('No valid files were selected.');
      }
    } catch (error) {
      console.error('Error handling files:', error);
      alert('Error handling files.');
    } finally {
      setInternalProcessing(false);
    }
  };

  const handleSheetSelect = async (sheetName: string) => {
    if (!pendingFile) return;
    const { file } = pendingFile;
    setPendingFile(null);
    setInternalProcessing(true);
    try {
      const result = await processFile(file, sheetName);
      if (result) {
        onUpload([result]);
      } else {
        // Safe fallback: send raw file with sheet requirement to backend
        onUpload([{
          data: [],
          filename: file.name,
          columns: [],
          file,
          sheetName
        }]);
      }
    } catch (error) {
      console.error('Error selecting sheet:', error);
    } finally {
      setInternalProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const [urlInput, setUrlInput] = useState('');

  const handleUrlConnect = async () => {
    if (!urlInput.trim()) return;
    setInternalProcessing(true);
    try {
      const response = await fetch('http://localhost:8000/import-url?url=' + encodeURIComponent(urlInput), {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();

      onUpload([{
        data: result.data,
        filename: result.filename,
        columns: result.columns,
        file: new File([], result.filename) // Dummy file object for compatibility
      }]);
      setUrlInput('');
    } catch (error: any) {
      alert('Error connecting to URL: ' + error.message);
    } finally {
      setInternalProcessing(false);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${isDragging
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-300 hover:border-gray-400'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />

      <h3 className="text-xl font-semibold mb-2 text-gray-700">
        {isProcessing ? 'Processing...' : 'Upload Excel File'}
      </h3>

      <p className="text-gray-500 mb-4">
        Drag and drop your Excel or CSV files here, or click to browse
      </p>

      <p className="text-sm text-gray-400">
        Supported formats: .xlsx, .xls, .csv
      </p>

      <div className="mt-6 pt-6 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Or Connect Live Data</p>
        <div className="flex gap-2 max-w-sm mx-auto">
          <input
            type="text"
            placeholder="https://example.com/data.csv"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none hover:bg-white transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUrlConnect();
            }}
          />
          <button
            onClick={handleUrlConnect}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            Connect
          </button>
        </div>
      </div>

      {/* Sheet Selection Overlay */}
      <AnimatePresence>
        {pendingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">Multiple Sheets Detected</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">Please select the sheet you want to analyze from {pendingFile.file.name}</p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {pendingFile.sheets.map(sheet => (
                  <button
                    key={sheet}
                    onClick={() => handleSheetSelect(sheet)}
                    className="w-full text-left p-4 rounded-2xl bg-gray-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all font-bold group flex items-center justify-between"
                  >
                    <span>{sheet}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPendingFile(null)}
                className="mt-6 w-full py-4 text-gray-400 font-bold hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
