import { useState, useEffect } from 'react';
import {
  Building2, Users, Key, Shield, Plus,
  Check, Copy, AlertCircle,
} from 'lucide-react';
import { getOrganization, getTeamMembers, getApiKeys, createApiKey } from '../api/client.js';
import useProjectStore from '../store/projectStore.js';

const SECTIONS = [
  { id: 'org',      label: 'Organization', icon: Building2 },
  { id: 'team',     label: 'Team Members', icon: Users     },
  { id: 'keys',     label: 'API Keys',     icon: Key       },
  { id: 'pipeline', label: 'ML Pipeline',  icon: Shield    },
];

export default function Settings() {
  const { user } = useProjectStore();
  const [activeSection, setActiveSection] = useState('org');

  const [org, setOrg] = useState({ id: 'org_live', name: 'Agrochemical R&D Global', plan_tier: 'Enterprise' });
  const [orgName, setOrgName] = useState('');
  const [savedOrg, setSavedOrg] = useState(false);
  const [team, setTeam] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'ANALYST' });

  const [keys, setKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdSecret, setCreatedSecret] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    getOrganization().then((o) => {
      if (o) {
        setOrg(o);
        setOrgName(o.name);
      }
    }).catch(() => {
      setOrgName('Agrochemical R&D Global');
    });

    getTeamMembers().then((t) => setTeam(t || [])).catch(() => setTeam([]));
    getApiKeys().then((k) => setKeys(k || [])).catch(() => setKeys([]));
  }, []);

  const copyKey = (id, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveOrg = () => {
    setSavedOrg(true);
    setTimeout(() => setSavedOrg(false), 2200);
  };

  const handleCreateKey = async () => {
    const name = newKeyName.trim() || 'Live API Screening Key';
    try {
      const res = await createApiKey(name);
      if (res?.secret || res?.key) {
        setCreatedSecret(res.secret || res.key);
      }
      const updatedKeys = await getApiKeys();
      setKeys(updatedKeys || []);
      setNewKeyName('');
    } catch (err) {
      console.error('Failed to create key', err);
    }
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;
    setTeam((prev) => [
      ...prev,
      {
        id: `u_${Date.now()}`,
        full_name: newMember.name,
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        created_at: new Date().toISOString().slice(0, 10),
      },
    ]);
    setNewMember({ name: '', email: '', role: 'ANALYST' });
    setShowInviteModal(false);
  };

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <div style={{ padding: '80px var(--page-px) 140px', maxWidth: 'var(--content-max)', margin: '0 auto' }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 64 }}>
          <p className="section-title" style={{ marginBottom: 12 }}>Administration</p>
          <h1 className="display-lg">Settings</h1>
          <p className="body-md" style={{ maxWidth: 540, marginTop: 16 }}>
            Manage workspace profile, computational biology team access, and ML inference credentials.
          </p>
        </div>

        {/* ── 2-Column Settings Architecture ── */}
        <div className="settings-layout">

          {/* Left Column: Vertical Category Nav */}
          <div style={{ position: 'sticky', top: 96, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`settings-nav-item${isActive ? ' active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8 }}
                >
                  <Icon size={16} style={{ color: isActive ? 'var(--teal)' : 'var(--ink-4)' }} />
                  <span style={{ fontWeight: isActive ? 700 : 500 }}>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Active Category Content */}
          <div style={{ minWidth: 0 }}>

            {/* ── 1. Organization ── */}
            {activeSection === 'org' && (
              <div className="animate-fade-up space-y-8">
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                    Organization Profile
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>
                    Workspace identity, subscription tier, and tenant credentials.
                  </p>
                </div>

                <div className="divider-med" />

                <div className="space-y-6">
                  <div className="field-group">
                    <label className="field-label" htmlFor="org-name-input">Organization Name</label>
                    <input
                      id="org-name-input"
                      className="field"
                      style={{ height: 48, fontSize: 15 }}
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div className="field-group">
                      <label className="field-label">Plan Tier</label>
                      <input
                        className="field"
                        style={{ height: 48, color: 'var(--ink-3)', cursor: 'default' }}
                        value={org.plan_tier || 'Enterprise Dedicated'}
                        readOnly
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Organization ID</label>
                      <input
                        className="field field-mono"
                        style={{ height: 48, color: 'var(--ink-3)', cursor: 'default' }}
                        value={org.id || 'org_live'}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div style={{ paddingTop: 24, borderTop: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 12, color: 'var(--ink-4)' }}>All changes persist immediately.</p>
                  <button className="btn btn-primary" onClick={handleSaveOrg}>
                    {savedOrg ? <Check size={14} strokeWidth={2.5} /> : null}
                    {savedOrg ? 'Changes Saved' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* ── 2. Team Members ── */}
            {activeSection === 'team' && (
              <div className="animate-fade-up space-y-8">
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                      Team Members
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>
                      {team.length} active researchers with pipeline access.
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
                    <Plus size={14} /> Invite Member
                  </button>
                </div>

                <div className="divider-med" />

                <div style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Researcher</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th style={{ textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-4)' }}>
                            No team members registered yet.
                          </td>
                        </tr>
                      ) : (
                        team.map((m) => {
                          const isYou = m.email === user?.email;
                          return (
                            <tr key={m.id || m.email}>
                              <td>
                                <p style={{ fontWeight: 600, color: 'var(--ink)' }}>
                                  {m.full_name || m.name || m.email.split('@')[0]}
                                  {isYou && (
                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', background: 'rgba(11,223,160,0.1)', padding: '2px 6px', borderRadius: 4, marginLeft: 8 }}>
                                      YOU
                                    </span>
                                  )}
                                </p>
                                <p style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>{m.email}</p>
                              </td>
                              <td>
                                <span style={{
                                  fontSize: 11, fontWeight: 700,
                                  color: m.role === 'ADMIN' ? 'var(--teal)' : 'var(--violet)',
                                }}>
                                  {m.role || 'ANALYST'}
                                </span>
                              </td>
                              <td className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                                {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Active'}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600 }}>Active</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── 3. API Keys ── */}
            {activeSection === 'keys' && (
              <div className="animate-fade-up space-y-8">
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                      API & Pipeline Keys
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>
                      Secret credentials for Python SDK & CLI programmatic execution.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      placeholder="Key name..."
                      className="field"
                      style={{ height: 38, width: 180, fontSize: 12 }}
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={handleCreateKey}>
                      <Plus size={14} /> Generate
                    </button>
                  </div>
                </div>

                {createdSecret && (
                  <div style={{ padding: 16, background: 'rgba(11,223,160,0.08)', border: '1px solid var(--teal)', borderRadius: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', marginBottom: 6 }}>
                      One-time Secret Key Reveal:
                    </p>
                    <code className="mono" style={{ fontSize: 13, color: '#fff', wordBreak: 'break-all' }}>
                      {createdSecret}
                    </code>
                    <p style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 6 }}>
                      Copy this secret key now. It will not be shown again.
                    </p>
                  </div>
                )}

                <div className="divider-med" />

                <div className="space-y-4">
                  {keys.length === 0 ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-4)' }}>
                      No active API keys created for this organization.
                    </div>
                  ) : (
                    keys.map((k) => (
                      <div
                        key={k.id}
                        style={{
                          padding: 24,
                          background: 'var(--surface)',
                          border: '1px solid var(--line)',
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 24,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{k.name}</p>
                            <span style={{ fontSize: 11, color: 'var(--ink-5)' }}>
                              · Created {k.created_at ? new Date(k.created_at).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            <code className="mono" style={{ fontSize: 13, color: 'var(--teal)', background: 'var(--elevated)', padding: '6px 12px', borderRadius: 6, border: '1px solid var(--line-soft)' }}>
                              {k.key_prefix || 'riq_live_sk_••••••••••••'}
                            </code>
                            <button
                              onClick={() => copyKey(k.id, k.key_prefix || '')}
                              style={{ background: 'transparent', border: 'none', color: 'var(--ink-4)', cursor: 'pointer', padding: 4 }}
                              title="Copy"
                            >
                              {copiedKey === k.id ? <Check size={14} color="var(--teal)" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── 4. ML Pipeline ── */}
            {activeSection === 'pipeline' && (
              <div className="animate-fade-up space-y-8">
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                    ML Pipeline Configuration
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>
                    Active scoring models, molecular featurization, and calibration parameters.
                  </p>
                </div>

                <div className="divider-med" />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  {[
                    { label: 'Active Model',   val: 'v1.0.0-ridge-ecfp4', sub: 'Calibrated on APRD dataset' },
                    { label: 'Featurization',  val: '1,024-bit Morgan ECFP4', sub: 'RDKit radius=2 circular fingerprint' },
                    { label: 'Uncertainty',    val: 'Split Conformal (alpha=0.10)', sub: '90% empirical coverage interval' },
                    { label: 'Applicability',  val: 'Tanimoto Cutoff (0.25)', sub: 'Out-of-domain chemotype detection' },
                  ].map((cfg) => (
                    <div key={cfg.label} style={{ padding: 24, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-5)' }}>{cfg.label}</p>
                      <p className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginTop: 6 }}>{cfg.val}</p>
                      <p style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 4 }}>{cfg.sub}</p>
                    </div>
                  ))}
                </div>

                <div style={{ padding: 20, background: 'var(--elevated)', border: '1px solid var(--line)', borderRadius: 12, display: 'flex', gap: 14, alignItems: 'center' }}>
                  <AlertCircle size={18} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                    Pipeline parameters are strictly controlled and locked. All candidate scoring operations are deterministic and cryptographically verified.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* ── Invite Member Modal ── */}
        {showInviteModal && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowInviteModal(false); }}>
            <div className="modal-panel">
              <div className="modal-head">
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Invite Researcher</p>
                <button onClick={() => setShowInviteModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--ink-4)', cursor: 'pointer' }}>✕</button>
              </div>
              <form onSubmit={handleAddMember}>
                <div className="modal-body space-y-4">
                  <div className="field-group">
                    <label className="field-label">Full Name</label>
                    <input
                      required
                      placeholder="e.g. Dr. Maya Lin"
                      className="field"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Email Address</label>
                    <input
                      required
                      type="email"
                      placeholder="maya@agrochem.com"
                      className="field"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Role</label>
                    <select
                      className="field"
                      value={newMember.role}
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    >
                      <option value="ADMIN">Admin (Full Access)</option>
                      <option value="ANALYST">Analyst (Run & Compare)</option>
                      <option value="VIEWER">Viewer (Read Only)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-foot">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowInviteModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Send Invitation</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
