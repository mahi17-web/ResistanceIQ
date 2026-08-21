import { useState, useEffect } from 'react';
import {
  Plus, Download, Loader2, Search, FileText,
  FileBadge, FileSpreadsheet, Clock,
} from 'lucide-react';
import { getReports, generateReport, downloadReport, getProjects, ensureAuthenticated } from '../api/client.js';
import useProjectStore from '../store/projectStore.js';

/* ─── Report row — no card box ──────────────────────────────────── */
function ReportRow({ report, onDownloadError }) {
  const isPDF = report.format === 'PDF';
  const [downloading, setDownloading] = useState(false);
  const addNotification = useProjectStore((s) => s.addNotification);

  async function handleDownload() {
    try {
      setDownloading(true);
      addNotification({ type: 'info', message: 'Downloading report...', detail: report.file_name });
      await downloadReport(report.id);
      addNotification({ type: 'success', message: 'Report downloaded', detail: report.file_name });
    } catch (err) {
      console.error('Failed to download report:', err);
      addNotification({ type: 'error', message: 'Download failed', detail: err.message });
      if (onDownloadError) onDownloadError(err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto auto',
        alignItems: 'center',
        gap: 24,
        padding: '22px 0',
        borderBottom: '1px solid var(--line-soft)',
        transition: 'background 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {/* Name */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, minWidth: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: isPDF ? 'rgba(139,140,248,0.1)' : 'rgba(243,177,77,0.1)',
          border: `1px solid ${isPDF ? 'rgba(139,140,248,0.2)' : 'rgba(243,177,77,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isPDF
            ? <FileBadge size={16} color="var(--violet)" />
            : <FileSpreadsheet size={16} color="var(--risk-mod)" />
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>{report.file_name}</p>
          <p style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 3 }}>{report.project_name} · {report.size_kb} KB</p>
        </div>
      </div>

      {/* Format */}
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: isPDF ? 'var(--violet)' : 'var(--risk-mod)',
        padding: '4px 10px', borderRadius: 5,
        background: isPDF ? 'rgba(139,140,248,0.1)' : 'rgba(243,177,77,0.1)',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        {report.format}
      </span>

      {/* Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-4)', fontSize: 12 }}>
        <Clock size={11} />
        {report.created_at}
      </div>

      {/* Download */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="btn btn-ghost"
        style={{ height: 34, padding: '0 14px', fontSize: 12, opacity: downloading ? 0.6 : 1 }}
      >
        {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
        {downloading ? 'Downloading...' : 'Download'}
      </button>
    </div>
  );
}

/* ─── Reports ────────────────────────────────────────────────────── */
export default function Reports() {
  const addNotification = useProjectStore((s) => s.addNotification);
  const [reports, setReports]         = useState([]);
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [generating, setGenerating]   = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [selProject, setSelProject]   = useState('');
  const [selFormat, setSelFormat]     = useState('PDF');
  const [filterFmt, setFilterFmt]     = useState('All');
  const [searchQ, setSearchQ]         = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        await ensureAuthenticated();
        const [r, p] = await Promise.all([getReports(), getProjects()]);
        setReports(r || []);
        setProjects(p || []);
        if (p && p.length > 0) setSelProject(p[0].id);
      } catch (err) {
        console.error('Failed to load reports', err);
        setReports([]);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleGenerate() {
    if (!selProject) return;
    setGenerating(true);
    setShowModal(false);
    addNotification({ type: 'info', message: 'Generating report…' });
    const report = await generateReport(selProject, selFormat);
    setReports((prev) => [report, ...prev]);
    setGenerating(false);
    addNotification({ type: 'success', message: 'Report ready', detail: report.file_name });
  }

  const filtered = reports.filter((r) => {
    const fOk = filterFmt === 'All' || r.format === filterFmt;
    const qOk = !searchQ || r.file_name.toLowerCase().includes(searchQ.toLowerCase()) || r.project_name.toLowerCase().includes(searchQ.toLowerCase());
    return fOk && qOk;
  });

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <div style={{ padding: '80px var(--page-px) 120px', maxWidth: 'var(--content-max)', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 64, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <p className="section-title" style={{ marginBottom: 12 }}>Outputs</p>
            <h1 className="display-lg">Reports</h1>
            <p className="body-md" style={{ marginTop: 16, maxWidth: 480 }}>
              Research outputs and resistance forecasts for R&D decision-making.
            </p>
          </div>
          <button
            id="generate-report-btn"
            className="btn btn-primary btn-cta"
            onClick={() => setShowModal(true)}
            disabled={generating}
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {generating ? 'Generating…' : 'Generate Report'}
          </button>
        </div>

        {/* Stats — inline, no cards */}
        <div style={{ display: 'flex', gap: 48, marginBottom: 64, borderBottom: '1px solid var(--line-soft)', paddingBottom: 40 }}>
          {[
            { v: reports.length, l: 'Total reports' },
            { v: reports.filter((r) => r.format === 'PDF').length, l: 'PDF reports' },
            { v: reports.filter((r) => r.format === 'CSV').length, l: 'CSV exports' },
          ].map(({ v, l }) => (
            <div key={l}>
              <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1 }}>{v}</p>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-4)', marginTop: 6 }}>{l}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          {/* Format filter */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--elevated)', border: '1px solid var(--line)', borderRadius: 8, padding: 3 }}>
            {['All', 'PDF', 'CSV'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterFmt(f)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: filterFmt === f ? 'rgba(11,223,160,0.1)' : 'transparent',
                  color: filterFmt === f ? 'var(--teal)' : 'var(--ink-4)',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--elevated)', border: '1px solid var(--line)',
            borderRadius: 8, padding: '7px 14px', flex: '1', maxWidth: 320,
          }}>
            <Search size={13} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
            <input
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit', width: '100%' }}
              placeholder="Search reports…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
          </div>
        </div>

        {/* Report list header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto auto',
          gap: 24,
          padding: '12px 0',
          borderBottom: '1px solid var(--line)',
          marginBottom: 0,
        }}>
          {['Report', 'Format', 'Date', ''].map((h) => (
            <p key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-5)' }}>{h}</p>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--ink-4)', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <FileText size={40} style={{ color: 'var(--ink-5)', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 8 }}>No reports found</p>
            <p style={{ fontSize: 14, color: 'var(--ink-4)', marginBottom: 24 }}>
              {reports.length === 0 ? 'Generate your first report.' : 'Try changing the filter.'}
            </p>
            {reports.length === 0 && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={14} /> Generate Report
              </button>
            )}
          </div>
        ) : (
          filtered.map((r, i) => <ReportRow key={r.id} report={r} index={i} />)
        )}

        {/* Generate modal */}
        {showModal && (
          <div
            className="modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <div className="modal-panel">
              <div className="modal-head">
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Generate Report</p>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', padding: 4, borderRadius: 6 }}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="field-group" style={{ marginBottom: 20 }}>
                  <label className="field-label" htmlFor="rp-project">Project</label>
                  <select id="rp-project" className="field" value={selProject} onChange={(e) => setSelProject(e.target.value)}>
                    <option value="">— Select project —</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Format</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['PDF', 'CSV'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setSelFormat(f)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: 8,
                          border: selFormat === f ? '1px solid rgba(11,223,160,0.4)' : '1px solid var(--line)',
                          background: selFormat === f ? 'rgba(11,223,160,0.08)' : 'transparent',
                          color: selFormat === f ? 'var(--teal)' : 'var(--ink-3)',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s',
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="confirm-generate" className="btn btn-primary" onClick={handleGenerate} disabled={!selProject}>
                  Generate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
