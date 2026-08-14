import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getStats } from '../api/admin'
import { getUserStats } from '../api/profile'

/* ─────────────── Icônes ─────────────── */
const ICONS = {
  doc:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  users:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  shield: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  disk:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />,
  cal:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  trash:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
  logs:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  plus:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 5v14M5 12h14" />,
}

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">{path}</svg>
)

/* ─────────────── Config ─────────────── */
const adminStatCards = [
  { key: 'documents', label: 'Documents', sub: 'Total archivé',  icon: ICONS.doc },
  { key: 'users',     label: 'Comptes',   sub: 'Utilisateurs',   icon: ICONS.users },
  { key: 'roles',     label: 'Rôles',     sub: 'Habilitations',  icon: ICONS.shield },
  { key: 'storage',   label: 'Stockage',  sub: 'Espace occupé',  icon: ICONS.disk },
]

const userStatCards = [
  { key: 'documents_count',      label: 'Documents', sub: 'Déposés par vous', icon: ICONS.doc },
  { key: 'storage_used',         label: 'Stockage',  sub: 'Espace occupé',    icon: ICONS.disk },
  { key: 'documents_this_month', label: 'Ce mois',   sub: 'Nouveaux dépôts',  icon: ICONS.cal },
]

const ACTION_CONFIG = {
  login:       { label: 'Connexion',      dot: 'bg-moss' },
  logout:      { label: 'Déconnexion',    dot: 'bg-faint' },
  upload:      { label: 'Dépôt',          dot: 'bg-cobalt' },
  download:    { label: 'Téléchargement', dot: 'bg-plum' },
  update:      { label: 'Modification',   dot: 'bg-clay' },
  delete:      { label: 'Suppression',    dot: 'bg-[#c25048]' },
  user_create: { label: 'Nouvel utilisateur', dot: 'bg-moss' },
  user_delete: { label: 'Compte supprimé',    dot: 'bg-[#c25048]' },
  role_change: { label: 'Rôle modifié',   dot: 'bg-clay' },
  export:      { label: 'Export',         dot: 'bg-plum' },
}

const roleStyles = {
  admin:      'border-[#c25048]/40 text-[#c25048]',
  archiviste: 'border-cobalt/40 text-accent',
  consultant: 'border-clay/40 text-clay',
  lecteur:    'border-line text-muted',
}

const fileLabel = (type) => {
  if (type?.includes('pdf')) return 'PDF'
  if (type?.includes('word') || type?.includes('doc')) return 'DOC'
  if (type?.includes('sheet') || type?.includes('xls') || type?.includes('excel') || type?.includes('csv')) return 'XLS'
  if (type?.includes('image')) return 'IMG'
  if (type?.includes('zip') || type?.includes('rar')) return 'ZIP'
  return 'FIC'
}

