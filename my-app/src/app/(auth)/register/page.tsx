'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AuthLayout from '@/components/auth/AuthLayout'
import {
  AuthCard, Field, SubmitButton, AuthLink, AlertBanner, Divider,
} from '@/components/auth/AuthForm'
import { useAuth } from '@/hooks/useAuth'
import { registerSchema, type RegisterFormData } from '@/lib/validators'
import { ROUTES } from '@/lib/constants'
import styles from './register.module.css'

export default function RegisterPage() {
  const { register: registerAuth } = useAuth()
  const [showPw, setShowPw]        = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  // watch password live for strength meter
  const passwordValue = watch('password', '')

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...payload } = data
    registerAuth.mutate({
      ...payload,
      phone: payload.phone || undefined,
    })
  }

  return (
    <AuthLayout>
      <AuthCard
        title="Create account"
        subtitle="Join Smoke Dash and find the care you need"
      >
        {registerAuth.isError && (
          <AlertBanner
            message={
              (registerAuth.error as any)?.response?.data?.message ??
              'Registration failed. Please try again.'
            }
          />
        )}

        {/* ── Name row ── */}
        <div className={styles.nameRow}>
          <Field label="First name" error={errors.firstName?.message}>
            <input
              {...register('firstName')}
              className="input"
              placeholder="John"
              autoComplete="given-name"
            />
          </Field>
          <Field label="Last name" error={errors.lastName?.message}>
            <input
              {...register('lastName')}
              className="input"
              placeholder="Doe"
              autoComplete="family-name"
            />
          </Field>
        </div>

        <Field label="Email address" error={errors.email?.message}>
          <input
            {...register('email')}
            className="input"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        <Field
          label="Phone number"
          error={errors.phone?.message}
          hint="Optional — used for appointment reminders"
        >
          <input
            {...register('phone')}
            className="input"
            type="tel"
            placeholder="+1 555 000 0000"
            autoComplete="tel"
          />
        </Field>

        <Divider />

        {/* ── Password ── */}
        <Field label="Password" error={errors.password?.message}>
          <div className={styles.passwordWrap}>
            <input
              {...register('password')}
              className="input"
              type={showPw ? 'text' : 'password'}
              placeholder="Min 8 characters"
              autoComplete="new-password"
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
          {passwordValue && <PasswordStrength password={passwordValue} />}
        </Field>

        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <input
            {...register('confirmPassword')}
            className="input"
            type="password"
            placeholder="Repeat password"
            autoComplete="new-password"
          />
        </Field>

        <SubmitButton
          label="Create Account"
          loadingLabel="Creating account…"
          loading={registerAuth.isPending}
          onClick={handleSubmit(onSubmit)}
        />

        <AuthLink
          prefix="Already have an account?"
          label="Sign in"
          href={ROUTES.login}
        />
      </AuthCard>
    </AuthLayout>
  )
}

// ─── Password strength meter ──────────────────────────────────
// Mirrors the exact rules in registerSchema so the meter stays in sync

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password), // bonus: special char
  ]
  const score = checks.filter(Boolean).length

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', '#c62300', '#f14a00', '#f59e0b', '#4ade80']

  return (
    <div className={styles.strength}>
      <div className={styles.strengthBars}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={styles.strengthBar}
            style={{ background: i <= score ? colors[score] : 'var(--neutral-300)' }}
          />
        ))}
      </div>
      <span className={styles.strengthLabel} style={{ color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  )
}