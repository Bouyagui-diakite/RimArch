import { useState, useEffect } from 'react'
import { createShareLink, getShareLinks, revokeShareLink } from '../api/documents'
import { useToast } from '../hooks/useToast'

const EXPIRY_OPTIONS = [
  { value: 1,  label: '24 heures' },
  { value: 7,  label: '7 jours' },
  { value: 30, label: '30 jours' },
]

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

function buildShareUrl(token) {
  return `${window.location.origin}/share/${token}`
}

export default function ShareModal({ doc, onClose }) {
  const { addToast } = useToast()
  const [links, setLinks]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [revoking, setRevoking]   = useState(null)
  const [expiresIn, setExpiresIn] = useState(7)
  const [copied, setCopied]       = useState(null)

  useEffect(() => {
    getShareLinks(doc.id)
      .then(({ data }) => setLinks(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [doc.id])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const { data } = await createShareLink(doc.id, { expires_in: expiresIn })
      setLinks(prev => [data, ...prev])
      addToast('Lien de partage créé.')
    } catch {
      addToast('Erreur lors de la création du lien.', 'error')
    } finally { setCreating(false) }
  }

  const handleRevoke = async (token) => {
    setRevoking(token)
    try {
      await revokeShareLink(token)
      setLinks(prev => prev.filter(l => l.token !== token))
      addToast('Lien révoqué.')
    } catch {
      addToast('Erreur lors de la révocation.', 'error')
    } finally { setRevoking(null) }
  }

  const handleCopy = (token) => {
    navigator.clipboard.writeText(buildShareUrl(token))
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const activeLinks  = links.filter(l => !l.expires_at || new Date(l.expires_at) > new Date())
  const expiredLinks = links.filter(l => l.expires_at && new Date(l.expires_at) <= new Date())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-[#111520] rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-[#1e2436] flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-[#1e2436] shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Partager le document</h2>
            <p className="text-slate-400 text-sm mt-1 truncate max-w-[280px]">{doc.title}</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-7 space-y-7 overflow-y-auto flex-1">

          {/* Create new link */}
          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Créer un nouveau lien</p>
            <div className="flex gap-3">
              <select value={expiresIn} onChange={e => setExpiresIn(Number(e.target.value))}
                className="flex-1 bg-slate-50 dark:bg-[#0d1018] border-2 border-slate-200 dark:border-[#1e2436] rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-400 transition-all">
                {EXPIRY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button onClick={handleCreate} disabled={creating}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-2xl text-sm transition-colors">
                {creating ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
                Générer
              </button>
            </div>
          </div>

          {/* Active links */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : activeLinks.length > 0 && (
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                Liens actifs ({activeLinks.length})
              </p>
              <div className="space-y-3">
                {activeLinks.map(link => (
                  <div key={link.token}
                    className="flex items-center gap-3 bg-slate-50 dark:bg-[#0d1018] border border-slate-200 dark:border-[#1e2436] rounded-2xl px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-slate-500 truncate">{buildShareUrl(link.token)}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Expire le {formatDate(link.expires_at)} · {link.download_count} téléchargement{link.download_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button onClick={() => handleCopy(link.token)}
                      title="Copier le lien"
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shrink-0 ${
                        copied === link.token
                          ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                      }`}>
                      {copied === link.token ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <button onClick={() => handleRevoke(link.token)} disabled={revoking === link.token}
                      title="Révoquer"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40 transition-all shrink-0">
                      {revoking === link.token ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expired links */}
          {expiredLinks.length > 0 && (
            <div>
              <p className="text-sm font-bold text-slate-400 mb-3">Liens expirés ({expiredLinks.length})</p>
              <div className="space-y-2">
                {expiredLinks.map(link => (
                  <div key={link.token}
                    className="flex items-center gap-3 bg-slate-50 dark:bg-[#0d1018] border border-slate-100 dark:border-[#1e2436] rounded-2xl px-4 py-3 opacity-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-slate-400 truncate">{buildShareUrl(link.token)}</p>
                      <p className="text-xs text-slate-400 mt-1">Expiré le {formatDate(link.expires_at)}</p>
                    </div>
                    <button onClick={() => handleRevoke(link.token)} disabled={revoking === link.token}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40 transition-all shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && links.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-4">
              Aucun lien de partage. Générez-en un ci-dessus.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