const formatRelative = (iso) => {
  if (!iso) return '—'
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return "À l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

const formatLastLogin = (iso) => {
  if (!iso) return 'Première connexion'
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/* ─────────────── Primitives ─────────────── */
const panel = 'rounded-[14px] border border-line bg-surface'

const Skeleton = ({ className }) => (
  <div className={`animate-pulse rounded bg-ink/[0.07] dark:bg-white/[0.06] ${className}`} />
)

function SectionHead({ title, sub, action }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-line px-6 py-4">
      <div>
        <h2 className="font-display text-[19px] leading-none text-ink">{title}</h2>
        {sub && <p className="mt-1.5 text-[12px] text-faint">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

function LinkButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="group flex shrink-0 items-center gap-1.5 text-[12px] font-semibold text-accent transition hover:gap-2.5"
    >
      {children}
      <span aria-hidden="true">→</span>
    </button>
  )
}

function StatCell({ label, sub, icon, value, loading, index }) {
  return (
    <div className="relative flex flex-col justify-between gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow text-faint">{label}</p>
          <p className="mt-1 text-[12px] text-muted">{sub}</p>
        </div>
        <span className="text-faint transition-colors group-hover:text-accent">
          <Icon path={icon} className="h-[18px] w-[18px]" />
        </span>
      </div>
      <div className="flex items-end justify-between">
        {loading
          ? <Skeleton className="h-9 w-20" />
          : <p className="font-display text-[31px] leading-[0.95] text-ink tabular-nums">{value}</p>
        }
        <span className="font-display text-[12px] text-faint/70">{String(index + 1).padStart(2, '0')}</span>
      </div>
    </div>
  )
}

function QuickAction({ label, hint, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3.5 px-6 py-3.5 text-left transition-colors hover:bg-raised"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-muted transition-colors group-hover:border-accent/40 group-hover:text-accent">
        <Icon path={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold text-ink">{label}</span>
        <span className="block truncate text-[11.5px] text-faint">{hint}</span>
      </span>
      <span className="text-faint transition-all group-hover:translate-x-0.5 group-hover:text-accent">→</span>
    </button>
  )
}

function EmptyState({ children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-line text-faint">
        <Icon path={ICONS.doc} className="h-5 w-5" />
      </div>
      <p className="text-[13px] text-faint">{children}</p>
    </div>
  )
}

/* ─────────────── Page ─────────────── */
export default function Dashboard() {
  const { user, hasRole } = useAuth()
  const isAdmin = hasRole('admin')
  const canUpload = hasRole('admin') || hasRole('archiviste') || hasRole('consultant')
  const navigate = useNavigate()

  const [adminStats, setAdminStats] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (isAdmin) {
      getStats().then(({ data }) => setAdminStats(data)).catch(() => {}).finally(() => setStatsLoading(false))
    } else {
      getUserStats().then(({ data }) => setUserStats(data)).catch(() => {}).finally(() => setStatsLoading(false))
    }
  }, [isAdmin])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  const adminStatValue = (key) => {
    if (!adminStats) return '—'
    if (key === 'roles') return adminStats.roles?.length ?? '—'
    return adminStats[key] ?? '—'
  }

  const chart = adminStats?.uploads_chart ?? []
  const maxUploads = Math.max(...(chart.map((d) => d.count) || [1]), 1)

  return (
    <div className="space-y-6">

      {/* ══ Bandeau d'accueil ══ */}
      <section className="relative overflow-hidden rounded-[18px] bg-[#0b0d16] grain">
        <div className="pointer-events-none absolute -right-16 -top-24 h-[340px] w-[340px] rounded-full bg-cobalt/30 blur-[100px]" />
        <div className="blueprint pointer-events-none absolute inset-0 opacity-50" />
        <span
          aria-hidden="true"
          className="font-display pointer-events-none absolute -bottom-12 -right-2 hidden select-none text-[120px] leading-none text-white/[0.04] sm:block"
        >
          RIMArch
        </span>

        <div className="relative flex flex-col gap-7 px-7 py-9 sm:px-10 sm:py-11 lg:flex-row lg:items-end lg:justify-between">
          <div className="rise">
            <p className="eyebrow text-white/40">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="font-display mt-3 text-[30px] leading-[1.06] text-white sm:text-[40px]">
              {greeting()},{' '}
              <span className="text-cobalt-glow">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-white/50">
              {isAdmin
                ? 'Vue administrateur — état de la plateforme, activité et habilitations.'
                : 'Votre espace personnel : dépôts récents, stockage et activité.'}
            </p>
          </div>

          <div className="rise delay-2 flex flex-wrap items-center gap-3">
            {canUpload && (
              <button
                onClick={() => navigate('/documents')}
                className="group flex items-center gap-2.5 rounded-lg bg-white px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0b0d16] transition-all hover:bg-cobalt-lift hover:text-white"
              >
                <Icon path={ICONS.plus} className="h-4 w-4" />
                Nouveau document
              </button>
            )}
            <button
              onClick={() => navigate(isAdmin ? '/admin/logs' : '/documents')}
              className="rounded-lg border border-white/20 px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/80 transition-all hover:border-white/40 hover:text-white"
            >
              {isAdmin ? 'Journaux' : 'Mes documents'}
            </button>
          </div>
        </div>
      </section>

      {/* ══ Chiffres clés ══ */}
      <section className={`${panel} overflow-hidden`}>
        <div className={`grid divide-line ${isAdmin ? 'grid-cols-2 divide-x divide-y lg:grid-cols-4 lg:divide-y-0' : 'grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0'}`}>
          {(isAdmin ? adminStatCards : userStatCards).map((s, i) => (
            <div key={s.key} className="group">
              <StatCell
                label={s.label}
                sub={s.sub}
                icon={s.icon}
                index={i}
                loading={statsLoading}
                value={isAdmin ? adminStatValue(s.key) : (userStats?.[s.key] ?? '—')}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ══ Grille principale ══ */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ── Colonne large ── */}
        <div className="flex flex-col gap-6 xl:col-span-2">

          <section className={`${panel} overflow-hidden`}>
            <SectionHead
              title={isAdmin ? 'Activité récente' : 'Mes derniers dépôts'}
              sub={isAdmin ? 'Dernières actions enregistrées sur la plateforme' : 'Vos documents les plus récents'}
              action={
                <LinkButton onClick={() => navigate(isAdmin ? '/admin/logs' : '/documents')}>
                  {isAdmin ? 'Tout le journal' : 'Tous mes documents'}
                </LinkButton>
              }
            />

            {statsLoading ? (
              <div className="divide-y divide-line">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-2.5 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isAdmin ? (
              adminStats?.activity?.length ? (
                <ul className="divide-y divide-line">
                  {adminStats.activity.map((a) => {
                    const cfg = ACTION_CONFIG[a.action] || { label: a.action, dot: 'bg-faint' }
                    return (
                      <li key={a.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-raised">
                        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line">
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-medium text-ink">{a.description}</p>
                          <p className="mt-0.5 text-[11.5px] text-faint">
                            {a.user} · {formatRelative(a.created_at)}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-muted">
                          {cfg.label}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ) : <EmptyState>Aucune activité enregistrée pour le moment.</EmptyState>
            ) : (
              userStats?.recent_uploads?.length ? (
                <ul className="divide-y divide-line">
                  {userStats.recent_uploads.map((doc) => (
                    <li key={doc.id}>
                      <button
                        onClick={() => navigate(`/documents/${doc.id}`)}
                        className="group flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-raised"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-[10px] font-semibold tracking-wide text-muted transition-colors group-hover:border-accent/40 group-hover:text-accent">
                          {fileLabel(doc.file_type)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium text-ink">{doc.title}</span>
                          <span className="mt-0.5 block text-[11.5px] text-faint">
                            {doc.categorie} · {formatRelative(doc.created_at)}
                          </span>
                        </span>
                        <span className="text-faint transition-all group-hover:translate-x-0.5 group-hover:text-accent">→</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState>Vous n’avez encore déposé aucun document.</EmptyState>
            )}
          </section>

          {/* ── Graphique (admin) ── */}
          {isAdmin && (
            <section className={`${panel} overflow-hidden`}>
              <SectionHead
                title="Dépôts — 7 derniers jours"
                sub="Nombre de documents archivés par jour"
                action={
                  <span className="flex items-center gap-2 text-[11.5px] text-faint">
                    <span className="h-2 w-2 rounded-full bg-cobalt" />
                    Dépôts
                  </span>
                }
              />
              <div className="px-6 py-7">
                {statsLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : chart.length ? (
                  <div className="flex items-end gap-2 sm:gap-4">
                    {chart.map((d) => {
                      const height = Math.max(Math.round((d.count / maxUploads) * 150), d.count > 0 ? 10 : 3)
                      return (
                        <div key={d.date} className="group flex flex-1 flex-col items-center gap-2.5">
                          <span className="font-display text-[13px] text-ink tabular-nums opacity-60 transition-opacity group-hover:opacity-100">
                            {d.count > 0 ? d.count : '—'}
                          </span>
                          <div
                            title={`${d.count} dépôt(s)`}
                            style={{ height: `${height}px` }}
                            className="w-full max-w-[52px] rounded-t-[4px] bg-gradient-to-t from-cobalt-deep to-cobalt-lift opacity-85 transition-opacity duration-300 group-hover:opacity-100"
                          />
                          <span className="w-full border-t border-line pt-2 text-center text-[11px] text-faint">{d.date}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : <EmptyState>Pas encore de données à afficher.</EmptyState>}
              </div>
            </section>
          )}

          {/* ── Activité personnelle (non-admin) ── */}
          {!isAdmin && (
            <section className={`${panel} overflow-hidden`}>
              <SectionHead title="Mon activité" sub="Vos dernières actions sur la plateforme" />
              {statsLoading ? (
                <div className="divide-y divide-line">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2 px-6 py-4">
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-2.5 w-1/4" />
                    </div>
                  ))}
                </div>
              ) : userStats?.recent_activity?.length ? (
                <ul className="divide-y divide-line">
                  {userStats.recent_activity.map((a) => {
                    const cfg = ACTION_CONFIG[a.action] || { label: a.action, dot: 'bg-faint' }
                    return (
                      <li key={a.id} className="flex items-center gap-4 px-6 py-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line">
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-medium text-ink">{a.description}</p>
                          <p className="mt-0.5 text-[11.5px] text-faint">{formatRelative(a.created_at)}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-muted">
                          {cfg.label}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="px-6 py-12 text-center text-[13px] text-faint">Aucune activité récente.</p>
              )}
            </section>
          )}
        </div>

        {/* ── Colonne latérale ── */}
        <div className="flex flex-col gap-6">

          {/* Carte profil */}
          <section className={`${panel} overflow-hidden`}>
            <div className="relative overflow-hidden border-b border-white/10 bg-[#0b0d16] px-6 py-6 grain">
              <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-cobalt/30 blur-3xl" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <span className="font-display text-[22px] leading-none text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-[18px] leading-tight text-white">{user?.name}</p>
                  <p className="mt-0.5 truncate text-[12px] text-white/45">{user?.email}</p>
                </div>
              </div>
              <div className="relative mt-4 flex flex-wrap gap-1.5">
                {user?.roles?.map((r) => (
                  <span
                    key={r.name}
                    className="rounded-full border border-white/20 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.1em] text-white/70"
                  >
                    {r.label}
                  </span>
                ))}
              </div>
            </div>

            <dl className="divide-y divide-line">
              <div className="flex items-center justify-between px-6 py-3.5">
                <dt className="text-[12.5px] text-muted">Documents déposés</dt>
                <dd className="font-display text-[15px] text-ink tabular-nums">{user?.documents_count ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-6 py-3.5">
                <dt className="text-[12.5px] text-muted">Dernière connexion</dt>
                <dd className="text-right text-[11.5px] font-medium leading-snug text-ink">{formatLastLogin(user?.last_login)}</dd>
              </div>
            </dl>

            <div className="border-t border-line p-3">
              <button
                onClick={() => navigate('/profil')}
                className="w-full rounded-lg border border-line py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted transition-all hover:border-ink hover:text-ink"
              >
                Modifier le profil
              </button>
            </div>
          </section>

          {/* Accès rapides */}
          <section className={`${panel} overflow-hidden`}>
            <SectionHead title="Accès rapides" sub="Les pages les plus utilisées" />
            <div className="divide-y divide-line">
              <QuickAction label="Documents" hint="Parcourir et rechercher le fonds" icon={ICONS.doc} onClick={() => navigate('/documents')} />
              {isAdmin ? (
                <>
                  <QuickAction label="Utilisateurs" hint="Comptes et habilitations" icon={ICONS.users} onClick={() => navigate('/admin/utilisateurs')} />
                  <QuickAction label="Journaux" hint="Traçabilité des actions" icon={ICONS.logs} onClick={() => navigate('/admin/logs')} />
                </>
              ) : (
                <QuickAction label="Mon profil" hint="Informations et sécurité" icon={ICONS.users} onClick={() => navigate('/profil')} />
              )}
              <QuickAction label="Corbeille" hint="Documents supprimés récemment" icon={ICONS.trash} onClick={() => navigate('/corbeille')} />
            </div>
          </section>

          {/* Rôles définis (admin) */}
          {isAdmin && adminStats?.roles?.length > 0 && (
            <section className={`${panel} overflow-hidden`}>
              <SectionHead title="Habilitations" sub="Rôles définis sur la plateforme" />
              <div className="flex flex-wrap gap-2 px-6 py-5">
                {adminStats.roles.map((r) => {
                  const name = typeof r === 'string' ? r : (r.name ?? r.label)
                  const label = typeof r === 'string' ? r : (r.label ?? r.name)
                  return (
                    <span
                      key={name}
                      className={`rounded-full border px-3 py-1.5 text-[11.5px] font-medium ${roleStyles[name] || 'border-line text-muted'}`}
                    >
                      {label}
                    </span>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
