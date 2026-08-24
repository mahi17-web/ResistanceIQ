/**
 * ResistanceIQ — Production REST API Client
 * Connects directly to FastAPI backend (/api/v1) with token-based authentication,
 * error handling, and zero mock fallback data.
 */

const PROD_API_BASE_URL = 'https://resistanceiq-api.onrender.com';

function resolveApiBase() {
  // 1. Explicit environment variable set at build-time or runtime
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    const customUrl = import.meta.env.VITE_API_BASE_URL.trim();
    if (customUrl) {
      const clean = customUrl.replace(/\/$/, '');
      return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
    }
  }

  // 2. Production browser context fallback (e.g. deployed on Vercel or non-localhost)
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1' && host !== '0.0.0.0' && host !== '') {
      return `${PROD_API_BASE_URL}/api/v1`;
    }
  }

  // 3. Production Vite build fallback
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    return `${PROD_API_BASE_URL}/api/v1`;
  }

  // 4. Local development proxy fallback
  return '/api/v1';
}

const API_BASE = resolveApiBase();

function getAuthHeader() {
  const token = localStorage.getItem('riq_auth_token') || localStorage.getItem('riq_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401 && endpoint !== '/auth/login') {
      localStorage.removeItem('riq_auth_token');
      localStorage.removeItem('riq_token');
      localStorage.removeItem('riq_refresh_token');
    }
    let errorDetail = `API Error ${response.status}: ${response.statusText}`;
    let errJson = null;
    try {
      errJson = await response.json();
      if (typeof errJson.detail === 'string') {
        errorDetail = errJson.detail;
      } else if (errJson.detail && typeof errJson.detail === 'object') {
        errorDetail = errJson.detail.message || JSON.stringify(errJson.detail);
      } else if (errJson.message) {
        errorDetail = errJson.message;
      }
    } catch {
      // ignore
    }
    const err = new Error(errorDetail);
    err.status = response.status;
    if (errJson) {
      err.detail = errJson.detail;
      err.errorCode = errJson.detail?.error_code || errJson.error_code;
      err.stage = errJson.detail?.stage || errJson.stage;
      err.requestId = errJson.detail?.request_id || errJson.request_id || response.headers.get('X-Request-ID');
      err.retryable = errJson.detail?.retryable;
    }
    throw err;
  }

  if (response.status === 204) return null;
  return response.json();
}

// ─── Authentication & User Accounts ──────────────────────────────────────────
export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.access_token) {
    localStorage.setItem('riq_auth_token', data.access_token);
    localStorage.setItem('riq_token', data.access_token);
  }
  if (data.refresh_token) {
    localStorage.setItem('riq_refresh_token', data.refresh_token);
  }
  return data;
}

export async function register(payload) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data.access_token) {
    localStorage.setItem('riq_auth_token', data.access_token);
    localStorage.setItem('riq_token', data.access_token);
  }
  if (data.refresh_token) {
    localStorage.setItem('riq_refresh_token', data.refresh_token);
  }
  return data;
}

export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  } finally {
    localStorage.removeItem('riq_auth_token');
    localStorage.removeItem('riq_token');
    localStorage.removeItem('riq_refresh_token');
  }
}

export async function getCurrentUser() {
  return request('/auth/me');
}

