import { useLanguage } from '../../context/LanguageContext'
import type { User } from '../../types'

export function UsersPanel({ users }: { users: User[] }) {
  const { t } = useLanguage()

  if (!users.length) {
    return <p className="text-mist">{t('adminEmpty')}</p>
  }

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div
          key={u.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-panel/40 px-4 py-3 text-sm"
        >
          <span className="text-cream">
            {u.full_name} <span className="text-mist">({u.email})</span>
          </span>
          <span className="text-mist">
            {u.role}
            {u.is_owner ? ` · ${t('adminOwner')}` : ''}
          </span>
        </div>
      ))}
    </div>
  )
}
