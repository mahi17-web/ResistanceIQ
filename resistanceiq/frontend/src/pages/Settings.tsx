import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Users,
  Key,
  Cpu,
  Plus,
  Trash2,
  Copy,
  Check,
  X,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { api } from '../api/client.ts';
import { useToast } from '../context/ToastContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();

  // State for forms & modals
  const [orgName, setOrgName] = useState('');
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('ANALYST');

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Queries
  const { data: org } = useQuery({ queryKey: ['settings-org'], queryFn: api.getOrganization });
  const { data: team } = useQuery({ queryKey: ['settings-team'], queryFn: api.getTeamMembers });
  const { data: apiKeys } = useQuery({ queryKey: ['settings-keys'], queryFn: api.getApiKeys });
  const { data: models } = useQuery({ queryKey: ['models'], queryFn: api.getAvailableModels });

  const activeModel = models?.[0]?.version || 'v1.0.0-ridge-ecfp4';
  const activeModelStatus = models?.[0]?.status || 'DEVELOPMENT ONLY';

  // Mutations
  const updateOrgMutation = useMutation({
    mutationFn: (name: string) => api.updateOrganization({ name }),
    onSuccess: (updated) => {
      showToast(`Organization updated to "${updated.name}"`, 'success', 'Saved');
      queryClient.invalidateQueries({ queryKey: ['settings-org'] });
      setIsEditingOrg(false);
    },
    onError: (err: any) => showToast(err.message || 'Failed to update organization.', 'error', 'Error'),
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.inviteTeamMember({ email: inviteEmail, full_name: inviteName, role: inviteRole }),
    onSuccess: () => {
      showToast(`Invited ${inviteName} to the workspace`, 'success', 'Member Added');
      queryClient.invalidateQueries({ queryKey: ['settings-team'] });
      setInviteEmail('');
      setInviteName('');
      setIsInviteOpen(false);
    },
    onError: (err: any) => showToast(err.message || 'Failed to invite member.', 'error', 'Error'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (id: string) => api.removeTeamMember(id),
    onSuccess: () => {
      showToast('Team member removed', 'info', 'Removed');
      queryClient.invalidateQueries({ queryKey: ['settings-team'] });
    },
    onError: (err: any) => showToast(err.message || 'Failed to remove member.', 'error', 'Error'),
  });

  const createKeyMutation = useMutation({
    mutationFn: (name: string) => api.createApiKey(name),
    onSuccess: (data) => {
      setCreatedSecret(data.secret);
      queryClient.invalidateQueries({ queryKey: ['settings-keys'] });
      showToast('API Key generated successfully', 'success', 'Key Created');
    },
    onError: (err: any) => showToast(err.message || 'Failed to generate key.', 'error', 'Error'),
  });

  const revokeKeyMutation = useMutation({
    mutationFn: (id: string) => api.revokeApiKey(id),
    onSuccess: () => {
      showToast('API Key revoked', 'info', 'Revoked');
      queryClient.invalidateQueries({ queryKey: ['settings-keys'] });
    },
    onError: (err: any) => showToast(err.message || 'Failed to revoke key.', 'error', 'Error'),
  });

  const handleCopySecret = () => {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Secret copied to clipboard', 'info');
    }
  };

  return (
    <div className="page-wrap py-12">
      <div className="mb-12">
        <span className="section-title">Platform Configuration</span>
        <h1 className="display-md mt-2">Workspace & Intelligence Settings</h1>
      </div>

      <div className="space-y-12 max-w-3xl">
        {/* 1. Organization Card */}
        <div className="p-8 rounded-xl bg-[#0B1017] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Building2 size={20} className="text-[#0BDFA0]" />
              <h2 className="text-lg font-semibold">Organization Profile</h2>
            </div>
            {!isEditingOrg && (
              <button
                onClick={() => {
                  setOrgName(org?.name || '');
                  setIsEditingOrg(true);
                }}
                className="btn btn-ghost text-xs"
              >
                Edit
              </button>
            )}
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-mono text-[#7C8A9A] uppercase tracking-wider mb-1">
                Organization Name
              </label>
              {isEditingOrg ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#0BDFA0]"
                  />
                  <button
                    onClick={() => updateOrgMutation.mutate(orgName)}
                    disabled={updateOrgMutation.isPending}
                    className="btn btn-primary text-xs"
                  >
                    Save
                  </button>
                  <button onClick={() => setIsEditingOrg(false)} className="btn btn-ghost text-xs">
                    Cancel
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  readOnly
                  value={org?.name || 'Bindwell BioSciences'}
                  className="w-full h-11 px-4 rounded-lg bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] font-mono"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="text-xs text-[#7C8A9A]">Plan Tier</div>
                <div className="font-mono font-bold text-[#0BDFA0] mt-1">{org?.plan_tier || 'ENTERPRISE_PRO'}</div>
              </div>
              <div>
                <div className="text-xs text-[#7C8A9A]">Workspace Slug</div>
                <div className="font-mono text-[#9AACBE] mt-1">{org?.slug || 'bindwell-bio'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Team Members Card */}
        <div className="p-8 rounded-xl bg-[#0B1017] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users size={20} className="text-[#8B8CF8]" />
              <h2 className="text-lg font-semibold">Scientific Team Roster</h2>
            </div>
            <button
              onClick={() => setIsInviteOpen(true)}
              className="btn btn-secondary text-xs flex items-center gap-1.5"
            >
              <UserPlus size={14} />
              <span>Invite Member</span>
            </button>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {team?.map((u) => (
              <div key={u.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#F1F5F9]">{u.full_name}</div>
                  <div className="text-xs font-mono text-[#7C8A9A]">{u.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-[#0BDFA0]">
                    {u.role}
                  </span>
                  {user?.id !== u.id && (
                    <button
                      onClick={() => removeMemberMutation.mutate(u.id)}
                      className="text-[#7C8A9A] hover:text-[#E85D7A] transition-colors p-1"
                      title="Remove Member"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. API Keys Card */}
        <div className="p-8 rounded-xl bg-[#0B1017] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Key size={20} className="text-[#0BDFA0]" />
              <h2 className="text-lg font-semibold">Programmatic API Access</h2>
            </div>
            <button
              onClick={() => {
                setKeyName('');
                setCreatedSecret(null);
                setIsApiKeyModalOpen(true);
              }}
              className="btn btn-secondary text-xs flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Generate Key</span>
            </button>
          </div>

          {apiKeys && apiKeys.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
              {apiKeys.map((k) => (
                <div key={k.id} className="py-3.5 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="text-sm font-sans font-semibold text-[#F1F5F9]">{k.name}</div>
                    <div className="text-[#7C8A9A] mt-0.5">{k.key_prefix}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#4E6078]">
                      {new Date(k.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => revokeKeyMutation.mutate(k.id)}
                      className="text-[#7C8A9A] hover:text-[#E85D7A] transition-colors p-1"
                      title="Revoke Key"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#7C8A9A] py-2">
              No API keys generated. Create a key to access the ResistanceIQ REST API.
            </div>
          )}
        </div>

        {/* 4. ML Engine Card */}
        <div className="p-8 rounded-xl bg-[#0B1017] border border-white/[0.06]">
          <div className="flex items-center gap-3 mb-6">
            <Cpu size={20} className="text-[#F3B14D]" />
            <h2 className="text-lg font-semibold">ML Engine & Inference Bridge</h2>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-2 border-b border-white/[0.04]">
              <span className="text-[#7C8A9A]">Active Model Version</span>
              <span className="text-[#0BDFA0] font-bold">{activeModel}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/[0.04]">
              <span className="text-[#7C8A9A]">Validation Gate Status</span>
              <span className="text-[#F3B14D] font-bold">{activeModelStatus}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/[0.04]">
              <span className="text-[#7C8A9A]">Docking Conformation Model</span>
              <span className="text-[#F1F5F9]">AutoDock Vina / ESMFold</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/[0.04]">
              <span className="text-[#7C8A9A]">Population Genetics Simulation</span>
              <span className="text-[#F1F5F9]">Wright-Fisher Stochastic (N=10^7)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0B1017] border border-white/[0.08] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#F1F5F9]">Invite Team Member</h3>
              <button onClick={() => setIsInviteOpen(false)} className="text-[#7C8A9A] hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-mono text-[#7C8A9A] mb-1">Full Name</label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Dr. Jane Smith"
                className="w-full h-10 px-3 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm text-[#F1F5F9]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#7C8A9A] mb-1">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="jane@bindwell.bio"
                className="w-full h-10 px-3 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm text-[#F1F5F9]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#7C8A9A] mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm text-[#F1F5F9]"
              >
                <option value="ANALYST">Analyst (Full ML and Candidate access)</option>
                <option value="ADMIN">Admin (Full Workspace Management)</option>
                <option value="VIEWER">Viewer (Read-only)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsInviteOpen(false)} className="btn btn-ghost text-xs">
                Cancel
              </button>
              <button
                onClick={() => inviteMutation.mutate()}
                disabled={inviteMutation.isPending || !inviteEmail || !inviteName}
                className="btn btn-primary text-xs"
              >
                {inviteMutation.isPending ? 'Inviting...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Creation Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0B1017] border border-white/[0.08] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#F1F5F9]">Generate API Key</h3>
              <button onClick={() => setIsApiKeyModalOpen(false)} className="text-[#7C8A9A] hover:text-white">
                <X size={16} />
              </button>
            </div>

            {createdSecret ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#0BDFA0]/10 border border-[#0BDFA0]/30 text-xs text-[#0BDFA0]">
                  Copy your secret key now. For security purposes, it will never be displayed again.
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdSecret}
                    className="w-full h-10 px-3 rounded-lg bg-[#05070B] border border-white/[0.1] font-mono text-xs text-[#F1F5F9]"
                  />
                  <button onClick={handleCopySecret} className="btn btn-secondary text-xs px-3">
                    {copied ? <Check size={14} className="text-[#0BDFA0]" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={() => setIsApiKeyModalOpen(false)} className="btn btn-primary text-xs">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#7C8A9A] mb-1">Key Label</label>
                  <input
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. CI/CD Screening Pipeline"
                    className="w-full h-10 px-3 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm text-[#F1F5F9]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setIsApiKeyModalOpen(false)} className="btn btn-ghost text-xs">
                    Cancel
                  </button>
                  <button
                    onClick={() => createKeyMutation.mutate(keyName || 'Default Key')}
                    disabled={createKeyMutation.isPending}
                    className="btn btn-primary text-xs"
                  >
                    {createKeyMutation.isPending ? 'Generating...' : 'Generate Secret'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
