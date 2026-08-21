import { create } from 'zustand';

const useProjectStore = create((set, get) => ({
  // ─── Production Auth state ─────────────────────────────────────────
  user: null,
  org: null,
  authStatus: 'loading', // 'loading' | 'authenticated' | 'unauthenticated' | 'session_expired'
  setUser: (user) => set({ user, authStatus: user ? 'authenticated' : 'unauthenticated' }),
  setOrg: (org) => set({ org }),
  setAuthStatus: (authStatus) => set({ authStatus }),
  logout: () => set({ user: null, org: null, authStatus: 'unauthenticated' }),

  // ─── Active project ───────────────────────────────────────────────
  activeProjectId: 'prj_ache1_series',
  setActiveProject: (id) => set({ activeProjectId: id }),

  // ─── Job tracking ─────────────────────────────────────────────────
  // Map of jobId -> { id, type, status, progress, current_step, steps, result, error }
  jobs: {},

  updateJob: (jobId, updates) =>
    set((state) => ({
      jobs: { ...state.jobs, [jobId]: { ...(state.jobs[jobId] ?? {}), ...updates } },
    })),

  getJob: (jobId) => get().jobs[jobId],

  // ─── Notifications ────────────────────────────────────────────────
  notifications: [],

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        { id: Date.now(), ts: Date.now(), ...notification },
        ...state.notifications,
      ].slice(0, 20),
    })),

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  // ─── Comparison selections ────────────────────────────────────────
  comparisonForecastIds: ['fc_4477a_01', 'fc_2241_02', 'fc_3109_03', 'fc_9921x_04'],

  addToComparison: (forecastId) =>
    set((state) => ({
      comparisonForecastIds: state.comparisonForecastIds.includes(forecastId)
        ? state.comparisonForecastIds
        : [...state.comparisonForecastIds, forecastId],
    })),

  removeFromComparison: (forecastId) =>
    set((state) => ({
      comparisonForecastIds: state.comparisonForecastIds.filter((id) => id !== forecastId),
    })),

  // ─── New candidate wizard state ───────────────────────────────────
  wizard: {
    step: 1,
    molecule: null,
    target: null,
    pest: null,
    jobIds: {},
    forecastResult: null,
  },

  setWizardStep: (step) =>
    set((state) => ({ wizard: { ...state.wizard, step } })),

  setWizardMolecule: (mol) =>
    set((state) => ({ wizard: { ...state.wizard, molecule: mol } })),

  setWizardTarget: (target) =>
    set((state) => ({ wizard: { ...state.wizard, target } })),

  setWizardPest: (pest) =>
    set((state) => ({ wizard: { ...state.wizard, pest } })),

  setWizardJobIds: (jobIds) =>
    set((state) => ({ wizard: { ...state.wizard, jobIds } })),

  setWizardForecastResult: (result) =>
    set((state) => ({ wizard: { ...state.wizard, forecastResult: result } })),

  resetWizard: () =>
    set({
      wizard: { step: 1, molecule: null, target: null, pest: null, jobIds: {}, forecastResult: null },
    }),
}));

export default useProjectStore;
