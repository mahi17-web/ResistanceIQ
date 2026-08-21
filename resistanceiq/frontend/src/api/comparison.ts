import { fetchJSON } from './auth.ts';
import { Forecast } from './types.ts';

export const comparisonApi = {
  getForecastsForComparison: (forecastIds?: string[]) => {
    const query = forecastIds && forecastIds.length > 0 ? `?ids=${forecastIds.join(',')}` : '';
    return fetchJSON<Forecast[]>(`/forecasts${query}`);
  },
};
