import { Moon, Sun } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'

export function PrefsToggles({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t } = useLanguage()
  const nextTheme = theme === 'light' ? 'dark' : 'light'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="lang-toggle" role="group" aria-label="Language">
        <button
          type="button"
          className={lang === 'ka' ? 'active' : ''}
          onClick={() => setLang('ka')}
          aria-pressed={lang === 'ka'}
        >
          ქარ
        </button>
        <button
          type="button"
          className={lang === 'en' ? 'active' : ''}
          onClick={() => setLang('en')}
          aria-pressed={lang === 'en'}
        >
          EN
        </button>
      </div>

      <button
        type="button"
        className="theme-icon-btn"
        onClick={() => setTheme(nextTheme)}
        aria-label={nextTheme === 'dark' ? t('themeDark') : t('themeLight')}
        title={nextTheme === 'dark' ? t('themeDark') : t('themeLight')}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </div>
  )
}
