import { useState, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'react-toastify';
import { useImportStore } from '@/store/import.store';
import { importsService } from '@/services/imports.service';
import OneSchemaImport from '@/components/import/OneSchemaImport';
import oneSchemaConfig from '@/config/oneschema.config';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ValidationResult {
  filename: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  validData: any[];
  errors: any[];
}

interface ColumnHeader {
  id: string;
  label: string;
  field: string;
}

function SortableHeader({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-move hover:bg-gray-100"
    >
      {children}
    </th>
  );
}

export default function EnhancedImportPage() {
  const [uploading, setUploading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [editedData, setEditedData] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [columns, setColumns] = useState<ColumnHeader[]>([
    { id: 'caseId', label: 'Case ID', field: 'caseId' },
    { id: 'applicantName', label: 'Applicant', field: 'applicantName' },
    { id: 'email', label: 'Email', field: 'email' },
    { id: 'phone', label: 'Phone', field: 'phone' },
    { id: 'category', label: 'Category', field: 'category' },
    { id: 'priority', label: 'Priority', field: 'priority' },
  ]);
  const { setFilename } = useImportStore();
  const parentRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter data based on column filters
  const filteredData = useMemo(() => {
    if (!editedData.length) return [];
    
    return editedData.filter((row) => {
      return Object.entries(columnFilters).every(([field, filterValue]) => {
        if (!filterValue) return true;
        const cellValue = String(row[field] || '').toLowerCase();
        return cellValue.includes(filterValue.toLowerCase());
      });
    });
  }, [editedData, columnFilters]);

  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 53,
    overscan: 10,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setUploading(true);
    setFilename(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await importsService.uploadCSV(formData);
      setValidationResult(result);
      setEditedData(result.validData);
      
      toast.success(`File "${file.name}" loaded successfully!`);
      
      if (result.invalidRows > 0) {
        toast.warning(`Found ${result.invalidRows} rows with validation errors`);
      }
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleCellEdit = (rowIndex: number, field: string, value: any) => {
    const newData = [...editedData];
    newData[rowIndex] = { ...newData[rowIndex], [field]: value };
    setEditedData(newData);
  };

  const handleBulkEdit = (field: string, value: any, applyToAll: boolean = false) => {
    const newData = editedData.map((row) => {
      // Apply to all or only filtered rows
      if (applyToAll || filteredData.includes(row)) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setEditedData(newData);
    toast.success(`Updated ${applyToAll ? 'all' : 'filtered'} rows`);
  };

  const handleFixAll = () => {
    if (!validationResult) return;

    // Fix existing valid data
    const fixedValidData = editedData.map((row) => ({
      ...row,
      applicantName: row.applicantName?.trim().split(' ').map((w: string) => 
        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      ).join(' ') || '',
      email: row.email?.trim().toLowerCase() || '',
      phone: row.phone?.replace(/[^\d+]/g, '') || '',
    }));

    // Attempt to fix invalid rows
    const fixedInvalidData = validationResult.errors.map((errorRow) => {
      const row = errorRow.data || errorRow.row || {};
      
      return {
        caseId: row.caseId?.toString().trim() || `C-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        applicantName: row.applicantName?.toString().trim().split(' ').map((w: string) => 
          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join(' ') || 'Unknown',
        dob: row.dob || new Date().toISOString().split('T')[0],
        email: row.email?.toString().trim().toLowerCase() || `placeholder-${Date.now()}@example.com`,
        phone: row.phone?.toString().replace(/[^\d+]/g, '') || '+1000000000',
        category: ['TAX', 'LICENSE', 'PERMIT'].includes(row.category?.toUpperCase()) 
          ? row.category.toUpperCase() 
          : 'TAX',
        priority: ['LOW', 'MEDIUM', 'HIGH'].includes(row.priority?.toUpperCase()) 
          ? row.priority.toUpperCase() 
          : 'MEDIUM',
      };
    });

    // Combine fixed data
    const allFixedData = [...fixedValidData, ...fixedInvalidData];
    setEditedData(allFixedData);
    
    // Update validation result
    setValidationResult({
      ...validationResult,
      validRows: allFixedData.length,
      invalidRows: 0,
      validData: allFixedData,
      errors: [],
    });

    toast.success(`Fixed ${fixedInvalidData.length} invalid rows and ${fixedValidData.length} valid rows!`);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async () => {
    if (!validationResult) return;

    setSubmitting(true);
    setProgress(0);

    try {
      const batchSize = 1000; // Increased from 100 to 1000
      const totalBatches = Math.ceil(editedData.length / batchSize);
      let successCount = 0;
      let failedCount = 0;
      const failedRows: any[] = [];

      // Process batches in parallel (3 at a time)
      const concurrentBatches = 3;
      
      for (let i = 0; i < editedData.length; i += batchSize * concurrentBatches) {
        const batchPromises = [];
        
        for (let j = 0; j < concurrentBatches; j++) {
          const startIdx = i + (j * batchSize);
          if (startIdx >= editedData.length) break;
          
          const batch = editedData.slice(startIdx, startIdx + batchSize);
          
          batchPromises.push(
            importsService.submitImport({
              filename: validationResult.filename,
              cases: batch,
            }).catch(error => {
              console.error(`Batch failed:`, error);
              return { successful: [], failed: batch.map(row => ({ row, error: 'Submit failed' })) };
            })
          );
        }
        
        const results = await Promise.all(batchPromises);
        
        results.forEach(result => {
          successCount += result.successful?.length || 0;
          failedCount += result.failed?.length || 0;
          if (result.failed?.length > 0) {
            failedRows.push(...result.failed);
          }
        });

        const processedBatches = Math.min(Math.floor(i / batchSize) + concurrentBatches, totalBatches);
        setProgress(Math.round((processedBatches / totalBatches) * 100));
      }

      toast.success(`Successfully imported ${successCount} cases!`);
      
      if (failedCount > 0) {
        toast.warning(`${failedCount} cases failed to import`);
        // Optionally show downloadable error report
      }

      setValidationResult(null);
      setEditedData([]);
      setFilename('');
      setProgress(0);
      
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit cases');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadErrorCSV = () => {
    if (!validationResult || validationResult.errors.length === 0) return;

    const headers = ['Row', 'Errors', 'Data'];
    const rows = validationResult.errors.map((err) => [
      err.row,
      err.errors.map((e: any) => `${e.field}: ${e.message}`).join('; '),
      JSON.stringify(err.data),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errors-${validationResult.filename}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Import Cases</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Upload, edit, and validate CSV data</p>
        </div>
        {validationResult && (
          <div className="flex gap-2">
            <button
              onClick={handleFixAll}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
            >
              Fix All
            </button>
            {validationResult.errors.length > 0 && (
              <button
                onClick={downloadErrorCSV}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
              >
                Download Errors
              </button>
            )}
          </div>
        )}
      </div>

      {/* OneSchema Import Option */}
      {!validationResult && oneSchemaConfig.enabled && (
        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Option 1: Professional Import (Recommended)</h2>
          <OneSchemaImport 
            onSuccess={() => {
              setValidationResult(null);
              setEditedData([]);
            }}
          />
        </div>
      )}

      {/* Upload Area */}
      {!validationResult && (
        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {oneSchemaConfig.enabled ? 'Option 2: Standard Import' : 'Upload CSV File'}
          </h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 lg:p-12 text-center hover:border-blue-500 transition-colors">
            <div className="space-y-3 sm:space-y-4">
              <div className="text-4xl sm:text-5xl lg:text-6xl">📁</div>
              <div>
                <p className="text-base sm:text-lg font-medium text-gray-900">
                  {uploading ? 'Uploading...' : 'Drop your CSV file here'}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">or click to browse</p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-md hover:bg-blue-700 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Processing...' : 'Select File'}
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Validation Results with Editable Grid */}
      {validationResult && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600">Total Rows</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{validationResult.totalRows}</p>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-green-200">
              <p className="text-xs sm:text-sm text-gray-600">Valid Rows</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{editedData.length}</p>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-red-200">
              <p className="text-xs sm:text-sm text-gray-600">Invalid Rows</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{validationResult.invalidRows}</p>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-blue-200 flex items-center justify-center">
              <button
                onClick={handleSubmit}
                disabled={submitting || editedData.length === 0}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? `Submitting... ${progress}%` : `Submit ${editedData.length} Cases`}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {submitting && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">{progress}% Complete</p>
            </div>
          )}

          {/* Bulk Edit Actions */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Bulk Operations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex gap-2">
                <select
                  onChange={(e) => e.target.value && handleBulkEdit('priority', e.target.value, false)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
                >
                  <option value="">Set Priority (Filtered)</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className="flex gap-2">
                <select
                  onChange={(e) => e.target.value && handleBulkEdit('category', e.target.value, false)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
                >
                  <option value="">Set Category (Filtered)</option>
                  <option value="TAX">Tax</option>
                  <option value="LICENSE">License</option>
                  <option value="PERMIT">Permit</option>
                </select>
              </div>
              <div className="flex gap-2">
                <select
                  onChange={(e) => e.target.value && handleBulkEdit('status', e.target.value, true)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
                >
                  <option value="">Set Status (All)</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Editable Data Table with Column Reordering */}
          {editedData.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Editable Cases ({filteredData.length} of {editedData.length})
                </h3>
                <p className="text-xs text-gray-500 mt-1">Drag column headers to reorder • Click cells to edit</p>
              </div>

              {/* Column Filters */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-6 gap-2">
                  {columns.map((col) => (
                    <input
                      key={col.id}
                      type="text"
                      placeholder={`Filter ${col.label}`}
                      value={columnFilters[col.field] || ''}
                      onChange={(e) => setColumnFilters({ ...columnFilters, [col.field]: e.target.value })}
                      className="px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  ))}
                </div>
              </div>

              <div 
                ref={parentRef}
                className="overflow-auto"
                style={{ height: '500px' }}
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                            {columns.map((col) => (
                              <SortableHeader key={col.id} id={col.id}>
                                {col.label}
                              </SortableHeader>
                            ))}
                          </SortableContext>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                          const row = filteredData[virtualRow.index];
                          const originalIndex = editedData.indexOf(row);
                          
                          return (
                            <tr
                              key={virtualRow.index}
                              className="hover:bg-gray-50"
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                              }}
                            >
                              {columns.map((col) => (
                                <td key={col.id} className="px-3 sm:px-6 py-3 sm:py-4">
                                  <input
                                    type="text"
                                    value={row[col.field] || ''}
                                    onChange={(e) => handleCellEdit(originalIndex, col.field, e.target.value)}
                                    className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-200 rounded focus:border-blue-500 focus:outline-none"
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </DndContext>
                </div>
              </div>
            </div>
          )}

          {/* Errors Table */}
          {validationResult.invalidRows > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-red-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-red-200 bg-red-50">
                <h3 className="text-base sm:text-lg font-semibold text-red-900">
                  Validation Errors ({validationResult.invalidRows})
                </h3>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {validationResult.errors.slice(0, 20).map((error, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {error.row}
                        </td>
                        <td className="px-6 py-4 text-sm text-red-600">
                          <ul className="list-disc list-inside space-y-1">
                            {error.errors.map((err: any, i: number) => (
                              <li key={i}>
                                <span className="font-semibold">{err.field}:</span> {err.message}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
