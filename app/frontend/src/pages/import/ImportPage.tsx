import { useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'react-toastify';
import { useImportStore } from '@/store/import.store';
import { importsService } from '@/services/imports.service';

interface ValidationResult {
  filename: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  validData: any[];
  errors: any[];
}

export default function ImportPage() {
  const [uploading, setUploading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { setFilename } = useImportStore();
  const parentRef = useRef<HTMLDivElement>(null);

  // Initialize virtualizer at the top level
  const rowVirtualizer = useVirtualizer({
    count: validationResult?.validData.length || 0,
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

  const handleSubmit = async () => {
    if (!validationResult) return;

    setSubmitting(true);
    try {
      const result = await importsService.submitImport({
        filename: validationResult.filename,
        cases: validationResult.validData,
      });

      toast.success(`Successfully imported ${result.successful?.length || 0} cases!`);
      
      if (result.failed?.length > 0) {
        toast.warning(`${result.failed.length} cases failed to import`);
      }

      // Reset
      setValidationResult(null);
      setFilename('');
      
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit cases');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Import Cases</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Upload a CSV file to import cases into the system</p>
      </div>

      {/* Upload Area */}
      <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-sm border border-gray-200">
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

        <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-600">
          <p className="font-medium mb-2">Required CSV format:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-500 pl-2">
            <li>caseId - Unique identifier (e.g., C-1001)</li>
            <li>applicantName - Full name</li>
            <li>dob - Date of birth (YYYY-MM-DD)</li>
            <li>email - Email address</li>
            <li>phone - Phone number with country code</li>
            <li>category - TAX, LICENSE, or PERMIT</li>
            <li>priority - LOW, MEDIUM, or HIGH</li>
          </ul>
        </div>
      </div>

      {/* Validation Results */}
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
              <p className="text-xl sm:text-2xl font-bold text-green-600">{validationResult.validRows}</p>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-red-200">
              <p className="text-xs sm:text-sm text-gray-600">Invalid Rows</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{validationResult.invalidRows}</p>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-blue-200 flex items-center justify-center col-span-2 lg:col-span-1">
              <button
                onClick={handleSubmit}
                disabled={submitting || validationResult.validRows === 0}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting...' : `Submit ${validationResult.validRows} Cases`}
              </button>
            </div>
          </div>

          {/* Valid Data Table */}
          {validationResult.validRows > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Valid Cases ({validationResult.validRows})
                  </h3>
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
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case ID</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                          <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                          const row = validationResult.validData[virtualRow.index];
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
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{row.caseId}</td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{row.applicantName}</td>
                              <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{row.email}</td>
                              <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{row.phone}</td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {row.category}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  row.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                  row.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {row.priority}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Errors</th>
                        <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {validationResult.errors.map((error, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                            {error.row}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-red-600">
                            <ul className="list-disc list-inside space-y-1">
                              {error.errors.map((err: any, i: number) => (
                                <li key={i} className="break-words">
                                  <span className="font-semibold">{err.field}:</span> {err.message}
                                  {err.value && <span className="text-gray-500 block sm:inline"> (value: {err.value})</span>}
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 text-xs text-gray-500 font-mono max-w-xs overflow-hidden">
                            {JSON.stringify(error.data).substring(0, 100)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!validationResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">📋 What happens next?</h3>
          <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-blue-800">
            <li>Upload your CSV file</li>
            <li>Review the data in an editable grid</li>
            <li>Fix any validation errors with auto-suggestions</li>
            <li>Submit cases in batches with progress tracking</li>
            <li>View imported cases in the Cases page</li>
          </ol>
        </div>
      )}
    </div>
  );
}
