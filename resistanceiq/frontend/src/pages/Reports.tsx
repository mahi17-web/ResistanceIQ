import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Download, FileSpreadsheet, Plus, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api/client.ts';
import { ReportFormat } from '../api/types.ts';
import { useToast } from '../context/ToastContext.tsx';

export const ReportsPage: React.FC = () => {
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('PDF');
  const [generationStep, setGenerationStep] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: reports, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reports-list'],
    queryFn: () => api.getReports(),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      setGenerationStep('Preparing report parameters...');
      await new Promise((r) => setTimeout(r, 400));
      setGenerationStep('Generating scientific dossier...');
      const rep = await api.generateReport({
        project_id: selectedProjectId || (projects && projects[0]?.id) || '',
        format: selectedFormat,
      });
      setGenerationStep('Report completed.');
      return rep;
    },
    onSuccess: (data) => {
      showToast(`Dossier "${data.file_name}" generated successfully.`, 'success', 'Report Ready');
      queryClient.invalidateQueries({ queryKey: ['reports-list'] });
      setTimeout(() => {
        setGenerationStep(null);
        setIsGenerateOpen(false);
      }, 500);
    },
    onError: (err: any) => {
      setGenerationStep(null);
      showToast(err.message || 'Report generation failed.', 'error', 'Error');
    },
  });

  const handleDownload = (fileName: string) => {
    // Generate simple blob export
    const blob = new Blob([`ResistanceIQ Scientific Dossier: ${fileName}\nExport Date: ${new Date().toISOString()}`], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloading ${fileName}`, 'info', 'Download Started');
  };

  return (
    <div className="page-wrap py-12">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="section-title">Research Archives</span>
          <h1 className="display-md mt-2">Generated Dossiers & Export Library</h1>
          <p className="text-sm text-[#9AACBE] mt-1 max-w-xl">
            Exported scientific reports, molecular docking conformations, and candidate resistance assessments.
          </p>
        </div>

        <button
          onClick={() => setIsGenerateOpen(true)}
          className="btn btn-primary text-xs flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Generate New Dossier</span>
        </button>
      </div>

      {isError && (
        <div className="mb-8 p-4 rounded-xl bg-[#E85D7A]/10 border border-[#E85D7A]/30 flex items-center justify-between text-xs text-[#E85D7A]">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{(error as Error)?.message || 'Unable to load report archives.'}</span>
          </div>
          <button onClick={() => refetch()} className="underline hover:text-white">
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="py-5 flex items-center justify-between hover:bg-white/[0.02] px-4 -mx-4 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center text-[#0BDFA0]">
                  {rep.format === 'PDF' ? <FileText size={20} /> : <FileSpreadsheet size={20} />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F1F5F9] group-hover:text-[#0BDFA0] transition-colors">
                    {rep.file_name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-[#7C8A9A] mt-0.5">
                    <span>{rep.format}</span>
                    <span>•</span>
                    <span>{rep.size_kb} KB</span>
                    <span>•</span>
                    <span>{new Date(rep.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDownload(rep.file_name)}
                className="btn btn-ghost text-xs flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <FileText className="mx-auto mb-3 text-[#4E6078]" size={32} />
          <p className="text-[#9AACBE] mb-2 font-medium">No dossiers generated yet.</p>
          <p className="text-xs text-[#7C8A9A] mb-6">Compile a structured PDF or CSV dossier from your candidate forecasts.</p>
          <button onClick={() => setIsGenerateOpen(true)} className="btn btn-secondary text-xs">
            Generate First Dossier
          </button>
        </div>
      )}

      {/* Generate Report Modal */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0B1017] border border-white/[0.08] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0BDFA0]/10 flex items-center justify-center text-[#0BDFA0]">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-lg font-semibold text-[#F1F5F9]">Export Intelligence Dossier</h2>
              </div>
              <button
                onClick={() => !generateMutation.isPending && setIsGenerateOpen(false)}
                className="text-[#7C8A9A] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#7C8A9A] uppercase tracking-wider mb-2">
                  Target Research Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full h-11 px-4 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#0BDFA0]"
                >
                  {projects?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#7C8A9A] uppercase tracking-wider mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('PDF')}
                    className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-center gap-2 ${
                      selectedFormat === 'PDF'
                        ? 'bg-[#0BDFA0]/10 border-[#0BDFA0] text-[#0BDFA0]'
                        : 'bg-[#05070B] border-white/[0.08] text-[#7C8A9A]'
                    }`}
                  >
                    <FileText size={16} /> PDF Dossier
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('CSV')}
                    className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-center gap-2 ${
                      selectedFormat === 'CSV'
                        ? 'bg-[#0BDFA0]/10 border-[#0BDFA0] text-[#0BDFA0]'
                        : 'bg-[#05070B] border-white/[0.08] text-[#7C8A9A]'
                    }`}
                  >
                    <FileSpreadsheet size={16} /> CSV Spreadsheet
                  </button>
                </div>
              </div>

              {generationStep && (
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs font-mono text-[#0BDFA0] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#0BDFA0] animate-ping" />
                  <span>{generationStep}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.04]">
                <button
                  type="button"
                  disabled={generateMutation.isPending}
                  onClick={() => setIsGenerateOpen(false)}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={generateMutation.isPending}
                  onClick={() => generateMutation.mutate()}
                  className="btn btn-primary text-xs"
                >
                  {generateMutation.isPending ? 'Generating Dossier...' : 'Generate & Export'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
