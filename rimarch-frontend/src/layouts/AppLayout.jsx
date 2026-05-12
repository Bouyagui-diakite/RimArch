import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
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
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#0a0d14] overflow-hidden">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#0d1018] border-r border-[#1e2436] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-[#1e2436]">
          <div className="flex items-center justify-center w-9 h-9 bg-blue-600 rounded-xl shrink-0 shadow-lg shadow-blue-600/30">
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none tracking-wide">RIMArch</p>
            <p className="text-slate-600 text-xs mt-1">Gestion des Archives</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 mb-3">Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <NavIcon d={item.icon} />
              {item.label}
            </NavLink>
          ))}

          {hasRole('admin') && (
            <>
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 pt-6 mb-3">Administration</p>
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
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

        {/* User */}
        <div className="p-4 border-t border-[#1e2436]">
          <div
            onClick={() => { navigate('/profil'); setSidebarOpen(false) }}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <div className="flex gap-1 mt-0.5 flex-wrap">
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

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 bg-[#0d1018] border-b border-[#1e2436] shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="lg:hidden font-bold text-white">RIMArch</span>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-8 lg:px-10 lg:py-10 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
