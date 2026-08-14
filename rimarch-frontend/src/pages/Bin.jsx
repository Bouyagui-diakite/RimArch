import { useEffect, useState } from 'react'
import { getBinDocuments, restoreDocument, forceDeleteDocument, emptyBin } from '../api/documents'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import ConfirmModal from '../components/ConfirmModal'
import {
  panelCls, Spinner, PageHeader, Button, IconButton, EmptyState, Notice,
  FileTag, formatDate,
} from '../components/ui'

const daysLeft = (deletedAt) => Math.max(0, 30 - Math.floor((Date.now() - new Date(deletedAt)) / (1000 * 60 * 60 * 24)))

const ICON = {
  restore: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />,
  trash:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
}

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">{path}</svg>
)

/* Compte à rebours avant purge définitive */
function DaysLeftBadge({ days }) {
  const urgent = days <= 3
  const soon   = days <= 7

  const cls = urgent
    ? 'border-[#c25048]/40 text-[#c25048]'
    : soon
      ? 'border-clay/40 text-clay'
      : 'border-line text-muted'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${cls}`}>
      {urgent && <span className={`h-1.5 w-1.5 rounded-full bg-[#c25048] ${days === 0 ? 'animate-pulse' : ''}`} />}
      {days === 0 ? "Expire aujourd'hui" : `${days} j restant${days > 1 ? 's' : ''}`}
    </span>
  )
}

