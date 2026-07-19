import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { ApiError } from '../api/client'
import { PasswordInput } from '../components/auth/PasswordInput'
import {
  validateField,
  validateForm,
  type AuthField,
} from '../components/auth/validateAuth'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'

function authErrorMessage(
  err: unknown,
  t: (key: 'loginFailed' | 'loginNetwork' | 'loginFailedGeneric') => string,
): string {
  if (!(err instanceof ApiError)) return t('loginFailedGeneric')
  if (err.message === 'NETWORK_ERROR' || err.message === 'NETWORK_TIMEOUT' || err.status === 0) {
    return t('loginNetwork')
  }
  if (err.status === 401 || /invalid email or password/i.test(err.message)) {
    return t('loginFailed')
  }
  return err.message || t('loginFailedGeneric')
}

const LOGIN_FIELDS: AuthField[] = ['email', 'password']

export function LoginPage() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const formRef = useRef<HTMLFormElement>(null)
  const from = (location.state as { from?: string } | null)?.from || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AuthField, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<AuthField, boolean>>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const messages = {
    required: t('validationRequired'),
    email: t('validationEmail'),
    passwordMin: t('validationPasswordMin'),
    passwordWeak: t('validationPasswordWeak'),
    name: t('validationName'),
  }

  function validateOne(field: AuthField, value: string) {
    const err = validateField(field, value, messages, { requireOnly: field === 'password' })
    setFieldErrors((prev) => {
      const next = { ...prev }
      if (err) next[field] = err
      else delete next[field]
      return next
    })
    return err
  }

  function onBlur(field: AuthField, value: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validateOne(field, value)
  }

  function scrollToFirstError(errors: Partial<Record<AuthField, string>>) {
    const first = LOGIN_FIELDS.find((key) => errors[key])
    if (!first) return
    formRef.current?.querySelector(`[data-field="${first}"]`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors = validateForm({ email, password }, LOGIN_FIELDS, messages, {
      requireOnly: true,
    })
    setFieldErrors(errors)
    setTouched({ email: true, password: true })
    if (Object.keys(errors).length) {
      scrollToFirstError(errors)
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(authErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <h1 className="auth-title text-center text-4xl md:text-5xl">{t('loginTitle')}</h1>

      <form ref={formRef} onSubmit={onSubmit} className="auth-card mt-7" noValidate>
        {error ? <Alert>{error}</Alert> : null}

        <Field label={t('loginEmail')} error={touched.email ? fieldErrors.email : undefined}>
          <Input
            data-field="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError('')
              if (touched.email) validateOne('email', e.target.value)
            }}
            onBlur={() => onBlur('email', email)}
            invalid={Boolean(touched.email && fieldErrors.email)}
            placeholder={t('loginEmailPlaceholder')}
          />
        </Field>
        <Field label={t('loginPassword')} error={touched.password ? fieldErrors.password : undefined}>
          <PasswordInput
            data-field="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError('')
              if (touched.password) validateOne('password', e.target.value)
            }}
            onBlur={() => onBlur('password', password)}
            invalid={Boolean(touched.password && fieldErrors.password)}
          />
        </Field>

        <Button type="submit" className="mt-1 w-full" loading={loading}>
          {loading ? t('loginSigning') : t('loginSubmit')}
        </Button>

        <p className="auth-demo mt-4">{t('loginDemoHint')}</p>
      </form>

      <p className="mt-5 text-center text-sm text-mist">
        {t('loginNoAccount')}{' '}
        <Link to="/register" className="font-semibold text-sage hover:text-mint">
          {t('navRegister')}
        </Link>
      </p>
    </div>
  )
}
