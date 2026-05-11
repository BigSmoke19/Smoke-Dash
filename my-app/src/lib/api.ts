import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { getAccessToken, setAccessToken, clearTokens } from './auth'

// ─── Base client ──────────────────────────────────────────────

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
  withCredentials: true, // needed for refresh token httpOnly cookie
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor — attach access token ────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor — handle 401, refresh token ─────────

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (isRefreshing) {
        // Wait for the ongoing refresh and retry with new token
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      isRefreshing = true

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const newToken: string = data.data.accessToken
        setAccessToken(newToken)

        // Flush queued requests
        refreshQueue.forEach((cb) => cb(newToken))
        refreshQueue = []

        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        // Refresh failed — log out
        clearTokens()
        refreshQueue = []
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─── Typed response helpers ───────────────────────────────────

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<{ success: boolean; data: T }>(url, { params })
  return data.data as T
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<{ success: boolean; data: T }>(url, body)
  return data.data as T
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<{ success: boolean; data: T }>(url, body)
  return data.data as T
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.put<{ success: boolean; data: T }>(url, body)
  return data.data as T
}

export async function apiDelete<T = void>(url: string): Promise<T> {
  const { data } = await api.delete<{ success: boolean; data: T }>(url)
  return data.data as T
}

export async function apiUpload<T>(url: string, formData: FormData): Promise<T> {
  const { data } = await api.post<{ success: boolean; data: T }>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data as T
}