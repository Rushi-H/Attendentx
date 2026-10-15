import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../services/reportService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { History, Shield, Eye, Search } from 'lucide-react';
import { AuditLogItem } from '../../types/report';

export const AuditLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['systemAuditLogs', searchTerm],
    queryFn: () => reportService.getAuditLogs({ search: searchTerm || undefined }),
  });

  const logs: AuditLogItem[] = data?.data || data?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Trails</h1>
          <p className="text-xs text-slate-500 mt-1">Immutable security and administrative compliance change log</p>
        </div>
      </div>

      <Card className="p-4">
        <Input
          placeholder="Filter logs by actor email, action, or entity ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
        />
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Actor</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3.5 text-right font-bold text-slate-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">No audit records logged yet.</td>
                </tr>
              ) : (
                logs.map((log) => {
                  const ts = new Date(log.created_at);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                        {ts.toLocaleDateString()} {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-900">{log.actor_email}</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 font-mono">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-700">
                        {log.entity_type}
                        <span className="block text-[10px] text-slate-400 font-mono">{log.entity_id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 max-w-xs truncate">{log.reason || '—'}</td>
                      <td className="px-6 py-3.5 font-mono text-slate-500">{log.ip_address || '—'}</td>
                      <td className="px-6 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLog(log)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          View Diff
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Diff Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Record: ${selectedLog.action}`}
          description={`Logged by ${selectedLog.actor_email} at ${new Date(selectedLog.created_at).toLocaleString()}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p><span className="text-slate-500 font-semibold">Entity:</span> {selectedLog.entity_type} ({selectedLog.entity_id})</p>
              <p className="mt-1"><span className="text-slate-500 font-semibold">Reason:</span> {selectedLog.reason || 'None provided'}</p>
              <p className="mt-1"><span className="text-slate-500 font-semibold">Source IP:</span> {selectedLog.ip_address || 'N/A'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-bold text-slate-700 uppercase tracking-wider mb-1.5">Previous State (Old)</p>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto text-[11px] font-mono h-48">
                  {JSON.stringify(selectedLog.old_values, null, 2)}
                </pre>
              </div>
              <div>
                <p className="font-bold text-slate-700 uppercase tracking-wider mb-1.5">Updated State (New)</p>
                <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg overflow-x-auto text-[11px] font-mono h-48">
                  {JSON.stringify(selectedLog.new_values, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
