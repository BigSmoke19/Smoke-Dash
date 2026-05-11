import { create } from 'zustand'

// ─── Toast ────────────────────────────────────────────────────

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  duration?: number
}

// ─── Modal ────────────────────────────────────────────────────

export type ModalId =
  | 'confirm-delete'
  | 'confirm-action'
  | 'assign-agent'
  | 'change-status'
  | 'upload-document'
  | 'view-document'
  | 'broadcast'
  | 'set-commission-rate'
  | null

// ─── State & Actions ──────────────────────────────────────────

interface UiState {
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean

  // Toasts
  toasts: Toast[]

  // Modal
  activeModal: ModalId
  modalData: Record<string, unknown> | null

  // Global loading
  globalLoading: boolean
}

interface UiActions {
  // Sidebar
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Toasts
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void

  // Shorthands
  toast: (title: string, description?: string) => void
  toastSuccess: (title: string, description?: string) => void
  toastError: (title: string, description?: string) => void
  toastWarning: (title: string, description?: string) => void

  // Modal
  openModal: (id: ModalId, data?: Record<string, unknown>) => void
  closeModal: () => void

  // Global loading
  setGlobalLoading: (loading: boolean) => void
}

// ─── Store ────────────────────────────────────────────────────

export const useUiStore = create<UiState & UiActions>((set, get) => ({
  // ── State ──
  sidebarOpen: false,
  sidebarCollapsed: false,
  toasts: [],
  activeModal: null,
  modalData: null,
  globalLoading: false,

  // ── Sidebar ──
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // ── Toasts ──
  addToast: (toast) => {
    const id = crypto.randomUUID()
    const duration = toast.duration ?? 4000
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    if (duration > 0) {
      setTimeout(() => get().removeToast(id), duration)
    }
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  clearToasts: () => set({ toasts: [] }),

  toast: (title, description) =>
    get().addToast({ title, description, variant: 'default' }),

  toastSuccess: (title, description) =>
    get().addToast({ title, description, variant: 'success' }),

  toastError: (title, description) =>
    get().addToast({ title, description, variant: 'error' }),

  toastWarning: (title, description) =>
    get().addToast({ title, description, variant: 'warning' }),

  // ── Modal ──
  openModal: (id, data) => set({ activeModal: id, modalData: data ?? null }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // ── Global loading ──
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}))

// ─── Selectors ────────────────────────────────────────────────

export const selectSidebarOpen = (s: UiState) => s.sidebarOpen
export const selectSidebarCollapsed = (s: UiState) => s.sidebarCollapsed
export const selectToasts = (s: UiState) => s.toasts
export const selectActiveModal = (s: UiState) => s.activeModal
export const selectModalData = (s: UiState) => s.modalData