export async function updateProfile(payload) {
  return request('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function changePassword(payload) {
  return request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(email) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyResetCode(email, code) {
  return request('/auth/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function resetPassword(resetToken, newPassword) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
  });
}

export async function verifyEmail(token) {
  return request('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function refreshToken() {
  const refresh = localStorage.getItem('riq_refresh_token');
  if (!refresh) throw new Error('No refresh token available');
  const data = await request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (data.access_token) {
    localStorage.setItem('riq_auth_token', data.access_token);
    localStorage.setItem('riq_token', data.access_token);
  }
  return data;
}

export async function ensureAuthenticated() {
  const token = localStorage.getItem('riq_auth_token') || localStorage.getItem('riq_token');
  if (token) {
    try {
      return await getCurrentUser();
    } catch {
      localStorage.removeItem('riq_auth_token');
      localStorage.removeItem('riq_token');
    }
  }
  return null;
}

// ─── Team & User Management (Admin RBAC) ─────────────────────────────────────
export async function getUsers() {
  return request('/settings/users');
}

export async function inviteUser(payload) {
  return request('/settings/users/invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUserRole(userId, role) {
  return request(`/settings/users/${encodeURIComponent(userId)}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function deactivateUser(userId) {
  return request(`/settings/users/${encodeURIComponent(userId)}/deactivate`, {
    method: 'POST',
  });
}

export async function reactivateUser(userId) {
  return request(`/settings/users/${encodeURIComponent(userId)}/reactivate`, {
    method: 'POST',
  });
}

export async function removeUser(userId) {
  return request(`/settings/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}

// ─── Crops & Knowledge Graph ──────────────────────────────────────────────────
export async function getCrops(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return request(`/crops${query}`);
}

export async function getCrop(id) {
  return request(`/crops/${id}`);
}

export async function getCropThreats(cropId) {
  return request(`/crops/${cropId}/threats`);
}

// ─── Pests ────────────────────────────────────────────────────────────────────
export async function getPests() {
  return request('/pests');
}

// ─── Target Proteins & Structures ─────────────────────────────────────────────
export async function getTargets(params = {}) {
  let endpoint = '/targets';
  const queryParams = new URLSearchParams();
  if (typeof params === 'string') {
    queryParams.append('pest_id', params);
  } else if (params && typeof params === 'object') {
    if (params.pest_id) queryParams.append('pest_id', params.pest_id);
    if (params.organism_id) queryParams.append('organism_id', params.organism_id);
    if (params.search) queryParams.append('search', params.search);
  }
  const qs = queryParams.toString();
  if (qs) endpoint += `?${qs}`;
  return request(endpoint);
}

export async function getThreatTargets(organismId) {
  return request(`/targets/threat/${encodeURIComponent(organismId)}`);
}

export async function getTarget(id) {
  return request(`/targets/${id}`);
}

export async function getTargetProtein(targetId) {
  return request(`/targets/${targetId}/protein`);
}

export async function getTargetStructures(targetId) {
  return request(`/targets/${targetId}/structures`);
}

export async function getKnowledgeGraphStatus() {
  return request('/admin/knowledge-graph/status');
}

export async function syncKnowledgeGraph(syncType = 'ALL') {
  return request('/admin/knowledge-graph/sync', {
    method: 'POST',
    body: JSON.stringify({ sync_type: syncType }),
  });
}

// ─── Molecules & Automated Chemical Resolution ───────────────────────────────
export async function searchChemicalCompounds(query, limit = 8) {
  const qs = new URLSearchParams({ query, limit: String(limit) }).toString();
  return request(`/molecules/search?${qs}`);
}

export async function getPubChemCompound(cid) {
  return request(`/molecules/pubchem/${cid}`);
}

export async function resolveChemicalStructure(structureData, format = 'AUTO', chemicalName = '') {
  return request('/molecules/resolve-structure', {
    method: 'POST',
    body: JSON.stringify({
      structure_data: structureData,
      format,
      chemical_name: chemicalName,
    }),
  });
}

export async function uploadChemicalStructureFile(file, chemicalName = '') {
  const formData = new FormData();
  formData.append('file', file);
  if (chemicalName) {
    formData.append('chemical_name', chemicalName);
  }

  const token = localStorage.getItem('riq_auth_token') || localStorage.getItem('riq_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${API_BASE}/molecules/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = `Upload error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function getMolecules() {
  return request('/molecules');
}

export async function getMolecule(id) {
  return request(`/molecules/${id}`);
}

export async function createMolecule(data) {
  return request('/molecules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Forecasts ────────────────────────────────────────────────────────────────
export async function getForecasts(projectId) {
  const endpoint = projectId ? `/forecasts?project_id=${projectId}` : '/forecasts';
  return request(endpoint);
}

export async function getForecast(id) {
  if (!id) return null;
  return request(`/forecasts/${id}`);
}

export async function triggerForecast(moleculeId, targetId, pestId, projectId, modelVersion = null) {
  return request('/forecasts', {
    method: 'POST',
    body: JSON.stringify({
      project_id: projectId,
      molecule_id: moleculeId,
      target_id: targetId,
      pest_id: pestId,
      model_version: modelVersion,
    }),
  });
}

export async function evaluateCandidate(payload) {
  return request('/forecasts/evaluate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function previewFeatures(payload) {
  return request('/forecasts/features/preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getActiveModel() {
  return request('/models/active');
}

export async function getModelHealth(modelVersion) {
  return request(`/models/${encodeURIComponent(modelVersion)}/health`);
}

export async function getModels() {
  return request('/models');
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export async function getProjects() {
  return request('/projects');
}

export async function getProject(id) {
  return request(`/projects/${id}`);
}

export async function createProject(data) {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getProjectComparison(projectId) {
  const forecasts = await request(`/forecasts?project_id=${projectId}`);
  return forecasts.sort((a, b) => b.durability_score - a.durability_score);
}

// ─── Backtests ────────────────────────────────────────────────────────────────
export async function getBacktestSummary() {
  return request('/backtests/accuracy');
}

export async function getBacktestCases() {
  return request('/backtests/cases');
}

export async function getBacktestCase(id) {
  return request(`/backtests/cases/${id}`);
}

// ─── Reports & File Exports ──────────────────────────────────────────────────
export async function downloadFile(endpoint, defaultFilename = 'download.pdf') {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeader(),
  };

  const response = await fetch(url, { headers });
  if (!response.ok) {
    let errorDetail = `Download Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (typeof errJson.detail === 'string') {
        errorDetail = errJson.detail;
      } else if (errJson.detail?.message) {
        errorDetail = errJson.detail.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new Error('Export generated an empty file.');
  }

  // Extract filename from Content-Disposition header if available
  let filename = defaultFilename;
  const disposition = response.headers.get('Content-Disposition') || response.headers.get('content-disposition');
  if (disposition) {
    const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '').trim();
    }
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    window.URL.revokeObjectURL(blobUrl);
  }, 200);

  return { filename, size: blob.size, mimeType: blob.type };
}

export async function getReports(projectId) {
  const endpoint = projectId ? `/reports?project_id=${projectId}` : '/reports';
  return request(endpoint);
}

export async function generateReport(projectId, format = 'PDF') {
  return request('/reports/generate', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId, format }),
  });
}

export async function downloadReport(reportId) {
  return downloadFile(`/reports/${encodeURIComponent(reportId)}/download`, `ResistanceIQ_Report_${reportId}.pdf`);
}

export async function exportForecast(forecastId, format = 'pdf') {
  return downloadFile(`/forecasts/${encodeURIComponent(forecastId)}/export?format=${encodeURIComponent(format)}`, `ResistanceIQ_Forecast_${forecastId}.${format}`);
}

// ─── Settings & Org ───────────────────────────────────────────────────────────
export async function getOrganization() {
  return request('/settings/org');
}

export async function updateOrganization(data) {
  return request('/settings/org', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getApiKeys() {
  return request('/settings/api-keys');
}

export async function createApiKey(name) {
  return request('/settings/api-keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function revokeApiKey(id) {
  return request(`/settings/api-keys/${id}`, {
    method: 'DELETE',
  });
}

// ─── Aliases for compatibility ────────────────────────────────────────────────
export const getHistoricalCases = getBacktestCases;
export const getBacktestAccuracy = getBacktestSummary;
export const getTeamMembers = getUsers;
