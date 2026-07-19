import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { ApiError } from '../api/client'
import { PasswordInput } from '../components/auth/PasswordInput'
import { RulesModal } from '../components/auth/RulesModal'
import {
  validateField,
  validateForm,
  type AuthField,
} from '../components/auth/validateAuth'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { CityCombobox } from '../components/ui/CityCombobox'
import { Field, FieldRow, Input } from '../components/ui/Input'
import { cityValueForSubmit } from '../lib/georgianCities'

function registerErrorMessage(
  err: unknown,
  t: (key: 'registerFailed' | 'loginNetwork' | 'registerEmailTaken') => string,
): string {
  if (!(err instanceof ApiError)) return t('registerFailed')
  if (err.message === 'NETWORK_ERROR' || err.message === 'NETWORK_TIMEOUT' || err.status === 0) {
    return t('loginNetwork')
  }
  if (/already registered/i.test(err.message)) return t('registerEmailTaken')
  return err.message || t('registerFailed')
}

const REGISTER_FIELDS: AuthField[] = ['firstName', 'lastName', 'email', 'password']

export function RegisterPage() {
  const { register } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AuthField, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<AuthField, boolean>>>({})
  const [rulesOpen, setRulesOpen] = useState(false)
  const [acceptedRules, setAcceptedRules] = useState(false)
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
    const err = validateField(field, value, messages, { strictPassword: field === 'password' })
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
    const first = REGISTER_FIELDS.find((key) => errors[key])
    if (!first) return
    formRef.current?.querySelector(`[data-field="${first}"]`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors = validateForm(
      { firstName, lastName, email, password },
      REGISTER_FIELDS,
      messages,
      { strictPassword: true },
    )
    setFieldErrors(errors)
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
    })
    if (Object.keys(errors).length) {
      scrollToFirstError(errors)
      return
    }
    if (!acceptedRules) {
      setError(t('registerRulesRequired'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await register({
        email: email.trim(),
        password,
        full_name: `${firstName} ${lastName}`.trim(),
        city: cityValueForSubmit(city) || undefined,
        is_owner: false,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(registerErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="auth-page">
        <h1 className="auth-title text-center text-4xl md:text-5xl">
          {t('registerTitle')}
        </h1>

        <form ref={formRef} onSubmit={onSubmit} className="auth-card mt-7" noValidate>
          {error ? <Alert>{error}</Alert> : null}

          <FieldRow>
            <Field
              label={t('registerFirstName')}
              error={touched.firstName ? fieldErrors.firstName : undefined}
            >
              <Input
                data-field="firstName"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  if (error) setError('')
                  if (touched.firstName) validateOne('firstName', e.target.value)
                }}
                onBlur={() => onBlur('firstName', firstName)}
                invalid={Boolean(touched.firstName && fieldErrors.firstName)}
                placeholder={t('registerFirstNamePlaceholder')}
              />
            </Field>
            <Field
              label={t('registerLastName')}
              error={touched.lastName ? fieldErrors.lastName : undefined}
            >
              <Input
                data-field="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                  if (error) setError('')
                  if (touched.lastName) validateOne('lastName', e.target.value)
                }}
                onBlur={() => onBlur('lastName', lastName)}
                invalid={Boolean(touched.lastName && fieldErrors.lastName)}
                placeholder={t('registerLastNamePlaceholder')}
              />
            </Field>
          </FieldRow>

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
              placeholder={t('registerEmailPlaceholder')}
            />
          </Field>
          <Field label={t('registerCity')}>
            <CityCombobox
              data-field="city"
              value={city}
              onChange={setCity}
              placeholder={t('registerCityPlaceholder')}
            />
          </Field>
          <Field
            label={t('loginPassword')}
            error={touched.password ? fieldErrors.password : undefined}
          >
            <PasswordInput
              data-field="password"
              autoComplete="new-password"
              value={password}
              showCriteria
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError('')
                if (touched.password) validateOne('password', e.target.value)
              }}
              onBlur={() => onBlur('password', password)}
              invalid={Boolean(touched.password && fieldErrors.password)}
            />
          </Field>

          <label className="auth-check">
            <input
              type="checkbox"
              checked={acceptedRules}
              onChange={(e) => {
                setAcceptedRules(e.target.checked)
                if (error) setError('')
              }}
            />
            <span>
              {t('registerRulesAcceptPrefix')}
              <button
                type="button"
                className="auth-rules-link"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setRulesOpen(true)
                }}
              >
                {t('registerRulesLink')}
              </button>
              {t('registerRulesAcceptSuffix')}
            </span>
          </label>

          <Button type="submit" className="w-full" loading={loading}>
            {loading ? t('registerCreating') : t('registerSubmit')}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-mist">
          {t('registerHaveAccount')}{' '}
          <Link to="/login" className="font-semibold text-sage hover:text-mint">
            {t('navLogin')}
          </Link>
        </p>
      </div>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </>
  )
}
