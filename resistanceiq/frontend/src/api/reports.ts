import { fetchJSON } from './auth.ts';
import { Report, ReportFormat } from './types.ts';

export const reportsApi = {
  getReports: (projectId?: string) =>
    fetchJSON<Report[]>(`/reports${projectId ? `?project_id=${projectId}` : ''}`),

  generateReport: (data: { project_id: string; format: ReportFormat }) =>
    fetchJSON<Report>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
