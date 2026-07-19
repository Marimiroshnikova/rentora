import { useLanguage } from '../../context/LanguageContext'
import { getPasswordChecks, isPasswordStrong } from './validateAuth'

type RuleKey =
  | 'passwordCriteriaMin'
  | 'passwordCriteriaUpper'
  | 'passwordCriteriaLower'
  | 'passwordCriteriaNumber'
  | 'passwordCriteriaSpecial'

const RULES: { key: RuleKey; check: keyof ReturnType<typeof getPasswordChecks> }[] = [
  { key: 'passwordCriteriaMin', check: 'min' },
  { key: 'passwordCriteriaUpper', check: 'upper' },
  { key: 'passwordCriteriaLower', check: 'lower' },
  { key: 'passwordCriteriaNumber', check: 'number' },
  { key: 'passwordCriteriaSpecial', check: 'special' },
]

export function PasswordCriteria({ password }: { password: string }) {
  const { t } = useLanguage()
  const checks = getPasswordChecks(password)
  const passed = RULES.filter(({ check }) => checks[check]).length
  const strength = Math.round((passed / RULES.length) * 100)

  return (
    <div className="password-criteria-panel">
      <div className="password-strength-bar" aria-hidden="true">
        <span
          className={`password-strength-fill${isPasswordStrong(password) ? ' strong' : ''}`}
          style={{ width: `${Math.max(strength, password ? 8 : 0)}%` }}
        />
      </div>
      <ul className="password-criteria-list">
        {RULES.map(({ key, check }) => (
          <li key={key} className={checks[check] ? 'ok' : ''}>
            {t(key)}
          </li>
        ))}
      </ul>
    </div>
  )
}
