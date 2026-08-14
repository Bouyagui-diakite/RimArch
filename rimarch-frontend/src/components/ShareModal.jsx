import { useState, useEffect } from 'react'
import { createShareLink, getShareLinks, revokeShareLink } from '../api/documents'
import { useToast } from '../hooks/useToast'
import { Modal, Button, IconButton, Skeleton, inputCls, formatDate } from './ui'

const EXPIRY_OPTIONS = [
  { value: 1,  label: '24 heures' },
  { value: 7,  label: '7 jours' },
  { value: 30, label: '30 jours' },
]

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
    <Modal eyebrow="Diffusion" title="Partager le document" sub={doc.title} onClose={onClose} size="lg">
      <div className="space-y-7">

        {/* ── Nouveau lien ── */}
        <div>
          <p className="eyebrow mb-2.5 text-muted">Créer un lien public</p>
          <div className="flex gap-2.5">
            <select value={expiresIn} onChange={e => setExpiresIn(Number(e.target.value))} className={inputCls}>
              {EXPIRY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>Valable {o.label}</option>
              ))}
            </select>
            <Button variant="primary" onClick={handleCreate} loading={creating} className="shrink-0">
              Générer
            </Button>
          </div>
          <p className="mt-2 text-[11.5px] text-faint">
            Toute personne disposant du lien pourra télécharger ce document jusqu’à son expiration.
          </p>
        </div>

        {/* ── Liens actifs ── */}
        {loading ? (
          <div className="space-y-2.5">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : activeLinks.length > 0 && (
          <div>
            <p className="eyebrow mb-2.5 text-muted">Liens actifs ({activeLinks.length})</p>
            <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
              {activeLinks.map(link => (
                <li key={link.token} className="flex items-center gap-3 bg-raised px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[11.5px] text-ink">{buildShareUrl(link.token)}</p>
                    <p className="mt-1 text-[11.5px] text-faint">
                      Expire le {formatDate(link.expires_at)} · {link.download_count} téléchargement{link.download_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <IconButton
                    label="Copier le lien"
                    onClick={() => handleCopy(link.token)}
                    className={copied === link.token ? 'text-moss' : ''}
                  >
                    {copied === link.token ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </IconButton>
                  <IconButton label="Révoquer" danger onClick={() => handleRevoke(link.token)} loading={revoking === link.token}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </IconButton>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Liens expirés ── */}
        {expiredLinks.length > 0 && (
          <div>
            <p className="eyebrow mb-2.5 text-faint">Liens expirés ({expiredLinks.length})</p>
            <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line opacity-60">
              {expiredLinks.map(link => (
                <li key={link.token} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[11.5px] text-muted line-through">{buildShareUrl(link.token)}</p>
                    <p className="mt-1 text-[11.5px] text-faint">Expiré le {formatDate(link.expires_at)}</p>
                  </div>
                  <IconButton label="Supprimer" danger onClick={() => handleRevoke(link.token)} loading={revoking === link.token}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </IconButton>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loading && links.length === 0 && (
          <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-[13px] text-faint">
            Aucun lien de partage pour ce document.
          </p>
        )}
      </div>
    </Modal>
  )
}
