import { fetchJSON } from './auth.ts';
import { BacktestAccuracySummary } from './types.ts';

export const backtestsApi = {
  getBacktestSummary: () => fetchJSON<BacktestAccuracySummary>('/backtests'),
};
