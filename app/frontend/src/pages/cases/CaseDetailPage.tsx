import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casesService } from '@/services/cases.service';
import { useAuthStore } from '@/store/auth.store';
import { formatDate } from '@/utils/date';
import { toast } from 'react-toastify';

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    priority: '',
    notes: '',
  });

  const { data: caseItem, isLoading, error } = useQuery({
    queryKey: ['case', id],
    queryFn: () => casesService.getCase(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => casesService.updateCase(id!, data),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['case', id] });

      // Snapshot previous value
      const previousCase = queryClient.getQueryData(['case', id]);

      // Optimistically update
      queryClient.setQueryData(['case', id], (old: any) => ({
        ...old,
        ...newData,
        updatedAt: new Date().toISOString(),
      }));

      toast.info('Updating case...', { autoClose: 1000 });

      return { previousCase };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['caseStats'] });
      toast.success('Case updated successfully!');
      setIsEditModalOpen(false);
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousCase) {
        queryClient.setQueryData(['case', id], context.previousCase);
      }
      toast.error('Failed to update case');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => casesService.deleteCase(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['caseStats'] });
      toast.success('Case deleted successfully!');
      navigate('/cases');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete case');
    },
  });

  const handleEdit = () => {
    setEditForm({
      status: caseItem?.status || '',
      priority: caseItem?.priority || '',
      notes: caseItem?.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    updateMutation.mutate(editForm);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !caseItem) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load case details.</p>
        <button
          onClick={() => navigate('/cases')}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Back to Cases
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/cases')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Back to Cases
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{caseItem.caseId}</h1>
        </div>
        <div className="flex gap-2">
          {user?.role === 'ADMIN' && (
            <button 
              onClick={handleEdit}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
          )}
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Case</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add notes..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={updateMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Case Information</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Applicant Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseItem.applicantName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(caseItem.dob)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseItem.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseItem.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseItem.category}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Priority</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      caseItem.priority === 'HIGH'
                        ? 'bg-red-100 text-red-700'
                        : caseItem.priority === 'MEDIUM'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {caseItem.priority}
                  </span>
                </dd>
              </div>
            </dl>

            {caseItem.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseItem.notes}</dd>
              </div>
            )}
          </div>

          {/* Activity Timeline with Full Audit Trail */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {caseItem.history && caseItem.history.length > 0 ? (
                caseItem.history.map((entry: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        entry.action === 'CREATED' ? 'bg-green-100' :
                        entry.action === 'UPDATED' ? 'bg-blue-100' :
                        entry.action === 'DELETED' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        <span className={`text-sm ${
                          entry.action === 'CREATED' ? 'text-green-600' :
                          entry.action === 'UPDATED' ? 'text-blue-600' :
                          entry.action === 'DELETED' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {entry.action === 'CREATED' ? '✓' :
                           entry.action === 'UPDATED' ? '↻' :
                           entry.action === 'DELETED' ? '✕' : '•'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {entry.action === 'CREATED' && 'Case created'}
                        {entry.action === 'UPDATED' && entry.field && (
                          <>
                            Updated <span className="font-semibold">{entry.field}</span>
                            {entry.oldValue && entry.newValue && (
                              <span className="text-gray-600">
                                {' '}from <span className="line-through">{entry.oldValue}</span> to <span className="font-semibold text-blue-600">{entry.newValue}</span>
                              </span>
                            )}
                          </>
                        )}
                        {entry.action === 'DELETED' && 'Case deleted'}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(entry.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Case created</p>
                    <p className="text-sm text-gray-500">{formatDate(caseItem.createdAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Current Status</p>
                <span
                  className={`inline-block mt-1 px-3 py-1 text-sm font-medium rounded-full ${
                    caseItem.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-700'
                      : caseItem.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-700'
                      : caseItem.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {caseItem.status}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Update Status</p>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">{formatDate(caseItem.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="text-gray-900">{formatDate(caseItem.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Import Source</dt>
                <dd className="text-gray-900">{caseItem.import?.filename || 'N/A'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Case</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete case <strong>{caseItem.caseId}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate();
                  setShowDeleteConfirm(false);
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
