'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AuthLayout from '@/components/auth/AuthLayout'
import {
  AuthCard, Field, SubmitButton, AuthLink, AlertBanner,
} from '@/components/auth/AuthForm'
import { useAuth } from '@/hooks/useAuth'
import { loginSchema, type LoginFormData } from '@/lib/validators'
import { ROUTES } from '@/lib/constants'
import styles from './login.module.css'

export default function LoginPage() {
  const { login }           = useAuth()
  const [showPw, setShowPw] = useState(false)


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) => login.mutate(data,{
    onError: (err: any) => {
        const msg: string = err?.response?.data?.message ?? err?.message ?? "Login failed";

        // Map common backend messages to the correct field
        if (msg.toLowerCase().includes("password")) {
          alert(`password : ${msg.toLocaleLowerCase()}`);
        } else {
          alert(`email : ${msg.toLocaleLowerCase()}`);
        }
      },
  })

  return (
    <AuthLayout>
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to your Smoke Dash account"
      >
        {login.isError && (
          <AlertBanner
            message={
              (login.error as any)?.response?.data?.message ??
              'Invalid email or password'
            }
          />
        )}

        <Field label="Email address" error={errors.email?.message}>
          <input
            {...register('email')}
            className="input"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <div className={styles.passwordWrap}>
            <input
              {...register('password')}
              className="input"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.togglePw}
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? '○' : '●'}
            </button>
          </div>
        </Field>

        <div className={styles.forgotRow}>
          <a href={ROUTES.forgotPassword} className={styles.forgotLink}>
            Forgot password?
          </a>
        </div>

        <SubmitButton
          label="Sign In"
          loadingLabel="Signing in…"
          loading={login.isPending}
          onClick={handleSubmit(onSubmit)}
        />

        <AuthLink
          prefix="Don't have an account?"
          label="Create one"
          href={ROUTES.register}
        />
      </AuthCard>
    </AuthLayout>
  )
}