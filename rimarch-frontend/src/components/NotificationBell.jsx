import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import { Spinner, formatRelative } from './ui'

/* Un filet de couleur par type — pas d'aplat, pas d'emoji. */
const TYPE_DOT = {
  upload:      'bg-cobalt',
  user_create: 'bg-moss',
  role_change: 'bg-clay',
  delete:      'bg-[#c25048]',
}

const BELL_PATH = (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
)

export default function NotificationBell() {
  const { notifications, unread, loading, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = async (n) => {
    if (!n.read) await markRead(n.id)
    if (n.link) { navigate(n.link); setOpen(false) }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink"
      >
        <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">{BELL_PATH}</svg>
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-cobalt px-1 text-[10px] font-semibold text-white ring-2 ring-canvas">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Panneau de notifications"
          className="absolute right-0 top-11 z-50 w-[330px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[14px] border border-line bg-surface shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-[15px] leading-none text-ink">Notifications</h2>
              {unread > 0 && (
                <span className="rounded-full bg-cobalt px-1.5 py-0.5 text-[10px] font-semibold text-white">{unread}</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[11.5px] font-semibold text-accent transition-opacity hover:opacity-70">
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto" role="list" aria-live="polite" aria-label="Liste des notifications">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-faint">
                <Spinner className="h-5 w-5" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-line text-faint">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">{BELL_PATH}</svg>
                </div>
                <p className="text-[13px] text-faint">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleClick(n)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(n) } }}
                    className={`flex cursor-pointer items-start gap-3 px-5 py-3.5 transition-colors hover:bg-raised focus:bg-raised focus:outline-none ${!n.read ? 'bg-cobalt/[0.04]' : ''}`}
                  >
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_DOT[n.type] || 'bg-faint'}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-[13px] ${!n.read ? 'font-semibold text-ink' : 'font-medium text-muted'}`}>
                          {n.title}
                        </p>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cobalt" aria-label="Non lu" />}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[12px] text-muted">{n.message}</p>
                      <p className="mt-1 text-[11px] text-faint">{formatRelative(n.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
