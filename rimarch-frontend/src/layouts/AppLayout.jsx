import { useState, useEffect, useRef, useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeProvider'
import { NotificationsProvider } from '../context/NotificationsContext'
import NotificationBell from '../components/NotificationBell'
import { useIdleTimer } from '../hooks/useIdleTimer'

const WARNING_SECONDS = 2 * 60

function IdleWarningModal({ secondsLeft, onStay, onLogout }) {
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const countdown = minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}s`
  const urgent = secondsLeft <= 30

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b0d16]/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-sm overflow-hidden rounded-[18px] border border-line bg-surface shadow-2xl">
        <div className="px-8 py-9 text-center">
          <p className="eyebrow text-faint">Sécurité</p>
          <h2 className="font-display mt-3 text-[25px] leading-none text-ink">Session inactive</h2>
          <p className="mt-3 text-[13px] text-muted">Déconnexion automatique dans</p>
          <p className={`font-display mt-4 text-[46px] leading-none tabular-nums ${urgent ? 'text-[#c25048]' : 'text-accent'}`}>
            {countdown}
          </p>
        </div>
        <div className="flex gap-3 border-t border-line p-4">
          <button
            onClick={onLogout}
            className="flex-1 rounded-lg border border-line py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted transition hover:border-ink hover:text-ink"
          >
            Déconnecter
          </button>
          <button
            onClick={onStay}
            className="flex-1 rounded-lg bg-ink py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-canvas transition hover:bg-cobalt hover:text-white"
          >
            Rester
          </button>
        </div>
      </div>
    </div>
  )
}

const navItems = [
  {
    to: '/dashboard', label: 'Tableau de bord',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  },
  {
    to: '/documents', label: 'Documents',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  },
  {
    to: '/profil', label: 'Mon profil',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  },
  {
    to: '/corbeille', label: 'Corbeille',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
  },
]

const adminItems = [
  {
    to: '/admin/utilisateurs', label: 'Utilisateurs',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
  },
  {
    to: '/admin/logs', label: 'Journaux',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  },
]

const navClass = ({ isActive }) =>
  `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
    isActive
      ? 'bg-raised text-ink'
      : 'text-muted hover:bg-raised hover:text-ink'
  }`

function NavRow({ item, onNavigate }) {
  return (
    <NavLink to={item.to} onClick={onNavigate} className={navClass}>
      {({ isActive }) => (
        <>
          <span
            className={`absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-r bg-cobalt transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}
          />
          <svg className="h-[17px] w-[17px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {item.icon}
          </svg>
          {item.label}
        </>
      )}
    </NavLink>
  )
}

export default function AppLayout({ children }) {
  const { user, logout, hasRole } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [showIdleWarning, setShowIdleWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS)
  const countdownRef = useRef(null)

  const handleLogout = async () => { await logout(); navigate('/login') }

  const handleIdleLogout = useCallback(async () => {
    clearInterval(countdownRef.current)
    setShowIdleWarning(false)
    await logout()
    navigate('/login')
  }, [logout, navigate])

  const handleWarn = useCallback(() => {
    setSecondsLeft(WARNING_SECONDS)
    setShowIdleWarning(true)
  }, [])

  const resetIdle = useIdleTimer({ onWarn: handleWarn, onLogout: handleIdleLogout })

  const handleStay = useCallback(() => {
    clearInterval(countdownRef.current)
    setShowIdleWarning(false)
    resetIdle()
  }, [resetIdle])

  useEffect(() => {
    if (!showIdleWarning) return
    countdownRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(countdownRef.current); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(countdownRef.current)
  }, [showIdleWarning])

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <NotificationsProvider>
      {showIdleWarning && (
        <IdleWarningModal secondsLeft={secondsLeft} onStay={handleStay} onLogout={handleIdleLogout} />
      )}

      <div className="flex h-screen overflow-hidden bg-canvas">

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-[#0b0d16]/60 backdrop-blur-sm lg:hidden" onClick={closeSidebar} />
        )}

        {/* ── Barre latérale ── */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-line bg-surface transition-transform duration-300 lg:static ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Marque */}
          <div className="flex items-center gap-3 border-b border-line px-5 py-[18px]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink">
              <span className="text-[15px] font-semibold leading-none text-canvas">R</span>
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.2em] text-ink">RIMArch</p>
              <p className="mt-0.5 text-[10.5px] text-faint">Archives · {new Date().getFullYear()}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5">
            <p className="eyebrow px-3 pb-2 text-faint">Espace</p>
            {navItems.map((item) => (
              <NavRow key={item.to} item={item} onNavigate={closeSidebar} />
            ))}

            {hasRole('admin') && (
              <>
                <p className="eyebrow px-3 pb-2 pt-6 text-faint">Administration</p>
                {adminItems.map((item) => (
                  <NavRow key={item.to} item={item} onNavigate={closeSidebar} />
                ))}
              </>
            )}
          </nav>

          {/* Utilisateur */}
          <div className="border-t border-line p-3">
            <div
              onClick={() => { navigate('/profil'); closeSidebar() }}
              className="group flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-raised"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink">
                <span className="text-[14px] font-semibold leading-none text-canvas">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{user?.name}</p>
                <p className="truncate text-[11px] text-faint">
                  {user?.roles?.map((r) => r.label).join(' · ') || 'Utilisateur'}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleLogout() }}
                title="Déconnexion"
                aria-label="Déconnexion"
                className="shrink-0 rounded-md p-1.5 text-faint transition-colors hover:bg-canvas hover:text-[#c25048]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* ── Zone principale ── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

          {/* `backdrop-blur` crée un contexte d'empilement : sans `z-30` ici, le
              panneau de notifications resterait piégé derrière le contenu. */}
          <header className="relative z-30 flex shrink-0 items-center justify-between gap-4 border-b border-line bg-canvas/85 px-5 py-2.5 backdrop-blur-xl">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
              className="rounded-md p-1.5 text-muted transition-colors hover:bg-raised hover:text-ink lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-[12.5px] font-semibold uppercase tracking-[0.2em] text-ink lg:hidden">RIMArch</span>
            <div className="hidden lg:block" />

            <div className="flex items-center gap-1">
              <button
                onClick={toggle}
                title={dark ? 'Mode clair' : 'Mode sombre'}
                aria-label={dark ? 'Mode clair' : 'Mode sombre'}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink"
              >
                {dark ? (
                  <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <NotificationBell />
            </div>
          </header>

          {/* Bandeau mot de passe */}
          {user?.must_change_password && (
            <div className="flex shrink-0 items-center justify-between gap-4 bg-clay px-6 py-2.5 text-[12.5px] font-medium text-white">
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mot de passe non conforme aux exigences de sécurité — mise à jour requise.
              </span>
              <a href="/profil" className="shrink-0 whitespace-nowrap rounded-md bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-white/30">
                Mettre à jour
              </a>
            </div>
          )}

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1240px] px-5 py-7 lg:px-9 lg:py-9">
              {children}
            </div>
          </main>
        </div>
      </div>
    </NotificationsProvider>
  )
}