export default function Bin() {
  const { hasRole } = useAuth()
  const { addToast } = useToast()
  const canDelete = hasRole('admin') || hasRole('archiviste')

  const [docs, setDocs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [restoring, setRestoring] = useState(null)
  const [deleting, setDeleting]   = useState(null)
  const [confirmDoc, setConfirmDoc] = useState(null)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const [emptying, setEmptying]   = useState(false)

  const load = () => {
    setLoading(true)
    getBinDocuments()
      .then(({ data }) => setDocs(data))
      .catch(() => addToast('Erreur lors du chargement de la corbeille.', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRestore = async (doc) => {
    setRestoring(doc.id)
    try {
      await restoreDocument(doc.id)
      setDocs(prev => prev.filter(d => d.id !== doc.id))
      addToast(`« ${doc.title} » restauré avec succès.`)
    } catch { addToast('Erreur lors de la restauration.', 'error') }
    finally { setRestoring(null) }
  }

  const handleForceDelete = async () => {
    setDeleting(confirmDoc.id)
    try {
      await forceDeleteDocument(confirmDoc.id)
      setDocs(prev => prev.filter(d => d.id !== confirmDoc.id))
      setConfirmDoc(null)
      addToast(`« ${confirmDoc.title} » supprimé définitivement.`)
    } catch { addToast('Erreur lors de la suppression.', 'error') }
    finally { setDeleting(null) }
  }

  const handleEmptyBin = async () => {
    setEmptying(true)
    try {
      await emptyBin()
      setDocs([])
      setConfirmEmpty(false)
      addToast('Corbeille vidée.')
    } catch { addToast('Erreur lors du vidage.', 'error') }
    finally { setEmptying(false) }
  }

  return (
    <div className="space-y-6">

      <PageHeader
        eyebrow="Conservation"
        title="Corbeille"
        sub={`${docs.length} document${docs.length !== 1 ? 's' : ''} en attente de purge`}
      >
        {canDelete && docs.length > 0 && (
          <Button variant="danger" onClick={() => setConfirmEmpty(true)} icon={<Icon path={ICON.trash} />}>
            Vider la corbeille
          </Button>
        )}
      </PageHeader>

      <Notice tone="warning">
        <span>
          Les documents placés ici sont <strong className="font-semibold">définitivement effacés au bout de 30 jours</strong>. Restaurez-les avant expiration si nécessaire.
        </span>
      </Notice>

      <div className={`${panelCls} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-24 text-faint">
            <Spinner className="h-7 w-7" />
          </div>
        ) : docs.length === 0 ? (
          <EmptyState
            title="La corbeille est vide"
            icon={<Icon path={ICON.trash} className="h-5 w-5" />}
          >
            Les documents supprimés apparaîtront ici pendant 30 jours.
          </EmptyState>
        ) : (
          <>
            {/* En-tête desktop */}
            <div className="hidden grid-cols-12 gap-4 border-b border-line bg-raised px-6 py-3 lg:grid">
              <div className="eyebrow col-span-4 text-faint">Document</div>
              <div className="eyebrow col-span-2 text-faint">Supprimé par</div>
              <div className="eyebrow col-span-2 text-faint">Date</div>
              <div className="eyebrow col-span-2 text-faint">Purge</div>
              <div className="eyebrow col-span-2 text-right text-faint">Actions</div>
            </div>

            <div className="divide-y divide-line">
              {docs.map((doc) => {
                const days = daysLeft(doc.deleted_at)
                const isUrgent = days <= 3
                return (
                  <div key={doc.id} className={`relative transition-colors hover:bg-raised ${isUrgent ? 'before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-[#c25048]' : ''}`}>

                    {/* Mobile */}
                    <div className="flex items-start gap-3 px-4 py-4 lg:hidden">
                      <FileTag type={doc.file_type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold text-ink">{doc.title}</p>
                        <p className="mt-0.5 truncate text-[11.5px] text-faint">{doc.file_name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <DaysLeftBadge days={days} />
                          <span className="text-[11.5px] text-faint">{doc.deleted_by?.name ?? '—'}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" onClick={() => handleRestore(doc)} loading={restoring === doc.id} disabled={!!restoring} icon={<Icon path={ICON.restore} className="h-3.5 w-3.5" />}>
                            Restaurer
                          </Button>
                          {canDelete && (
                            <Button size="sm" variant="danger" onClick={() => setConfirmDoc(doc)} loading={deleting === doc.id} disabled={!!deleting} icon={<Icon path={ICON.trash} className="h-3.5 w-3.5" />}>
                              Supprimer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Desktop */}
                    <div className="hidden grid-cols-12 items-center gap-4 px-6 py-3.5 lg:grid">
                      <div className="col-span-4 flex min-w-0 items-center gap-3">
                        <FileTag type={doc.file_type} />
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-medium text-ink">{doc.title}</p>
                          <p className="mt-0.5 truncate text-[11.5px] text-faint">{doc.file_name}</p>
                        </div>
                      </div>
                      <div className="col-span-2 flex min-w-0 items-center gap-2">
                        {doc.deleted_by ? (
                          <>
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink text-[10px] font-semibold text-canvas">
                              {doc.deleted_by.name?.charAt(0)}
                            </span>
                            <span className="truncate text-[12.5px] text-muted">{doc.deleted_by.name}</span>
                          </>
                        ) : <span className="text-[12.5px] text-faint">—</span>}
                      </div>
                      <div className="col-span-2 text-[12.5px] text-muted">{formatDate(doc.deleted_at)}</div>
                      <div className="col-span-2"><DaysLeftBadge days={days} /></div>
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <Button size="sm" onClick={() => handleRestore(doc)} loading={restoring === doc.id} disabled={!!restoring} icon={<Icon path={ICON.restore} className="h-3.5 w-3.5" />}>
                          Restaurer
                        </Button>
                        {canDelete && (
                          <IconButton label="Supprimer définitivement" danger onClick={() => setConfirmDoc(doc)} loading={deleting === doc.id} disabled={!!deleting}>
                            <Icon path={ICON.trash} />
                          </IconButton>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {confirmDoc && (
        <ConfirmModal title="Supprimer définitivement"
          message={`Supprimer définitivement « ${confirmDoc.title} » ? Le fichier sera effacé du serveur, sans retour possible.`}
          confirmLabel="Supprimer" loading={!!deleting}
          onConfirm={handleForceDelete} onCancel={() => setConfirmDoc(null)} />
      )}
      {confirmEmpty && (
        <ConfirmModal title="Vider la corbeille"
          message={`Supprimer définitivement les ${docs.length} document(s) présents dans la corbeille ? Cette action est irréversible.`}
          confirmLabel="Vider" loading={emptying}
          onConfirm={handleEmptyBin} onCancel={() => setConfirmEmpty(false)} />
      )}
    </div>
  )
}
