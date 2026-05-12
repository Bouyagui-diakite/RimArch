import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getStats } from '../api/admin'

const statCards = [
  { label: 'Documents',    sub: 'Total archivés',  color: 'bg-blue-500',    shadow: 'shadow-blue-500/20',    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
  { label: 'Utilisateurs', sub: 'Comptes actifs',  color: 'bg-violet-500',  shadow: 'shadow-violet-500/20',  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
  { label: 'Catégories',   sub: 'Rôles actifs',    color: 'bg-amber-500',   shadow: 'shadow-amber-500/20',   icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /> },
  { label: 'Stockage',     sub: 'Espace utilisé',  color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /> },
]

const ACTION_CONFIG = {
  login:       { label: 'Connexion',      color: 'bg-emerald-50 text-emerald-700',  dot: 'bg-emerald-500' },
  logout:      { label: 'Déconnexion',    color: 'bg-slate-100 text-slate-600',     dot: 'bg-slate-400' },
  upload:      { label: 'Upload',         color: 'bg-blue-50 text-blue-700',        dot: 'bg-blue-500' },
  download:    { label: 'Téléchargement', color: 'bg-violet-50 text-violet-700',    dot: 'bg-violet-500' },
  update:      { label: 'Modification',   color: 'bg-amber-50 text-amber-700',      dot: 'bg-amber-500' },
  delete:      { label: 'Suppression',    color: 'bg-red-50 text-red-700',          dot: 'bg-red-500' },
  user_create: { label: 'Nouvel user',    color: 'bg-cyan-50 text-cyan-700',        dot: 'bg-cyan-500' },
  user_delete: { label: 'User supprimé',  color: 'bg-rose-50 text-rose-700',        dot: 'bg-rose-500' },
  role_change: { label: 'Rôle modifié',   color: 'bg-orange-50 text-orange-700',   dot: 'bg-orange-500' },
  export:      { label: 'Export',         color: 'bg-teal-50 text-teal-700',        dot: 'bg-teal-500' },
}

const roleColors = {
  admin:      'bg-red-50 text-red-700 ring-1 ring-red-100',
  archiviste: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  consultant: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  lecteur:    'bg-slate-100 text-slate-600',
}

const formatRelative = (iso) => {
  if (!iso) return '—'
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)    return 'Il y a quelques secondes'
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

const formatLastLogin = (iso) => {
  if (!iso) return 'Première connexion'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function Dashboard() {
  const { user, hasRole } = useAuth()
  const canUpload = hasRole('admin') || hasRole('archiviste') || hasRole('consultant')
  const navigate = useNavigate()
  const [adminStats, setAdminStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (hasRole('admin')) {
      getStats()
        .then(({ data }) => setAdminStats(data))
        .catch(() => {})
        .finally(() => setStatsLoading(false))
    } else {
      setStatsLoading(false)
    }
  }, [hasRole])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  const statValue = (label) => {
    if (statsLoading) return <span className="w-10 h-6 bg-slate-200 rounded animate-pulse inline-block" />
    if (!adminStats) return '—'
    if (label === 'Documents')    return adminStats.documents
    if (label === 'Utilisateurs') return adminStats.users
    if (label === 'Stockage')     return adminStats.storage
    if (label === 'Catégories')   return adminStats.roles?.length
    return '—'
  }

  const maxUploads = Math.max(...(adminStats?.uploads_chart?.map(d => d.count) || [1]), 1)

  return (
    <div className="space-y-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-2 capitalize">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {canUpload && (
          <button
            onClick={() => navigate('/documents')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-600/20 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau document
          </button>
        )}
      </div>

      {/* Stat cards — admin only */}
      {hasRole('admin') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
          {statCards.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center gap-6 hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
              <div className={`${s.color} w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-xl ${s.shadow}`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {s.icon}
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-800 leading-none">{statValue(s.label)}</p>
                <p className="text-slate-400 text-sm mt-2">{s.label}</p>
                <p className="text-slate-300 text-xs mt-0.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Recent activity */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Activité récente</h2>
              <p className="text-xs text-slate-400 mt-0.5">Dernières actions sur la plateforme</p>
            </div>
            {hasRole('admin') && (
              <button
                onClick={() => navigate('/admin/logs')}
                className="text-blue-600 text-xs font-semibold hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg"
              >
                Voir tout →
              </button>
            )}
          </div>

          {statsLoading ? (
            <div className="divide-y divide-slate-50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-5 px-8 py-5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-slate-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : adminStats?.activity?.length ? (
            <div className="divide-y divide-slate-50">
              {adminStats.activity.map((a, i) => {
                const cfg = ACTION_CONFIG[a.action] || { label: a.action, color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }
                return (
                  <div key={i} className="flex items-center gap-5 px-8 py-5 hover:bg-slate-50/60 transition-colors">
                    <div className={`w-3 h-3 rounded-full ${cfg.dot} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{a.description}</p>
                      <p className="text-xs text-slate-400 mt-1">{a.user} · {formatRelative(a.created_at)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-3">
              <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Aucune activité enregistrée
            </div>
          )}
        </div>

        {/* Quick profile */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Mon profil</h2>
            <p className="text-xs text-slate-400 mt-0.5">Informations de votre compte</p>
          </div>
          <div className="px-8 py-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold mb-5 shadow-2xl shadow-blue-200">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <p className="font-bold text-slate-800 text-lg">{user?.name}</p>
              <p className="text-slate-400 text-sm mt-1.5">{user?.email}</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {user?.roles?.map((r) => (
                  <span key={r.name} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${roleColors[r.name] || 'bg-slate-100 text-slate-600'}`}>
                    {r.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-7 border-t border-slate-100 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">Documents uploadés</span>
                <span className="text-slate-800 text-sm font-bold">
                  {user?.documents_count ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">Dernière connexion</span>
                <span className="text-slate-800 text-xs font-semibold text-right max-w-[140px]">
                  {formatLastLogin(user?.last_login)}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/profil')}
              className="w-full mt-7 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Modifier mon profil
            </button>
          </div>
        </div>
      </div>

      {/* Upload chart — admin only */}
      {hasRole('admin') && adminStats?.uploads_chart && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Uploads — 7 derniers jours</h2>
            <p className="text-xs text-slate-400 mt-0.5">Nombre de documents archivés par jour</p>
          </div>
          <div className="px-8 py-8">
            <div className="flex items-end gap-4 h-40">
              {adminStats.uploads_chart.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3">
                  <span className="text-xs font-bold text-slate-500">{d.count > 0 ? d.count : ''}</span>
                  <div className="w-full relative flex items-end" style={{ height: '96px' }}>
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-500 hover:to-blue-300 min-h-[4px]"
                      style={{ height: `${Math.max((d.count / maxUploads) * 96, d.count > 0 ? 10 : 4)}px` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{d.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
