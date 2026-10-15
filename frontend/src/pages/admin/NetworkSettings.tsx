import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../services/settingsService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import {
  ShieldAlert,
  ShieldCheck,
  Wifi,
  Server,
  AlertTriangle,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';

export const NetworkSettings: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: policy, isLoading } = useQuery({
    queryKey: ['networkPolicySettings'],
    queryFn: () => settingsService.getNetworkPolicy(),
  });

  const [verificationMode, setVerificationMode] = useState<string>('STRICT_IP_ALLOWLIST');
  const [ipRanges, setIpRanges] = useState<string[]>(['223.236.99.39/32']);
  const [newIpInput, setNewIpInput] = useState('');
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (policy) {
      setVerificationMode(policy.verification_mode);
      setIpRanges(policy.allowed_ip_ranges || ['223.236.99.39/32']);
    }
  }, [policy]);

  const updateMutation = useMutation({
    mutationFn: () =>
      settingsService.updateNetworkPolicy({
        verification_mode: verificationMode,
        allowed_ip_ranges: ipRanges,
        reason: reason || 'Updated network security policy via Admin UI',
      }),
    onSuccess: () => {
      setSuccessMessage('Network verification policy updated successfully!');
      setErrorMessage(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['networkPolicySettings'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update policy.';
      setErrorMessage(msg);
      setSuccessMessage(null);
    },
  });

  const handleAddIp = () => {
    if (!newIpInput.trim()) return;
    let ip = newIpInput.trim();
    if (!ip.includes('/')) {
      ip = `${ip}/32`;
    }
    if (!ipRanges.includes(ip)) {
      setIpRanges([...ipRanges, ip]);
    }
    setNewIpInput('');
  };

  const handleRemoveIp = (index: number) => {
    setIpRanges(ipRanges.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Network Verification Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure office IP boundaries, verification modes, and candidate allowlists
        </p>
      </div>

      {/* Prominent Airtel AirFiber Security Limitation Warning */}
      <Alert variant="warning" title="Important Notice on Office Network IP Boundaries">
        <p className="font-semibold mb-1">
          Candidate Office Public IPv4: <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded">223.236.99.39</code> (Airtel AirFiber)
        </p>
        <p className="text-xs leading-relaxed opacity-90">
          Fixed Wireless Access (FWA) links like Airtel AirFiber commonly utilize Carrier-Grade NAT (CGNAT) or dynamic pool rotation.
          Public-IP allowlisting enforces an external network perimeter restriction, but <strong>does not guarantee exclusive physical presence</strong> inside the office building.
          If the ISP link rotates to a new IP range, switch temporarily to <code className="font-semibold">ADMIN_MANUAL_REVIEW</code> or update the CIDR range below.
        </p>
      </Alert>

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {/* Configuration Form */}
      <Card>
        <CardHeader
          title="Network Security Policy"
          subtitle="Governs server-side verification during employee check-in and check-out"
        />

        <div className="space-y-6">
          {/* Current Observed Diagnostic IP */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-brand-600" />
              <div>
                <p className="text-xs font-semibold text-slate-900">Your Current Source IP</p>
                <p className="text-[11px] text-slate-500">Observed at server socket via proxy depth</p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-200">
              {policy?.client_observed_ip || '127.0.0.1'}
            </span>
          </div>

          {/* Verification Mode Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Verification Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setVerificationMode('STRICT_IP_ALLOWLIST')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  verificationMode === 'STRICT_IP_ALLOWLIST'
                    ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Strict IP Allowlist</span>
                  {verificationMode === 'STRICT_IP_ALLOWLIST' && <ShieldCheck className="w-4 h-4 text-brand-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Blocks check-in with HTTP 403 unless originating from approved CIDRs.
                </p>
              </div>

              <div
                onClick={() => setVerificationMode('ADMIN_MANUAL_REVIEW')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  verificationMode === 'ADMIN_MANUAL_REVIEW'
                    ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Admin Manual Review</span>
                  {verificationMode === 'ADMIN_MANUAL_REVIEW' && <ShieldCheck className="w-4 h-4 text-brand-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Allows off-network check-in flagged as PENDING_REVIEW for supervisor signoff.
                </p>
              </div>
            </div>
          </div>

          {/* Approved IP Ranges */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Approved Office IP / CIDR Ranges
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="e.g. 223.236.99.39 or 192.168.1.0/24"
                value={newIpInput}
                onChange={(e) => setNewIpInput(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={handleAddIp} leftIcon={<Plus className="w-4 h-4" />}>
                Add Range
              </Button>
            </div>

            <div className="space-y-1.5">
              {ipRanges.map((range, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                >
                  <span className="font-mono font-semibold text-slate-800">{range}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIp(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mandatory Reason for Change */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason for Policy Modification (Required for Audit Trail)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g., Added new office Wi-Fi subnet, ISP rotated IP address..."
              className="block w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="primary"
              isLoading={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              Save Network Security Policy
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
