import { fetchJSON } from './auth.ts';
import {
  Molecule,
  Target,
  Pest,
  Crop,
  CropThreat,
  ProteinRecord,
  ProteinStructure,
  ChemicalSearchResponse,
  PubChemCompoundDetail,
  StructureResolveResponse,
} from './types.ts';

export const candidatesApi = {
  getMolecules: () => fetchJSON<Molecule[]>('/molecules'),

  searchChemicals: (query: string, limit = 8) =>
    fetchJSON<ChemicalSearchResponse>(`/molecules/search?query=${encodeURIComponent(query)}&limit=${limit}`),

  getPubChemCompound: (cid: number) =>
    fetchJSON<PubChemCompoundDetail>(`/molecules/pubchem/${cid}`),

  resolveStructure: (data: { structure_data: string; format?: string; chemical_name?: string }) =>
    fetchJSON<StructureResolveResponse>('/molecules/resolve-structure', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createMolecule: (data: Partial<Molecule>) =>
    fetchJSON<Molecule>('/molecules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCrops: (search?: string) =>
    fetchJSON<Crop[]>(`/crops${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  getCrop: (cropId: string) => fetchJSON<Crop>(`/crops/${cropId}`),

  getCropThreats: (cropId: string) => fetchJSON<CropThreat[]>(`/crops/${cropId}/threats`),

  getTargets: (params?: { pest_id?: string; organism_id?: string; search?: string }) => {
    let endpoint = '/targets';
    if (params) {
      const q = new URLSearchParams();
      if (params.pest_id) q.append('pest_id', params.pest_id);
      if (params.organism_id) q.append('organism_id', params.organism_id);
      if (params.search) q.append('search', params.search);
      const s = q.toString();
      if (s) endpoint += `?${s}`;
    }
    return fetchJSON<Target[]>(endpoint);
  },

  getThreatTargets: (threatOrganismId: string) =>
    fetchJSON<Target[]>(`/targets/threat/${encodeURIComponent(threatOrganismId)}`),

  getTarget: (id: string) => fetchJSON<Target>(`/targets/${id}`),

  getTargetProtein: (targetId: string) => fetchJSON<ProteinRecord>(`/targets/${targetId}/protein`),

  getTargetStructures: (targetId: string) =>
    fetchJSON<ProteinStructure[]>(`/targets/${targetId}/structures`),

  getPests: () => fetchJSON<Pest[]>('/pests'),
};
