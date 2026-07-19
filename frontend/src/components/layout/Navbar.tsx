import { Link, NavLink } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Button } from '../ui/Button'
import { PrefsToggles } from './PrefsToggles'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function Navbar() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!accountOpen) return
    function onDoc(e: MouseEvent) {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAccountOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [accountOpen])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-forest/35 text-mint' : 'text-mist hover:bg-panel-2 hover:text-cream'
    }`

  return (
    <header className="site-header sticky top-0 z-40 w-full">
      <div className="flex h-14 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-cream">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          <span className="font-display text-xl tracking-tight sm:text-2xl">{t('brand')}</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          <NavLink to="/" end className={linkClass}>
            {t('navAbout')}
          </NavLink>
          <NavLink to="/browse" className={linkClass}>
            {t('navBrowse')}
          </NavLink>
          <NavLink to="/map" className={linkClass}>
            {t('navMap')}
          </NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                {t('navDashboard')}
              </NavLink>
              <NavLink to="/listings/new" className={linkClass}>
                {t('navListItem')}
              </NavLink>
              {user.role === 'ADMIN' ? (
                <NavLink to="/admin" className={linkClass}>
                  {t('navAdmin')}
                </NavLink>
              ) : null}
            </>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <PrefsToggles className="hidden sm:flex" />

          {user ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1 rounded-full border border-line bg-panel pl-1 pr-2 text-cream transition hover:border-sage/40"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label={t('navProfile')}
                onClick={() => setAccountOpen((v) => !v)}
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-forest/45 text-[11px] font-bold text-mint">
                  {initials(user.full_name)}
                </span>
                <ChevronDown size={14} className="text-mist" aria-hidden />
              </button>

              {accountOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-panel py-1 shadow-lg"
                >
                  <div className="border-b border-line px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-cream">{user.full_name}</p>
                    <p className="truncate text-xs text-mist">{user.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    role="menuitem"
                    className="block px-3 py-2 text-sm text-mist hover:bg-panel-2 hover:text-cream"
                    onClick={() => setAccountOpen(false)}
                  >
                    {t('navProfile')}
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-sm text-mist hover:bg-panel-2 hover:text-cream"
                    onClick={() => {
                      setAccountOpen(false)
                      logout()
                    }}
                  >
                    {t('navLogout')}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link to="/login" className="hidden lg:inline-flex">
              <Button className="h-9 px-3 text-sm">{t('navLogin')}</Button>
            </Link>
          )}

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-cream lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? t('navCloseMenu') : t('navOpenMenu')}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-line px-4 py-3 sm:px-6 lg:hidden">
          <nav className="flex flex-col gap-0.5">
            <NavLink to="/" end className={linkClass} onClick={() => setMobileOpen(false)}>
              {t('navAbout')}
            </NavLink>
            <NavLink to="/browse" className={linkClass} onClick={() => setMobileOpen(false)}>
              {t('navBrowse')}
            </NavLink>
            <NavLink to="/map" className={linkClass} onClick={() => setMobileOpen(false)}>
              {t('navMap')}
            </NavLink>
            {user ? (
              <>
                <NavLink to="/dashboard" className={linkClass} onClick={() => setMobileOpen(false)}>
                  {t('navDashboard')}
                </NavLink>
                <NavLink to="/listings/new" className={linkClass} onClick={() => setMobileOpen(false)}>
                  {t('navListItem')}
                </NavLink>
                {user.role === 'ADMIN' ? (
                  <NavLink to="/admin" className={linkClass} onClick={() => setMobileOpen(false)}>
                    {t('navAdmin')}
                  </NavLink>
                ) : null}
              </>
            ) : null}
            <div className="mt-2 border-t border-line pt-3 sm:hidden">
              <PrefsToggles />
            </div>
            {!user ? (
              <Link to="/login" className="mt-2" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">{t('navLogin')}</Button>
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  )
}
