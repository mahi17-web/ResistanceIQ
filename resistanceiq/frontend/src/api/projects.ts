import { fetchJSON } from './auth.ts';
import { Project } from './types.ts';

export const projectsApi = {
  getProjects: () => fetchJSON<Project[]>('/projects'),

  getProject: (id: string) => fetchJSON<Project>(`/projects/${id}`),

  createProject: (data: { name: string; description?: string }) =>
    fetchJSON<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProject: (id: string, data: { name?: string; description?: string }) =>
    fetchJSON<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteProject: (id: string) =>
    fetchJSON<void>(`/projects/${id}`, {
      method: 'DELETE',
    }),
};
