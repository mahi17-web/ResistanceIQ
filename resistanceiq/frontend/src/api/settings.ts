import { fetchJSON } from './auth.ts';
import { Organization, User } from './types.ts';

export interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string;
}

export interface ApiKeyCreatedResponse extends ApiKeyItem {
  secret: string;
}

export const settingsApi = {
  getOrganization: () => fetchJSON<Organization>('/settings/org'),

  updateOrganization: (data: { name?: string }) =>
    fetchJSON<Organization>('/settings/org', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getTeamMembers: () => fetchJSON<User[]>('/settings/team'),

  inviteTeamMember: (data: { email: string; full_name: string; role?: string }) =>
    fetchJSON<User>('/settings/team/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeTeamMember: (userId: string) =>
    fetchJSON<void>(`/settings/team/${userId}`, {
      method: 'DELETE',
    }),

  getApiKeys: () => fetchJSON<ApiKeyItem[]>('/settings/api-keys'),

  createApiKey: (name: string) =>
    fetchJSON<ApiKeyCreatedResponse>('/settings/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  revokeApiKey: (keyId: string) =>
    fetchJSON<void>(`/settings/api-keys/${keyId}`, {
      method: 'DELETE',
    }),
};
