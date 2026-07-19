import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { Input } from '../ui/Input'
import { PasswordCriteria } from './PasswordCriteria'

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  invalid?: boolean
  showCriteria?: boolean
}

export function PasswordInput({
  invalid,
  showCriteria = false,
  value = '',
  className = '',
  onFocus,
  onBlur,
  ...props
}: PasswordInputProps) {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)
  const [focused, setFocused] = useState(false)
  const strValue = String(value)
  const criteriaOpen = showCriteria && focused

  return (
    <div className="password-input-root">
      <div className="password-input-wrap">
        <Input
          {...props}
          value={value}
          type={visible ? 'text' : 'password'}
          invalid={invalid}
          className={`password-input-field ${className}`}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>

        {criteriaOpen ? (
          <div className="password-criteria-popover" role="tooltip">
            <p className="password-criteria-heading">{t('passwordCriteriaTitle')}</p>
            <PasswordCriteria password={strValue} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
