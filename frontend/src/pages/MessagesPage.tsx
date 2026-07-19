import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  fetchBookings,
  fetchMessages,
  fetchUnreadSummary,
  sendMessage,
  type UnreadSummary,
} from '../api/bookings'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { useLanguage } from '../context/LanguageContext'
import { statusLabel } from '../i18n/translations'
import type { Message } from '../types'
import { ArrowLeft, MessageCircle, PackageSearch } from 'lucide-react'

function localizedSystemBody(body: string, lang: 'en' | 'ka') {
  const lines = body.split('\n')
  if (lines.length === 2) return lang === 'ka' ? lines[1] : lines[0]
  return body
}

function dayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function dayLabel(iso: string, todayLabel: string, yesterdayLabel: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (dayKey(iso) === dayKey(today.toISOString())) return todayLabel
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return yesterdayLabel
  return d.toLocaleDateString()
}

export function MessagesPage() {
  const { user } = useAuth()
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const selected = Number(params.get('booking') || 0)
  const [body, setBody] = useState('')
  const qc = useQueryClient()

  const renterBooks = useQuery({ queryKey: ['bookings', 'renter'], queryFn: () => fetchBookings('renter') })
  const ownerBooks = useQuery({
    queryKey: ['bookings', 'owner'],
    queryFn: () => fetchBookings('owner'),
    enabled: !!user?.is_owner,
  })
  const unread = useQuery({
    queryKey: ['unread-summary'],
    queryFn: fetchUnreadSummary,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    enabled: !!user,
  })

  const threads = useMemo(() => {
    const map = new Map()
    ;[...(renterBooks.data ?? []), ...(ownerBooks.data ?? [])].forEach((b) => map.set(b.id, b))
    return Array.from(map.values())
  }, [renterBooks.data, ownerBooks.data])

  const activeId = selected || threads[0]?.id || 0

  const messages = useQuery({
    queryKey: ['messages', activeId],
    queryFn: () => fetchMessages(activeId),
    enabled: !!activeId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    if (!activeId) return
    qc.setQueryData<UnreadSummary>(['unread-summary'], (prev) => {
      if (!prev) return prev
      const next = { ...prev.by_booking }
      const key = String(activeId)
      const removed = next[key] || 0
      delete next[key]
      return { total: Math.max(0, prev.total - removed), by_booking: next }
    })
    qc.invalidateQueries({ queryKey: ['unread-summary'] })
  }, [activeId, qc])

  const sendMut = useMutation({
    mutationFn: (text: string) => sendMessage(activeId, text),
    onMutate: async (text) => {
      await qc.cancelQueries({ queryKey: ['messages', activeId] })
      const previous = qc.getQueryData<Message[]>(['messages', activeId])
      const optimistic: Message = {
        id: -Date.now(),
        booking_id: activeId,
        sender_id: user!.id,
        body: text,
        created_at: new Date().toISOString(),
        sender: user!,
      }
      qc.setQueryData<Message[]>(['messages', activeId], [...(previous ?? []), optimistic])
      setBody('')
      return { previous }
    },
    onError: (_err, _text, ctx) => {
      if (ctx?.previous) qc.setQueryData(['messages', activeId], ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['messages', activeId] })
      qc.invalidateQueries({ queryKey: ['unread-summary'] })
    },
  })

  const grouped = useMemo(() => {
    const items = messages.data ?? []
    const groups: { key: string; label: string; items: Message[] }[] = []
    for (const m of items) {
      const key = dayKey(m.created_at)
      const last = groups[groups.length - 1]
      if (last && last.key === key) last.items.push(m)
      else {
        groups.push({
          key,
          label: dayLabel(m.created_at, t('messagesToday'), t('messagesYesterday')),
          items: [m],
        })
      }
    }
    return groups
  }, [messages.data, t])

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-sage transition hover:text-mint"
      >
        <ArrowLeft size={16} />
        {t('back')}
      </button>
      <h1 className="font-display text-4xl text-cream">{t('messagesTitle')}</h1>
      <p className="mt-2 text-mist">{t('messagesLead')}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-[280px_1fr]">
        <aside className="space-y-2 rounded-2xl border border-line bg-panel/50 p-3">
          {threads.map((b) => {
            const count = unread.data?.by_booking?.[String(b.id)] || 0
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setParams({ booking: String(b.id) }, { replace: true })}
                className={`w-full rounded-xl px-3 py-3 text-left text-sm ${
                  activeId === b.id ? 'bg-forest/40 text-cream' : 'text-mist hover:bg-panel-2'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-cream">
                    {b.listing?.title ?? `${t('bookingLabel')} #${b.id}`}
                  </p>
                  {count > 0 ? (
                    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-sage px-1.5 text-[11px] font-bold text-ink">
                      {count}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs opacity-80">
                  {b.start_date} · {statusLabel(lang, b.effective_status || b.status)}
                </p>
              </button>
            )
          })}
          {!threads.length ? (
            <EmptyState
              icon={<MessageCircle size={22} />}
              title={t('messagesEmpty')}
              description={t('messagesEmptyHint')}
            />
          ) : null}
        </aside>

        <div className="flex min-h-[420px] flex-col rounded-2xl border border-line bg-panel/50">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {grouped.map((group) => (
              <div key={group.key}>
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-mist">
                  {group.label}
                </p>
                <div className="space-y-3">
                  {group.items.map((m) => {
                    const time = new Date(m.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    if (m.is_system) {
                      return (
                        <div key={m.id} className="flex justify-center">
                          <div className="max-w-[85%] rounded-2xl border border-line bg-panel-2/70 px-4 py-3 text-center text-sm text-mist">
                            <PackageSearch size={18} className="mx-auto mb-1.5 text-sage" />
                            <p>{localizedSystemBody(m.body, lang)}</p>
                            <p className="mt-1 text-[10px] opacity-60">{time}</p>
                            <Link
                              to={`/dashboard/bookings/${m.booking_id}`}
                              className="mt-2 inline-block text-xs font-semibold text-sage hover:text-mint"
                            >
                              {t('messagesSystemViewBooking')}
                            </Link>
                          </div>
                        </div>
                      )
                    }
                    const mine = m.sender_id === user?.id
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                            mine ? 'bg-sage text-ink' : 'bg-panel-2 text-cream'
                          } ${m.id < 0 ? 'opacity-70' : ''}`}
                        >
                          <p className="mb-1 text-xs opacity-70">
                            {m.sender?.full_name ?? t('messagesUser')}
                          </p>
                          <p>{m.body}</p>
                          <p className={`mt-1 text-[10px] opacity-60 ${mine ? 'text-right' : ''}`}>
                            {time}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            {activeId && !messages.data?.length && !messages.isLoading ? (
              <p className="text-sm text-mist">{t('messagesFirstHint')}</p>
            ) : null}
          </div>
          {activeId ? (
            <form
              className="flex gap-2 border-t border-line p-3"
              onSubmit={(e) => {
                e.preventDefault()
                const text = body.trim()
                if (text) sendMut.mutate(text)
              }}
            >
              <Input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t('messagesPlaceholder')}
              />
              <Button type="submit" loading={sendMut.isPending} disabled={!body.trim()}>
                {t('messagesSend')}
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}
