import { useEffect, useState, useCallback } from 'react'
import { getLogs, getUsers, exportLogs } from '../../api/admin'
import { downloadBlob } from '../../utils/download'

const ACTION_LABELS = {
  login:       { label: 'Connexion',      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  logout:      { label: 'Déconnexion',    color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  upload:      { label: 'Upload',         color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  download:    { label: 'Téléchargement', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  update:      { label: 'Modification',   color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  delete:      { label: 'Suppression',    color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  user_create: { label: 'Nouvel user',    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  user_delete: { label: 'User supprimé',  color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  role_change: { label: 'Rôle modifié',   color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
}

const formatDate = (iso) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export default function AdminLogs() {
  const [logs, setLogs]         = useState([])
  const [meta, setMeta]         = useState({})
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [exporting, setExporting] = useState(false)
  const [page, setPage]         = useState(1)
  const [filters, setFilters]   = useState({ action: '', user_id: '', from: '', to: '' })

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
  useEffect(() => {
    getUsers().then(({ data }) => setUsers(data)).catch(() => {})
  }, [])

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }))
  const resetFilters = () => setFilters({ action: '', user_id: '', from: '', to: '' })

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = {}
      if (filters.action)  params.action  = filters.action
      if (filters.user_id) params.user_id = filters.user_id
      if (filters.from)    params.from    = filters.from
      if (filters.to)      params.to      = filters.to
      const { data } = await exportLogs(params)
      downloadBlob(data, `rimarch_logs_${new Date().toISOString().slice(0,10)}.csv`)
    } finally { setExporting(false) }
  }

  const hasFilters = Object.values(filters).some(Boolean)

  const selectCls = "w-full bg-slate-50 dark:bg-[#0d1018] border-2 border-slate-200 dark:border-[#1e2436] rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-500/10 transition-all"

  return (
    <div className="space-y-8">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Journaux d'audit</h1>
          <p className="text-slate-400 text-sm mt-2">
            {meta.total ?? '—'} événement{meta.total !== 1 ? 's' : ''} enregistré{meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button onClick={resetFilters}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 border border-slate-200 dark:border-[#1e2436] hover:border-red-200 dark:hover:border-red-500/20 px-4 py-2.5 rounded-xl transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Réinitialiser
            </button>
          )}
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 bg-white dark:bg-[#111520] hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-60 text-slate-700 dark:text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors border border-slate-200 dark:border-[#1e2436] shadow-sm">
            {exporting ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-[#111520] rounded-2xl border border-slate-200 dark:border-[#1e2436] p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Action</label>
          <select value={filters.action} onChange={(e) => setFilter('action', e.target.value)} className={selectCls}>
            <option value="">Toutes les actions</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Utilisateur</label>
          <select value={filters.user_id} onChange={(e) => setFilter('user_id', e.target.value)} className={selectCls}>
            <option value="">Tous les utilisateurs</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Du</label>
          <input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} className={selectCls} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Au</label>
          <input type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} className={selectCls} />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-[#111520] rounded-2xl border border-slate-200 dark:border-[#1e2436] overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50 dark:bg-[#0d1018] border-b border-slate-100 dark:border-[#1e2436] text-xs font-bold text-slate-400 uppercase tracking-widest">
          <div className="col-span-2">Action</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-2">Utilisateur</div>
          <div className="col-span-2">Entité</div>
          <div className="col-span-1">IP</div>
          <div className="col-span-1 text-right">Date</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-semibold">Aucun log trouvé</p>
            <p className="text-slate-400 text-sm mt-1">Essayez d'autres filtres</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-[#1e2436]">
            {logs.map((log) => {
              const action = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20' }
              return (
                <div key={log.id} className="grid grid-cols-12 gap-4 px-8 py-4 items-center hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="col-span-2">
                    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${action.color}`}>
                      {action.label}
                    </span>
                  </div>
                  <div className="col-span-4 text-sm text-slate-700 dark:text-slate-300 truncate">{log.description}</div>
                  <div className="col-span-2 flex items-center gap-2 min-w-0">
                    {log.user ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {log.user.name?.charAt(0)}
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400 truncate">{log.user.name}</span>
                      </>
                    ) : (
                      <span className="text-sm text-slate-400">Système</span>
                    )}
                  </div>
                  <div className="col-span-2 text-sm text-slate-500">
                    {log.model_type ? (
                      <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-xs font-medium text-slate-600 dark:text-slate-400">
                        {log.model_type} #{log.model_id}
                      </span>
                    ) : '—'}
                  </div>
                  <div className="col-span-1 text-xs text-slate-400 font-mono truncate">{log.ip_address || '—'}</div>
                  <div className="col-span-1 text-xs text-slate-400 text-right whitespace-nowrap">{formatDate(log.created_at)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.lastPage > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-500">{meta.from}–{meta.to} sur {meta.total} événements</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-[#111520] border border-slate-200 dark:border-[#1e2436] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              ← Précédent
            </button>
            <button onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))} disabled={page === meta.lastPage}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-[#111520] border border-slate-200 dark:border-[#1e2436] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
