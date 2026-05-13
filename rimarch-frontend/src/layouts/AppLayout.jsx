import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeProvider'
import { NotificationsProvider } from '../context/NotificationsContext'
import NotificationBell from '../components/NotificationBell'

const navItems = [
  {
    to: '/dashboard',
    label: 'Tableau de bord',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  },
  {
    to: '/documents',
    label: 'Documents',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  },
  {
    to: '/profil',
    label: 'Mon profil',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  },
]

const adminItems = [
  {
    to: '/admin/utilisateurs',
    label: 'Utilisateurs',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
  },
  {
    to: '/admin/logs',
    label: 'Journaux',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  },
]

const roleColors = {
  admin:      'bg-red-500/20 text-red-300',
  archiviste: 'bg-blue-500/20 text-blue-300',
  consultant: 'bg-amber-500/20 text-amber-300',
  lecteur:    'bg-slate-500/20 text-slate-400',
}

function NavIcon({ d }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {d}
    </svg>
  )
}

export default function AppLayout({ children }) {
  const { user, logout, hasRole } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <NotificationsProvider>
    <div className="flex h-screen bg-slate-50 dark:bg-[#0a0d14] overflow-hidden">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-slate-900 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="flex items-center gap-4 px-7 py-7 border-b border-white/5">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl shrink-0 shadow-lg shadow-blue-600/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none tracking-wide">RIMArch</p>
            <p className="text-slate-500 text-xs mt-1.5">Gestion des Archives</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-5 py-7 space-y-1.5 overflow-y-auto">
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 mb-4">Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <NavIcon d={item.icon} />
              {item.label}
            </NavLink>
          ))}

          {hasRole('admin') && (
            <>
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 pt-7 mb-4">Administration</p>
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <NavIcon d={item.icon} />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Profil */}
        <div className="p-5 border-t border-white/5">
          <div
            onClick={() => { navigate('/profil'); setSidebarOpen(false) }}
            className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {user?.roles?.map((r) => (
                  <span key={r.name} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${roleColors[r.name] || 'bg-slate-500/20 text-slate-400'}`}>
                    {r.label}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleLogout() }}
              title="Déconnexion"
              className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar — visible partout */}
        <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-[#0d1018] border-b border-slate-200 dark:border-[#1e2436] shrink-0">
          {/* Bouton menu mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:text-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="lg:hidden font-bold text-slate-800">RIMArch</span>

          {/* Espace vide desktop */}
          <div className="hidden lg:block" />

          {/* Cloche à droite */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              title={dark ? 'Mode clair' : 'Mode sombre'}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            >
              {dark ? (
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-10 lg:px-14 lg:py-12 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
    </NotificationsProvider>
  )
}

