import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, CircleDollarSign, Repeat2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchOwnerDashboardStats } from '../api/ownerDashboard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Field } from '../components/ui/Input'
import { DatePicker } from '../components/ui/DatePicker'
import { Badge } from '../components/ui/Badge'
import { useLanguage } from '../context/LanguageContext'

function formatMonth(value: string, lang: 'en' | 'ka') {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day || 1)
  return date.toLocaleDateString(lang === 'ka' ? 'ka-GE' : 'en-GB', {
    month: 'short',
    year: 'numeric',
  })
}

function money(value: string, lang: 'en' | 'ka') {
  const number = Number(value || 0)
  return new Intl.NumberFormat(lang === 'ka' ? 'ka-GE' : 'en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number)
}

const STATUS_CARDS: Array<{
  key: 'pending' | 'accepted' | 'completed' | 'cancelled' | 'expired'
  labelKey:
    | 'dashboardReportsPending'
    | 'dashboardReportsAccepted'
    | 'dashboardReportsCompleted'
    | 'dashboardReportsCancelled'
    | 'dashboardReportsExpired'
  tone: 'neutral' | 'sage' | 'gold' | 'danger'
}> = [
  { key: 'pending', labelKey: 'dashboardReportsPending', tone: 'gold' },
  { key: 'accepted', labelKey: 'dashboardReportsAccepted', tone: 'sage' },
  { key: 'completed', labelKey: 'dashboardReportsCompleted', tone: 'neutral' },
  { key: 'cancelled', labelKey: 'dashboardReportsCancelled', tone: 'danger' },
  { key: 'expired', labelKey: 'dashboardReportsExpired', tone: 'danger' },
]

export function OwnerDashboard() {
  const { lang, t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [from, setFrom] = useState(searchParams.get('from') || '')
  const [to, setTo] = useState(searchParams.get('to') || '')

  useEffect(() => {
    setFrom(searchParams.get('from') || '')
    setTo(searchParams.get('to') || '')
  }, [searchParams])

  const appliedFrom = searchParams.get('from') || undefined
  const appliedTo = searchParams.get('to') || undefined

  const { data, isLoading } = useQuery({
    queryKey: ['owner-dashboard', appliedFrom, appliedTo],
    queryFn: () => fetchOwnerDashboardStats({ from: appliedFrom, to: appliedTo }),
  })

  const months = data?.months ?? []
  const chartData = useMemo(
    () =>
      months.map((month) => ({
        ...month,
        label: formatMonth(month.month, lang),
        revenueValue: Number(month.revenue),
      })),
    [lang, months],
  )

  const summary = data?.summary
  const hasData = Boolean(months.length)

  function commit(nextFrom = from, nextTo = to) {
    const search = new URLSearchParams()
    if (nextFrom) search.set('from', nextFrom)
    if (nextTo) search.set('to', nextTo)
    setSearchParams(search)
    setFrom(nextFrom)
    setTo(nextTo)
  }

  function reset() {
    setFrom('')
    setTo('')
    setSearchParams(new URLSearchParams())
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-cream">{t('dashboardReports')}</h1>
          <p className="mt-2 text-mist">{t('dashboardReportsLead')}</p>
        </div>
        <Badge tone="sage">{t('dashboardReportsChart')}</Badge>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard title={t('dashboardReportsRevenue')} value={`${money(summary?.revenue || '0', lang)} ₾`} icon={<CircleDollarSign size={18} />} />
        <MetricCard title={t('dashboardReportsBookings')} value={String(summary?.total_bookings ?? 0)} icon={<CalendarDays size={18} />} />
        {STATUS_CARDS.map(({ key, labelKey, tone }) => (
          <MetricCard
            key={key}
            title={t(labelKey)}
            value={String(summary?.[key] ?? 0)}
            tone={tone}
            icon={<Repeat2 size={18} />}
          />
        ))}
      </div>

      <section className="mt-8 rounded-3xl border border-line bg-panel/60 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-cream">{t('dashboardReportsChart')}</h2>
            <p className="mt-1 text-sm text-mist">{t('dashboardReportsLead')}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Field label={t('dashboardReportsFrom')}>
              <DatePicker value={from} onChange={setFrom} />
            </Field>
            <Field label={t('dashboardReportsTo')}>
              <DatePicker value={to} onChange={setTo} min={from || undefined} />
            </Field>
            <div className="flex gap-2 pb-4">
              <Button type="button" onClick={() => commit()}>
                {t('dashboardReportsApply')}
              </Button>
              <Button type="button" variant="secondary" onClick={reset}>
                {t('dashboardReportsReset')}
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 h-[320px] animate-pulse rounded-2xl border border-dashed border-line bg-panel-2/40" />
        ) : hasData ? (
          <div className="mt-6 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 16,
                    color: '#f8fafc',
                  }}
                  formatter={(value) => [`${Number(value).toFixed(2)} ₾`, t('dashboardReportsRevenue')]}
                />
                <Line
                  type="monotone"
                  dataKey="revenueValue"
                  stroke="#b8e0c2"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              icon={<CalendarDays size={28} />}
              title={t('dashboardReportsEmpty')}
              description={t('dashboardReportsLead')}
              actionLabel={appliedFrom || appliedTo ? t('dashboardReportsReset') : undefined}
              onAction={appliedFrom || appliedTo ? reset : undefined}
            />
          </div>
        )}
      </section>

      {hasData ? (
        <section className="mt-8 rounded-3xl border border-line bg-panel/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-cream">{t('dashboardReportsBreakdown')}</h2>
              <p className="mt-1 text-sm text-mist">{t('dashboardReportsLead')}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
            {months.map((month) => (
              <div key={month.month} className="overflow-hidden rounded-2xl border border-line bg-panel-2/40 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-cream">{formatMonth(month.month, lang)}</p>
                    <p className="text-xs text-mist">
                      {month.total_bookings} {t('dashboardReportsBookings').toLowerCase()}
                    </p>
                  </div>
                  <Badge tone="sage" className="shrink-0 whitespace-nowrap">
                    {money(month.revenue, lang)} ₾
                  </Badge>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <StatPill label={t('dashboardReportsPending')} value={month.pending} />
                  <StatPill label={t('dashboardReportsAccepted')} value={month.accepted} />
                  <StatPill label={t('dashboardReportsCompleted')} value={month.completed} />
                  <StatPill label={t('dashboardReportsCancelled')} value={month.cancelled} />
                  <StatPill label={t('dashboardReportsExpired')} value={month.expired} className="sm:col-span-2" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon,
  tone = 'neutral',
}: {
  title: string
  value: string
  icon: ReactNode
  tone?: 'neutral' | 'sage' | 'gold' | 'danger'
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-mist">{title}</p>
        <Badge tone={tone}>{icon}</Badge>
      </div>
      <p className="mt-3 font-display text-3xl text-cream">{value}</p>
    </div>
  )
}

function StatPill({
  label,
  value,
  className = '',
}: {
  label: string
  value: number
  className?: string
}) {
  return (
    <div className={`min-w-0 rounded-xl border border-line bg-panel px-3 py-2 ${className}`}>
      <p className="break-words text-[11px] leading-tight text-mist">{label}</p>
      <p className="mt-1 font-semibold leading-none text-cream">{value}</p>
    </div>
  )
}