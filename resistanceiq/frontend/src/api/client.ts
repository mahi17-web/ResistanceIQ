import { authApi, fetchJSON } from './auth.ts';
import { projectsApi } from './projects.ts';
import { candidatesApi } from './candidates.ts';
import { forecastsApi } from './forecasts.ts';
import { comparisonApi } from './comparison.ts';
import { backtestsApi } from './backtests.ts';
import { reportsApi } from './reports.ts';
import { settingsApi } from './settings.ts';
import { systemApi } from './system.ts';

export * from './types.ts';
export * from './auth.ts';
export * from './projects.ts';
export * from './candidates.ts';
export * from './forecasts.ts';
export * from './comparison.ts';
export * from './backtests.ts';
export * from './reports.ts';
export * from './settings.ts';
export * from './system.ts';

export const api = {
  // Auth
  ...authApi,

  // System & Dashboard
  ...systemApi,

  // Projects
  ...projectsApi,

  // Candidates & Target / Pest Catalog
  ...candidatesApi,

  // Forecasts & ML Models
  ...forecastsApi,

  // Comparison
  ...comparisonApi,

  // Backtests
  ...backtestsApi,

  // Reports
  ...reportsApi,

  // Settings
  ...settingsApi,
};
