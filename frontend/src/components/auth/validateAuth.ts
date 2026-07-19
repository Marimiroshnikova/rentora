export type AuthField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'password'
  | 'city'

export type AuthMessages = {
  required: string
  email: string
  passwordMin: string
  passwordWeak: string
  name: string
}

export type PasswordChecks = {
  min: boolean
  upper: boolean
  lower: boolean
  number: boolean
  special: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    min: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
}

export function isPasswordStrong(password: string): boolean {
  const checks = getPasswordChecks(password)
  return checks.min && checks.upper && checks.lower && checks.number && checks.special
}

export function validateField(
  field: AuthField,
  value: string,
  messages: AuthMessages,
  options?: { strictPassword?: boolean; requireOnly?: boolean },
): string | undefined {
  const trimmed = value.trim()
  switch (field) {
    case 'firstName':
    case 'lastName':
      if (!trimmed) return messages.required
      if (trimmed.length < 2) return messages.name
      return undefined
    case 'email':
      if (!trimmed) return messages.required
      if (!EMAIL_RE.test(trimmed)) return messages.email
      return undefined
    case 'password':
      if (!value) return messages.required
      // Login only needs a non-empty password; strength rules apply to registration.
      if (options?.requireOnly) return undefined
      if (options?.strictPassword) {
        if (!isPasswordStrong(value)) return messages.passwordWeak
        return undefined
      }
      if (value.length < 8) return messages.passwordMin
      return undefined
    case 'city':
      return undefined
    default:
      return undefined
  }
}

export function validateForm(
  fields: Partial<Record<AuthField, string>>,
  keys: AuthField[],
  messages: AuthMessages,
  options?: { strictPassword?: boolean; requireOnly?: boolean },
): Partial<Record<AuthField, string>> {
  const errors: Partial<Record<AuthField, string>> = {}
  for (const key of keys) {
    const err = validateField(key, fields[key] ?? '', messages, options)
    if (err) errors[key] = err
  }
  return errors
}
