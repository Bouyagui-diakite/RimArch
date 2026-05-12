import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'

const TYPE_ICONS = {
  upload:      { icon: '📄', color: 'bg-blue-100 text-blue-600' },
  user_create: { icon: '👤', color: 'bg-cyan-100 text-cyan-600' },
  role_change: { icon: '🔑', color: 'bg-amber-100 text-amber-600' },
  delete:      { icon: '🗑️', color: 'bg-red-100 text-red-600' },
}

const formatRelative = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)    return 'À l\'instant'
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export default function NotificationBell() {
  const { notifications, unread, markRead, markAllRead } = useNotifications()
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
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white dark:ring-[#0d1018]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white dark:bg-[#111520] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1e2436] z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-[#1e2436]">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-800 dark:text-white">Notifications</p>
              {unread > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <svg className="w-10 h-10 mb-2 text-slate-200 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm font-medium">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-[#1e2436]">
                {notifications.map((n) => {
                  const cfg = TYPE_ICONS[n.type] || { icon: '🔔', color: 'bg-slate-100 text-slate-600' }
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] ${!n.read ? 'bg-blue-50/40 dark:bg-blue-500/5' : ''}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${cfg.color}`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-semibold truncate ${!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                            {n.title}
                          </p>
                          {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{formatRelative(n.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
