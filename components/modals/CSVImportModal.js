import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, ChevronDown, AlertCircle, Check } from 'lucide-react';
import { selectDropdownStyle } from '../../utils/styleUtils';

const PART_FIELDS = [
  { key: 'skip', label: 'Skip this column', required: false },
  { key: 'part', label: 'Part Name', required: true },
  { key: 'partNumber', label: 'Part Number', required: false },
  { key: 'vendor', label: 'Vendor', required: false },
  { key: 'price', label: 'Price', required: false },
  { key: 'shipping', label: 'Shipping', required: false },
  { key: 'duties', label: 'Import Duties', required: false },
  { key: 'tracking', label: 'Tracking', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'project', label: 'Project', required: false }
];

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  // Simple CSV parser that handles quoted fields
  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(line => parseLine(line));

  return { headers, rows };
};

const CSVImportModal = ({
  isOpen,
  darkMode,
  csvFile,
  projects,
  isModalClosing,
  handleCloseModal,
  onClose,
  onImport
}) => {
  const [csvData, setCsvData] = useState({ headers: [], rows: [] });
  const [columnMappings, setColumnMappings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Parse CSV when file changes
  useEffect(() => {
    if (!csvFile) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = parseCSV(text);

        if (parsed.headers.length === 0) {
          setError('CSV file appears to be empty');
          setIsLoading(false);
          return;
        }

        setCsvData(parsed);

        // Auto-detect column mappings based on header names
        const autoMappings = {};
        parsed.headers.forEach((header, index) => {
          const headerLower = header.toLowerCase().trim();

          if (headerLower.includes('part') && headerLower.includes('name')) {
            autoMappings[index] = 'part';
          } else if (headerLower === 'part' || headerLower === 'name' || headerLower === 'description') {
            autoMappings[index] = 'part';
          } else if (headerLower.includes('part') && headerLower.includes('number') || headerLower === 'partnumber' || headerLower === 'sku') {
            autoMappings[index] = 'partNumber';
          } else if (headerLower === 'vendor' || headerLower === 'supplier') {
            autoMappings[index] = 'vendor';
          } else if (headerLower === 'price' || headerLower === 'cost' || headerLower === 'amount') {
            autoMappings[index] = 'price';
          } else if (headerLower === 'shipping' || headerLower.includes('ship')) {
            autoMappings[index] = 'shipping';
          } else if (headerLower === 'duties' || headerLower.includes('duty') || headerLower.includes('import')) {
            autoMappings[index] = 'duties';
          } else if (headerLower === 'tracking' || headerLower.includes('track')) {
            autoMappings[index] = 'tracking';
          } else if (headerLower === 'status') {
            autoMappings[index] = 'status';
          } else if (headerLower === 'project') {
            autoMappings[index] = 'project';
          } else {
            autoMappings[index] = 'skip';
          }
        });

        setColumnMappings(autoMappings);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to parse CSV file');
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read CSV file');
      setIsLoading(false);
    };

    reader.readAsText(csvFile);
  }, [csvFile]);

  // Check if required fields are mapped
  const isPartNameMapped = useMemo(() => {
    return Object.values(columnMappings).includes('part');
  }, [columnMappings]);

  // Count valid rows (rows with a part name when mapped)
  const validRowsCount = useMemo(() => {
    if (!isPartNameMapped) return 0;

    const partNameIndex = Object.entries(columnMappings).find(([, value]) => value === 'part')?.[0];
    if (partNameIndex === undefined) return 0;

    return csvData.rows.filter(row => row[partNameIndex]?.trim()).length;
  }, [csvData.rows, columnMappings, isPartNameMapped]);

  const handleMappingChange = (columnIndex, fieldKey) => {
    // If selecting a field that's already mapped elsewhere (except 'skip'), clear the old mapping
    if (fieldKey !== 'skip') {
      const existingIndex = Object.entries(columnMappings).find(
        ([idx, val]) => val === fieldKey && idx !== String(columnIndex)
      )?.[0];
      if (existingIndex !== undefined) {
        setColumnMappings(prev => ({
          ...prev,
          [existingIndex]: 'skip',
          [columnIndex]: fieldKey
        }));
        return;
      }
    }

    setColumnMappings(prev => ({
      ...prev,
      [columnIndex]: fieldKey
    }));
  };

  const handleImport = async () => {
    if (!isPartNameMapped || validRowsCount === 0) return;

    setIsImporting(true);

    try {
      // Build parts array from CSV data
      const partsToImport = [];

      csvData.rows.forEach(row => {
        const part = {
          part: '',
          partNumber: '',
          vendor: '',
          price: '',
          shipping: '',
          duties: '',
          tracking: '',
          status: 'pending',
          projectId: null
        };

        Object.entries(columnMappings).forEach(([colIndex, fieldKey]) => {
          if (fieldKey === 'skip') return;

          const value = row[colIndex]?.trim() || '';

          if (fieldKey === 'project') {
            // Try to match project by name
            const matchedProject = projects.find(
              p => p.name.toLowerCase() === value.toLowerCase()
            );
            if (matchedProject) {
              part.projectId = matchedProject.id;
            }
          } else if (fieldKey === 'status') {
            // Normalize status value
            const statusLower = value.toLowerCase();
            if (statusLower.includes('deliver')) {
              part.status = 'delivered';
            } else if (statusLower.includes('ship')) {
              part.status = 'shipped';
            } else if (statusLower.includes('order') || statusLower.includes('purchas')) {
              part.status = 'purchased';
            } else {
              part.status = 'pending';
            }
          } else if (['price', 'shipping', 'duties'].includes(fieldKey)) {
            // Parse numeric values, removing currency symbols
            const numValue = value.replace(/[$,]/g, '');
            part[fieldKey] = numValue;
          } else {
            part[fieldKey] = value;
          }
        });

        // Only add if part name is not empty
        if (part.part) {
          partsToImport.push(part);
        }
      });

      await onImport(partsToImport);
    } catch (err) {
      setError('Failed to import parts');
    } finally {
      setIsImporting(false);
    }
  };

  // Track if this modal was open (for close animation)
  const wasOpen = useRef(false);
  if (isOpen) wasOpen.current = true;

  // Keep modal mounted during closing animation only if THIS modal was open
  if (!isOpen && !isModalClosing) wasOpen.current = false;
  if (!isOpen && !(isModalClosing && wasOpen.current)) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop ${
        isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={() => handleCloseModal(onClose)}
    >
      <div
        className={`rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col modal-content ${
          isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
        } ${darkMode ? 'bg-gray-800' : 'bg-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <h2 className={`text-2xl font-bold ${
              darkMode ? 'text-gray-100' : 'text-gray-800'
            }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>Import CSV</h2>
            {csvFile && (
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {csvFile.name}
              </p>
            )}
          </div>
          <button
            onClick={() => handleCloseModal(onClose)}
            className={`transition-colors ${
              darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Parsing CSV file...
              </div>
            </div>
          ) : error ? (
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
            }`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div className={`mb-6 p-4 rounded-lg ${
                darkMode ? 'bg-gray-700/50' : 'bg-blue-50'
              }`}>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-blue-800'}`}>
                  Map your CSV columns to part fields below. The <strong>Part Name</strong> field is required.
                </p>
              </div>

              {/* Column Mapping */}
              <div className="mb-6">
                <h3 className={`text-lg font-semibold mb-4 ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  Column Mapping
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {csvData.headers.map((header, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-white border-slate-300'
                    }`}>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        {header || `Column ${index + 1}`}
                      </label>
                      <select
                        value={columnMappings[index] || 'skip'}
                        onChange={(e) => handleMappingChange(index, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                          darkMode
                            ? 'bg-gray-600 border-gray-500 text-gray-100'
                            : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`}
                        style={selectDropdownStyle}
                      >
                        {PART_FIELDS.map(field => (
                          <option key={field.key} value={field.key}>
                            {field.label}{field.required ? ' *' : ''}
                          </option>
                        ))}
                      </select>
                      {/* Preview first value */}
                      {csvData.rows[0]?.[index] && (
                        <p className={`mt-2 text-xs truncate ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Preview: {csvData.rows[0][index]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation Status */}
              <div className={`p-4 rounded-lg border ${
                isPartNameMapped
                  ? darkMode
                    ? 'bg-green-900/20 border-green-700'
                    : 'bg-green-50 border-green-300'
                  : darkMode
                    ? 'bg-yellow-900/20 border-yellow-700'
                    : 'bg-yellow-50 border-yellow-300'
              }`}>
                <div className="flex items-center gap-2">
                  {isPartNameMapped ? (
                    <>
                      <Check className={`w-5 h-5 ${
                        darkMode ? 'text-green-400' : 'text-green-600'
                      }`} />
                      <span className={`${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                        Ready to import <strong>{validRowsCount}</strong> part{validRowsCount !== 1 ? 's' : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className={`w-5 h-5 ${
                        darkMode ? 'text-yellow-400' : 'text-yellow-600'
                      }`} />
                      <span className={`${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                        Please map a column to <strong>Part Name</strong> to continue
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Data Preview */}
              {isPartNameMapped && validRowsCount > 0 && (
                <div className="mt-6">
                  <h3 className={`text-lg font-semibold mb-4 ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    Preview (first 5 rows)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className={`w-full text-sm ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <thead>
                        <tr className={`border-b ${
                          darkMode ? 'border-gray-600' : 'border-slate-300'
                        }`}>
                          {Object.entries(columnMappings)
                            .filter(([, fieldKey]) => fieldKey !== 'skip')
                            .map(([colIndex, fieldKey]) => (
                              <th key={colIndex} className={`px-3 py-2 text-left font-medium ${
                                darkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>
                                {PART_FIELDS.find(f => f.key === fieldKey)?.label || fieldKey}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.rows.slice(0, 5).map((row, rowIndex) => {
                          const partNameIndex = Object.entries(columnMappings).find(([, value]) => value === 'part')?.[0];
                          if (!row[partNameIndex]?.trim()) return null;

                          return (
                            <tr key={rowIndex} className={`border-b ${
                              darkMode ? 'border-gray-700' : 'border-slate-200'
                            }`}>
                              {Object.entries(columnMappings)
                                .filter(([, fieldKey]) => fieldKey !== 'skip')
                                .map(([colIndex, fieldKey]) => (
                                  <td key={colIndex} className="px-3 py-2 truncate max-w-[200px]">
                                    {row[colIndex] || '-'}
                                  </td>
                                ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-100'
        }`}>
          <div className="flex gap-3">
            <button
              onClick={() => handleCloseModal(onClose)}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!isPartNameMapped || validRowsCount === 0 || isImporting}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                !isPartNameMapped || validRowsCount === 0 || isImporting
                  ? darkMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isImporting ? 'Importing...' : `Import ${validRowsCount} Part${validRowsCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;
