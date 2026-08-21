import { fetchJSON } from './auth.ts';
import { SystemHealth, DashboardSummary } from './types.ts';

export const systemApi = {
  getHealth: () => fetchJSON<SystemHealth>('/system/health'),

  getDashboardSummary: () => fetchJSON<DashboardSummary>('/dashboard/summary'),

  getActivity: () => fetchJSON<any[]>('/dashboard/activity'),
};
