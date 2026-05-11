import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {Role} from '@/types'
import { setAccessToken, clearTokens } from '@/lib/auth'

// ─── Types ────────────────────────────────────────────────────

interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isHydrated: boolean
}

interface AuthActions {
  setAuth: (user: AuthUser, accessToken: string) => void
  setUser: (user: Partial<AuthUser>) => void
  setAccessToken: (token: string) => void
  logout: () => void
  setHydrated: () => void
}

// ─── Store ────────────────────────────────────────────────────

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // ── State ──
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: false,

      // ── Actions ──
      setAuth: (user, accessToken) => {
        setAccessToken(accessToken)
        set({ user, accessToken, isAuthenticated: true })
      },

      setUser: (partial) => {
        const current = get().user
        if (!current) return
        set({ user: { ...current, ...partial } })
      },

      setAccessToken: (token) => {
        setAccessToken(token)
        set({ accessToken: token })
      },

      logout: () => {
        clearTokens()
        set({ user: null, accessToken: null, isAuthenticated: false })
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'SD-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
        // Sync token back to localStorage helper on rehydrate
        if (state?.accessToken) {
          setAccessToken(state.accessToken)
        }
      },
    }
  )
)

// ─── Selectors ────────────────────────────────────────────────

export const selectUser = (s: AuthState) => s.user
export const selectRole = (s: AuthState) => s.user?.role
export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated
export const selectIsHydrated = (s: AuthState) => s.isHydrated
export const selectIsAdmin = (s: AuthState) =>
  ['ADMIN'].includes(
    s.user?.role ?? ''
  )
export const selectIsDocotor = (s: AuthState) => s.user?.role === 'DOCTOR'