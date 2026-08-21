import { useState, useEffect } from 'react';
import { User, Building, Mail, Shield, Calendar, Clock, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import useProjectStore from '../store/projectStore.js';
import { updateProfile } from '../api/client.js';

export default function Profile() {
  const user = useProjectStore((s) => s.user);
  const setUser = useProjectStore((s) => s.setUser);
  const org = useProjectStore((s) => s.org);
  const addNotification = useProjectStore((s) => s.addNotification);

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [displayName, setDisplayName] = useState(user?.display_name || user?.full_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      // Synchronize input fields when user object changes
      const timer = setTimeout(() => {
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
        setDisplayName(user.display_name || user.full_name || '');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const updated = await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        display_name: displayName.trim(),
      });
      setUser(updated);
      setSuccessMsg('Profile updated successfully.');
      addNotification({
        title: 'Profile Updated',
        message: 'Your personal account profile details were saved.',
        type: 'success',
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading user profile...
      </div>
    );
  }

  const initials = user.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex items-center gap-5 border-b border-white/10 pb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold text-black shrink-0"
          style={{ background: 'linear-gradient(135deg, #0BDFA0, #8B8CF8)' }}
        >
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{user.full_name || user.email}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Building size={13} /> {org?.name || 'Enterprise Workspace'}</span>
            <span className="flex items-center gap-1.5"><Mail size={13} /> {user.email}</span>
          </p>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div
            className="p-6 rounded-xl border space-y-4"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-emerald-400" />
              Personal Information
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Display Name (Scientific Papers / Audit)</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Corporate Email Address (Read-Only)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-400 cursor-not-allowed"
                  />
                  {user.email_verified || user.is_verified ? (
                    <span className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap flex items-center gap-1">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  ) : (
                    <span className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 whitespace-nowrap">
                      Unverified
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-400 text-black hover:bg-emerald-300 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Metadata Sidebar */}
        <div className="space-y-6">
          <div
            className="p-6 rounded-xl border space-y-4 text-xs"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <h2 className="font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield size={14} className="text-emerald-400" />
              Account Metadata
            </h2>

            <div className="space-y-3 pt-1 text-slate-300">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">User Identifier</p>
                <p className="font-mono text-[11px] text-slate-400 truncate mt-0.5">{user.id}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Tenant Organization</p>
                <p className="font-medium text-white mt-0.5">{org?.name || 'Bindwell BioSciences'}</p>
                <p className="font-mono text-[10px] text-slate-500">{user.organization_id}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Role & Permissions</p>
                <p className="font-semibold text-emerald-400 mt-0.5 uppercase">{user.role}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Member Since</p>
                <p className="text-slate-300 mt-0.5 flex items-center gap-1.5">
                  <Calendar size={12} />
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Last Login</p>
                <p className="text-slate-300 mt-0.5 flex items-center gap-1.5">
                  <Clock size={12} />
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Just now'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
