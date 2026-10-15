import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService } from '../../services/leaveService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Check, X, Calendar, MessageSquare } from 'lucide-react';
import { LeaveRequest } from '../../types/leave';

export const LeaveManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminLeavesList', statusFilter],
    queryFn: () => leaveService.getLeaves({ status: statusFilter || undefined }),
  });

  const leaves: LeaveRequest[] = data?.data || data?.results || [];

  const reviewMutation = useMutation({
    mutationFn: () => leaveService.reviewLeave(selectedLeave!.id, actionType, reviewNotes),
    onSuccess: () => {
      setSelectedLeave(null);
      setReviewNotes('');
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ['adminLeavesList'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to review leave.';
      setErrorMsg(msg);
    },
  });

  const handleOpenReview = (leave: LeaveRequest, action: 'APPROVED' | 'REJECTED') => {
    setSelectedLeave(leave);
    setActionType(action);
    setReviewNotes('');
    setErrorMsg(null);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reviewMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Approvals</h1>
          <p className="text-xs text-slate-500 mt-1">Review, approve, or reject employee leave applications</p>
        </div>
        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Applications</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-right font-bold text-slate-500 uppercase tracking-wider">Decision</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading leave requests...</td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No leave requests found.</td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {l.employee_name}
                      <span className="block text-[10px] text-slate-400 font-mono">{l.employee_code}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{l.leave_type}</td>
                    <td className="px-6 py-4 font-mono text-slate-700">
                      {l.start_date} <span className="text-slate-400">→</span> {l.end_date}
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs">{l.reason}</td>
                    <td className="px-6 py-4">
                      {l.status === 'APPROVED' ? (
                        <Badge variant="success" dot>Approved</Badge>
                      ) : l.status === 'REJECTED' ? (
                        <Badge variant="danger" dot>Rejected</Badge>
                      ) : (
                        <Badge variant="warning" dot>Pending</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {l.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleOpenReview(l, 'APPROVED')}
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleOpenReview(l, 'REJECTED')}
                            leftIcon={<X className="w-3.5 h-3.5" />}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Reviewed by {l.reviewer_email || 'Admin'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review Confirmation Modal */}
      {selectedLeave && (
        <Modal
          isOpen={!!selectedLeave}
          onClose={() => setSelectedLeave(null)}
          title={`${actionType === 'APPROVED' ? 'Approve' : 'Reject'} Leave Request`}
          description={`Submit official decision for ${selectedLeave.employee_name} (${selectedLeave.leave_type})`}
        >
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <p><span className="text-slate-500 font-medium">Dates:</span> <span className="font-semibold text-slate-800">{selectedLeave.start_date} to {selectedLeave.end_date}</span></p>
              <p><span className="text-slate-500 font-medium">Reason:</span> <span className="text-slate-700 italic">"{selectedLeave.reason}"</span></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Review Notes / Remarks (Optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                placeholder="Add comments or instructions for the employee..."
                className="block w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setSelectedLeave(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={actionType === 'APPROVED' ? 'success' : 'danger'}
                isLoading={reviewMutation.isPending}
              >
                Confirm {actionType === 'APPROVED' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
