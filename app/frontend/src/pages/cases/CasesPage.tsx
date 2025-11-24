import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { casesService } from '@/services/cases.service';
import { usersService } from '@/services/users.service';
import { useAuthStore } from '@/store/auth.store';
import type { Case, CaseQueryParams } from '@/types';

export default function CasesPage() {
  const { user } = useAuthStore();
  const [params, setParams] = useState<CaseQueryParams>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setParams((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
    }, 5000); // Wait 15 seconds after user stops typing

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['cases', params],
    queryFn: () => casesService.getCases(params),
  });

  // Fetch users for assignee filter (admin only)
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getUsers(),
    enabled: user?.role === 'ADMIN',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-700';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700';
      case 'LOW':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load cases. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Cases</h1>
          <p className="text-sm sm:text-base text-gray-600">
            {data?.pagination.total || 0} total • Page {data?.pagination.page || 1}/{data?.pagination.totalPages || 1}
          </p>
        </div>
        <Link
          to="/import"
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-md hover:bg-blue-700 transition-colors text-center"
        >
          Import Cases
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            value={searchInput}
            placeholder="Search by name or case ID..."
            name="search"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select
            value={params.status || ''}
            name="status"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              const newParams = { ...params, page: 1 };
              if (e.target.value) {
                newParams.status = e.target.value as any;
              } else {
                delete newParams.status;
              }
              setParams(newParams);
            }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            value={params.category || ''}
            name="category"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              const newParams = { ...params, page: 1 };
              if (e.target.value) {
                newParams.category = e.target.value as any;
              } else {
                delete newParams.category;
              }
              setParams(newParams);
            }}
          >
            <option value="">All Categories</option>
            <option value="TAX">Tax</option>
            <option value="LICENSE">License</option>
            <option value="PERMIT">Permit</option>
          </select>
          <select
            value={params.priority || ''}
            name="priority"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              const newParams = { ...params, page: 1 };
              if (e.target.value) {
                newParams.priority = e.target.value as any;
              } else {
                delete newParams.priority;
              }
              setParams(newParams);
            }}
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Date Range and Assignee Filters */}
        <div className={`grid grid-cols-1 ${user?.role === 'ADMIN' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 pt-4 border-t border-gray-200`}>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={params.startDate || ''}
              onChange={(e) => {
                const newParams = { ...params, page: 1 };
                if (e.target.value) {
                  newParams.startDate = e.target.value;
                } else {
                  delete newParams.startDate;
                }
                setParams(newParams);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={params.endDate || ''}
              onChange={(e) => {
                const newParams = { ...params, page: 1 };
                if (e.target.value) {
                  newParams.endDate = e.target.value;
                } else {
                  delete newParams.endDate;
                }
                setParams(newParams);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {user?.role === 'ADMIN' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Assignee</label>
              <select
                value={params.createdById || ''}
                onChange={(e) => {
                  const newParams = { ...params, page: 1 };
                  if (e.target.value) {
                    newParams.createdById = e.target.value;
                  } else {
                    delete newParams.createdById;
                  }
                  setParams(newParams);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Assignees</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName && u.lastName 
                      ? `${u.firstName} ${u.lastName}` 
                      : u.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Clear All Filters Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setParams({ page: 1, limit: 20 });
              setSearchInput('');
            }}
            className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" data-testid="cases-table">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-[15%] sm:w-auto px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case ID
                </th>
                <th className="w-[30%] sm:w-auto px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="hidden md:table-cell px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="w-[18%] sm:w-auto px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="w-[18%] sm:w-auto px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden lg:table-cell px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="w-[19%] sm:w-auto px-3 sm:px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data.map((caseItem: Case) => (
                <tr key={caseItem.id} className="hover:bg-gray-50" data-testid="case-row">
                  <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <Link
                      to={`/cases/${caseItem.id}`}
                      className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium"
                    >
                      {caseItem.caseId}
                    </Link>
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-none">{caseItem.applicantName}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-none hidden sm:block">{caseItem.email}</p>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    {caseItem.category}
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${getPriorityColor(
                        caseItem.priority
                      )}`}
                    >
                      {caseItem.priority.charAt(0)}<span className="hidden sm:inline">{caseItem.priority.slice(1)}</span>
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${getStatusColor(
                        caseItem.status
                      )}`}
                    >
                      <span className="sm:hidden">{caseItem.status.split('_')[0].charAt(0)}</span>
                      <span className="hidden sm:inline">{caseItem.status.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="hidden lg:table-cell px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {new Date(caseItem.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                    <Link
                      to={`/cases/${caseItem.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-3 sm:px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <button
              onClick={() => setParams((prev) => ({ ...prev, page: prev.page! - 1 }))}
              disabled={data.pagination.page === 1}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">‹</span>
            </button>
            <span className="text-xs sm:text-sm text-gray-700">
              <span className="hidden sm:inline">Page </span>{data.pagination.page} / {data.pagination.totalPages}
            </span>
            <button
              onClick={() => setParams((prev) => ({ ...prev, page: prev.page! + 1 }))}
              disabled={data.pagination.page === data.pagination.totalPages}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">›</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
