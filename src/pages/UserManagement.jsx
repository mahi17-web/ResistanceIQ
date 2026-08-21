import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, CheckCircle2, AlertCircle, Trash2, Ban, RefreshCw, Mail } from 'lucide-react';
import useProjectStore from '../store/projectStore.js';
import {
  getUsers,
  inviteUser,
  updateUserRole,
  deactivateUser,
  reactivateUser,
  removeUser,
} from '../api/client.js';

export default function UserManagement() {
  const currentUser = useProjectStore((s) => s.user);
  const addNotification = useProjectStore((s) => s.addNotification);

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('RESEARCHER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load organization team members.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getUsers();
        if (active) setUsers(data);
      } catch (err) {
        if (active) setErrorMsg(err.message || 'Failed to load organization team members.');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    setInviteLoading(true);
    setErrorMsg('');
    try {
      await inviteUser({
        email: inviteEmail.trim(),
        full_name: inviteName.trim(),
        role: inviteRole,
      });
      setInviteSuccess(`Invitation dispatched for ${inviteEmail.trim()}`);
      addNotification({
        title: 'Team Member Invited',
        message: `Invitation issued for ${inviteEmail.trim()}`,
        type: 'success',
      });
      setInviteEmail('');
      setInviteName('');
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to invite team member.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      addNotification({
        title: 'Role Updated',
        message: `User permissions updated to ${newRole}`,
        type: 'success',
      });
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update user role.');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.is_active) {
        await deactivateUser(user.id);
        addNotification({
          title: 'User Deactivated',
          message: `${user.email} account access has been suspended.`,
          type: 'warning',
        });
      } else {
        await reactivateUser(user.id);
        addNotification({
          title: 'User Reactivated',
          message: `${user.email} account access has been restored.`,
          type: 'success',
        });
      }
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update user status.');
    }
  };

  const handleRemove = async (user) => {
    if (!window.confirm(`Are you sure you want to remove ${user.email} from the organization?`)) {
      return;
    }
    try {
      await removeUser(user.id);
      addNotification({
        title: 'User Removed',
        message: `${user.email} removed from organization.`,
        type: 'info',
      });
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to remove user.');
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users size={26} className="text-emerald-400" />
            Team & User Access Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage organization members, assign RBAC roles, and control access permissions
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setInviteOpen(true);
              setInviteSuccess('');
              setErrorMsg('');
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-400 text-black hover:bg-emerald-300 transition-colors flex items-center gap-2"
          >
            <UserPlus size={15} />
            <span>Invite Team Member</span>
          </button>
        )}
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            Active Workspace Roster ({users.length})
          </span>
          <button
            onClick={fetchUsers}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Refresh team members"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 bg-white/[0.01]">
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Last Login</th>
                <th className="py-3 px-4 font-semibold">Created</th>
                {isAdmin && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading team members...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No team members found in this organization.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const initials = u.full_name
                    ? u.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'U';

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-black shrink-0"
                            style={{ background: 'linear-gradient(135deg, #0BDFA0, #8B8CF8)' }}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-white flex items-center gap-1.5">
                              {u.full_name || u.display_name || u.email}
                              {isSelf && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isAdmin && !isSelf ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="px-2 py-1 rounded bg-black/40 border border-white/10 text-emerald-400 font-semibold uppercase text-[11px] focus:outline-none"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="RESEARCHER">RESEARCHER</option>
                            <option value="ANALYST">ANALYST</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                        ) : (
                          <span className="font-semibold text-emerald-400 uppercase text-[11px]">
                            {u.role}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Suspended
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>

                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          {!isSelf && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleActive(u)}
                                title={u.is_active ? 'Deactivate user' : 'Reactivate user'}
                                className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                              >
                                <Ban size={14} className={u.is_active ? 'text-yellow-400' : 'text-emerald-400'} />
                              </button>
                              <button
                                onClick={() => handleRemove(u)}
                                title="Remove user from organization"
                                className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="w-full max-w-md p-6 rounded-2xl border"
            style={{
              background: '#090e1a',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <UserPlus size={18} className="text-emerald-400" />
              Invite Team Member
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a new researcher or analyst to your enterprise organization.
            </p>

            {inviteSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2 mb-4">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span>{inviteSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Samantha Chen"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    placeholder="schen@organization.bio"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Assigned Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 text-emerald-400 font-semibold"
                  >
                    <option value="ADMIN">ADMIN — Full Workspace & User Management</option>
                    <option value="RESEARCHER">RESEARCHER — Projects, Forecasts & Reports</option>
                    <option value="ANALYST">ANALYST — Forecast Execution & Analysis</option>
                    <option value="VIEWER">VIEWER — Read-Only Access</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50"
                  >
                    {inviteLoading ? 'Issuing Invite...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            )}

            {inviteSuccess && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-black bg-emerald-400"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
