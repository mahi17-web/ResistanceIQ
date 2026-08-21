import { fetchJSON } from './auth.ts';
import { Forecast, PredictionResult, ModelInfo } from './types.ts';

export const forecastsApi = {
  getForecasts: (projectId?: string) =>
    fetchJSON<Forecast[]>(`/forecasts${projectId ? `?project_id=${projectId}` : ''}`),

  getForecast: (id: string) => fetchJSON<Forecast>(`/forecasts/${id}`),

  createForecast: (data: {
    project_id: string;
    molecule_id: string;
    target_id: string;
    pest_id: string;
    crop_id?: string;
    threat_id?: string;
  }) =>
    fetchJSON<Forecast>('/forecasts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  evaluateCandidate: (data: {
    chemical_name: string;
    smiles: string;
    irac_moa_group?: string;
    pest_name?: string;
    pest_order?: string;
    assay_method?: string;
    model_version?: string;
  }) =>
    fetchJSON<PredictionResult>('/forecasts/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAvailableModels: () => fetchJSON<ModelInfo[]>('/forecasts/models'),
};
