'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api, apiPost } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { queryClient } from '@/lib/queryClient'
import { extractApiError } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import type {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
} from '@/types/user'

export function useAuth() {
  const router = useRouter()
  const { setAuth, logout: clearAuth } = useAuthStore()
  const { toastSuccess, toastError } = useUiStore()

  // ─── Login ──────────────────────────────────────────────────

  const login = useMutation({
    mutationFn: (payload: LoginPayload) =>
      apiPost<AuthResponse>('/auth/login', payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      toastSuccess(`Welcome back, ${data.user.firstName}!`)
      // Route by role
      const role = data.user.role
      if (['ADMIN'].includes(role)) {
        router.push(ROUTES.adminDashboard)
      } else if (role === 'DOCTOR') {
        router.push(ROUTES.doctorDashboard)
      } else {
        router.push(ROUTES.dashboard)
      }
    },
    onError: (error) => {
      toastError('Login failed', extractApiError(error))
      
    },
  })

  // ─── Register ────────────────────────────────────────────────

  const register = useMutation({
    mutationFn: (payload: RegisterPayload) =>
      apiPost('/auth/register', payload),
    onSuccess: () => {
      toastSuccess('Account created!', 'Please check your email to verify your account.')
      router.push(ROUTES.login)
    },
    onError: (error) => {
      toastError('Registration failed', extractApiError(error))
    },
  })

  // ─── Logout ──────────────────────────────────────────────────

  const logout = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      clearAuth()
      queryClient.clear()
      router.push(ROUTES.login)
    },
  })

  // ─── Verify Email ────────────────────────────────────────────

  const verifyEmail = useMutation({
    mutationFn: (payload: { userId: string; token: string }) =>
      apiPost('/auth/verify-email', payload),
    onSuccess: () => {
      toastSuccess('Email verified!', 'You can now log in.')
      router.push(ROUTES.login)
    },
    onError: (error) => {
      toastError('Verification failed', extractApiError(error))
    },
  })

  // ─── Forgot Password ─────────────────────────────────────────

  const forgotPassword = useMutation({
    mutationFn: (email: string) =>
      apiPost('/auth/forgot-password', { email }),
    onSuccess: () => {
      toastSuccess('Reset link sent', 'Check your email for a password reset link.')
    },
    onError: (error) => {
      toastError('Error', extractApiError(error))
    },
  })

  // ─── Reset Password ──────────────────────────────────────────

  const resetPassword = useMutation({
    mutationFn: (payload: { token: string; newPassword: string }) =>
      apiPost('/auth/reset-password', payload),
    onSuccess: () => {
      toastSuccess('Password reset!', 'You can now log in with your new password.')
      router.push(ROUTES.login)
    },
    onError: (error) => {
      toastError('Reset failed', extractApiError(error))
    },
  })



  return {
    login,
    register,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
  }
}