import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { casesService } from '@/services/cases.service';
import { importsService } from '@/services/imports.service';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['caseStats'],
    queryFn: () => casesService.getStats(),
  });

  const { data: imports, isLoading: importsLoading } = useQuery({
    queryKey: ['recentImports'],
    queryFn: () => importsService.getImports(),
  });

  const loading = statsLoading || importsLoading;
  const recentImports = imports?.slice(0, 5) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your case management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cases</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{stats?.byStatus?.PENDING || 0}</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-blue-600">{stats?.byStatus?.IN_PROGRESS || 0}</p>
            </div>
            <div className="text-4xl">🔄</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600">{stats?.byStatus?.COMPLETED || 0}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/import"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">📁</span>
            <div>
              <p className="font-medium text-gray-900">Import CSV</p>
              <p className="text-sm text-gray-500">Upload and validate cases</p>
            </div>
          </Link>

          <Link
            to="/cases"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-medium text-gray-900">View Cases</p>
              <p className="text-sm text-gray-500">Browse all cases</p>
            </div>
          </Link>

          <div className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg opacity-50 cursor-not-allowed">
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-medium text-gray-900">Reports</p>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Imports */}
      {recentImports.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Imports</h2>
          <div className="space-y-3">
            {recentImports.map((importItem) => (
              <div
                key={importItem.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{importItem.filename}</p>
                  <p className="text-sm text-gray-500">
                    {importItem.totalRows} rows • {importItem.successCount} success •{' '}
                    {importItem.failureCount} failed
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    importItem.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-700'
                      : importItem.status === 'FAILED'
                      ? 'bg-red-100 text-red-700'
                      : importItem.status === 'PROCESSING'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {importItem.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
