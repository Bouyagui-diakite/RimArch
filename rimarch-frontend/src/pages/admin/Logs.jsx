import { useEffect, useState, useCallback } from 'react'
import { getLogs, getUsers, exportLogs, exportLogsPdf } from '../../api/admin'
import { downloadBlob } from '../../utils/download'
import {
  panelCls, Spinner, PageHeader, Button, EmptyState, Pagination,
  Tag, Field, inputCls, formatDateTime,
} from '../../components/ui'

/* Une pastille par type d'action : la couleur porte le sens, discrètement. */
const ACTION_LABELS = {
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

const ICON = {
  pdf:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
  csv:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  reset: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6 18L18 6M6 6l12 12" />,
  logs:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
}

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">{path}</svg>
)

const ActionTag = ({ action }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-muted">
    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${action.dot}`} />
    {action.label}
  </span>
)

export default function AdminLogs() {
  const [logs, setLogs]       = useState([])
  const [meta, setMeta]       = useState({})
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting]       = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [page, setPage]       = useState(1)
  const [filters, setFilters] = useState({ action: '', user_id: '', from: '', to: '' })

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page }
      if (filters.action)  params.action  = filters.action
      if (filters.user_id) params.user_id = filters.user_id
      if (filters.from)    params.from    = filters.from
      if (filters.to)      params.to      = filters.to
      const { data } = await getLogs(params)
      setLogs(data.data)
      setMeta({ total: data.total, lastPage: data.last_page, from: data.from, to: data.to })
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { fetchLogs() }, [fetchLogs])
  useEffect(() => { setPage(1) }, [filters])
  useEffect(() => { getUsers().then(({ data }) => setUsers(data)).catch(() => {}) }, [])

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }))
  const resetFilters = () => setFilters({ action: '', user_id: '', from: '', to: '' })

  const exportParams = () => {
    const params = {}
    if (filters.action)  params.action  = filters.action
    if (filters.user_id) params.user_id = filters.user_id
    if (filters.from)    params.from    = filters.from
    if (filters.to)      params.to      = filters.to
    return params
  }

  const handleExportPdf = async () => {
    setExportingPdf(true)
    try {
      const { data } = await exportLogsPdf(exportParams())
      downloadBlob(data, `rimarch_logs_${new Date().toISOString().slice(0,10)}.pdf`)
    } finally { setExportingPdf(false) }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const { data } = await exportLogs(exportParams())
      downloadBlob(data, `rimarch_logs_${new Date().toISOString().slice(0,10)}.csv`)
    } finally { setExporting(false) }
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="space-y-6">

      <PageHeader
        eyebrow="Administration"
        title="Journaux d’audit"
        sub={`${meta.total ?? '—'} événement${meta.total !== 1 ? 's' : ''} enregistré${meta.total !== 1 ? 's' : ''}`}
      >
        {hasFilters && (
          <Button variant="quiet" onClick={resetFilters} icon={<Icon path={ICON.reset} className="h-3.5 w-3.5" />}>
            Réinitialiser
          </Button>
        )}
        <Button onClick={handleExportPdf} loading={exportingPdf} icon={<Icon path={ICON.pdf} />}>PDF</Button>
        <Button onClick={handleExport} loading={exporting} icon={<Icon path={ICON.csv} />}>CSV</Button>
      </PageHeader>

      {/* ── Filtres ── */}
      <div className={`${panelCls} grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4`}>
        <Field label="Action">
          <select value={filters.action} onChange={(e) => setFilter('action', e.target.value)} className={inputCls}>
            <option value="">Toutes les actions</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="Utilisateur">
          <select value={filters.user_id} onChange={(e) => setFilter('user_id', e.target.value)} className={inputCls}>
            <option value="">Tous les utilisateurs</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
        <Field label="Du">
          <input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Au">
          <input type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} className={inputCls} />
        </Field>
      </div>

      {/* ── Journal ── */}
      <div className={`${panelCls} overflow-hidden`}>
        <div className="hidden grid-cols-12 gap-4 border-b border-line bg-raised px-6 py-3 lg:grid">
          <div className="eyebrow col-span-2 text-faint">Action</div>
          <div className="eyebrow col-span-3 text-faint">Description</div>
          <div className="eyebrow col-span-2 text-faint">Utilisateur</div>
          <div className="eyebrow col-span-2 text-faint">Entité</div>
          <div className="eyebrow col-span-1 text-faint">IP</div>
          <div className="eyebrow col-span-2 text-right text-faint">Date</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-faint">
            <Spinner className="h-7 w-7" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState title="Aucun événement" icon={<Icon path={ICON.logs} className="h-5 w-5" />}>
            Aucun enregistrement ne correspond à ces filtres.
          </EmptyState>
        ) : (
          <div className="divide-y divide-line">
            {logs.map((log) => {
              const action = ACTION_LABELS[log.action] || { label: log.action, dot: 'bg-faint' }
              return (
                <div key={log.id} className="transition-colors hover:bg-raised">

                  {/* Mobile */}
                  <div className="flex items-start gap-3 px-4 py-4 lg:hidden">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${action.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <ActionTag action={action} />
                        {log.user && <span className="text-[11.5px] text-faint">{log.user.name}</span>}
                      </div>
                      <p className="mt-1.5 text-[13px] text-ink">{log.description}</p>
                      <p className="mt-1 text-[11.5px] text-faint">{formatDateTime(log.created_at)}</p>
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="hidden grid-cols-12 items-center gap-4 px-6 py-3 lg:grid">
                    <div className="col-span-2"><ActionTag action={action} /></div>
                    <div className="col-span-3 truncate text-[13px] text-ink">{log.description}</div>
                    <div className="col-span-2 flex min-w-0 items-center gap-2">
                      {log.user ? (
                        <>
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink text-[10px] font-semibold text-canvas">
                            {log.user.name?.charAt(0)}
                          </span>
                          <span className="truncate text-[12.5px] text-muted">{log.user.name}</span>
                        </>
                      ) : <span className="text-[12.5px] italic text-faint">Système</span>}
                    </div>
                    <div className="col-span-2">
                      {log.model_type
                        ? <Tag className="font-mono">{log.model_type} #{log.model_id}</Tag>
                        : <span className="text-[12.5px] text-faint">—</span>}
                    </div>
                    <div className="col-span-1 truncate font-mono text-[11.5px] text-faint">{log.ip_address || '—'}</div>
                    <div className="col-span-2 whitespace-nowrap text-right text-[11.5px] text-faint">{formatDateTime(log.created_at)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Pagination
        page={page} lastPage={meta.lastPage} from={meta.from} to={meta.to}
        total={meta.total} unit="événements" onPage={setPage}
      />
    </div>
  )
}
