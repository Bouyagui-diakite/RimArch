import { useEffect, useState } from 'react'
import { getBinDocuments, restoreDocument, forceDeleteDocument, emptyBin } from '../api/documents'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import ConfirmModal from '../components/ConfirmModal'

const fileIcon = (type) => {
  if (type?.includes('pdf'))                           return { bg: 'bg-red-100 dark:bg-red-500/10',      text: 'text-red-600 dark:text-red-400',      label: 'PDF' }
  if (type?.includes('word') || type?.includes('doc')) return { bg: 'bg-blue-100 dark:bg-blue-500/10',    text: 'text-blue-600 dark:text-blue-400',    label: 'DOC' }
  if (type?.includes('sheet') || type?.includes('xls'))return { bg: 'bg-emerald-100 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'XLS' }
  if (type?.includes('image'))                         return { bg: 'bg-purple-100 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', label: 'IMG' }
  return { bg: 'bg-slate-100 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', label: 'FILE' }
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

const daysLeft = (deletedAt) => {
  const diff = 30 - Math.floor((Date.now() - new Date(deletedAt)) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

const Spinner = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

export default function Bin() {
  const { hasRole } = useAuth()
  const { addToast } = useToast()
  const canDelete = hasRole('admin') || hasRole('archiviste')

  const [docs, setDocs]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [restoring, setRestoring]   = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [confirmDoc, setConfirmDoc] = useState(null)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const [emptying, setEmptying]     = useState(false)

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
      addToast(`"${doc.title}" restauré avec succès.`)
    } catch {
      addToast('Erreur lors de la restauration.', 'error')
    } finally { setRestoring(null) }
  }

  const handleForceDelete = async () => {
    setDeleting(confirmDoc.id)
    try {
      await forceDeleteDocument(confirmDoc.id)
      setDocs(prev => prev.filter(d => d.id !== confirmDoc.id))
      setConfirmDoc(null)
      addToast(`"${confirmDoc.title}" supprimé définitivement.`)
    } catch {
      addToast('Erreur lors de la suppression.', 'error')
    } finally { setDeleting(null) }
  }

  const handleEmptyBin = async () => {
    setEmptying(true)
    try {
      await emptyBin()
      setDocs([])
      setConfirmEmpty(false)
      addToast('Corbeille vidée.')
    } catch {
      addToast('Erreur lors du vidage de la corbeille.', 'error')
    } finally { setEmptying(false) }
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Corbeille</h1>
          <p className="text-slate-400 text-sm mt-2">
            {docs.length} document{docs.length !== 1 ? 's' : ''} — supprimés définitivement après 30 jours
          </p>
        </div>
        {canDelete && docs.length > 0 && (
          <button onClick={() => setConfirmEmpty(true)}
            className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors self-start sm:self-auto">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Vider la corbeille
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3.5 text-sm text-amber-700 dark:text-amber-400">
        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Les documents sont automatiquement supprimés définitivement après 30 jours dans la corbeille.
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111520] rounded-2xl border border-slate-200 dark:border-[#1e2436] overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">La corbeille est vide</p>
            <p className="text-slate-400 text-sm mt-1">Les documents supprimés apparaîtront ici</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50 dark:bg-[#0d1018] border-b border-slate-100 dark:border-[#1e2436] text-xs font-bold text-slate-400 uppercase tracking-widest">
              <div className="col-span-4">Document</div>
              <div className="col-span-2">Supprimé par</div>
              <div className="col-span-2">Date de suppression</div>
              <div className="col-span-2">Expiration</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-[#1e2436]">
              {docs.map((doc) => {
                const icon = fileIcon(doc.file_type)
                const days = daysLeft(doc.deleted_at)
                return (
                  <div key={doc.id} className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${icon.bg} flex items-center justify-center shrink-0`}>
                        <span className={`text-xs font-bold ${icon.text}`}>{icon.label}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{doc.title}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{doc.file_name}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-sm text-slate-500">{doc.deleted_by?.name ?? '—'}</div>
                    <div className="col-span-2 text-sm text-slate-500">{formatDate(doc.deleted_at)}</div>
                    <div className="col-span-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        days <= 3
                          ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                          : days <= 7
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
                      }`}>
                        {days === 0 ? 'Expire aujourd\'hui' : `${days}j restant${days > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button onClick={() => handleRestore(doc)} disabled={!!restoring}
                        title="Restaurer"
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 disabled:opacity-40 transition-colors">
                        {restoring === doc.id ? <Spinner /> : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        )}
                        Restaurer
                      </button>
                      {canDelete && (
                        <button onClick={() => setConfirmDoc(doc)} disabled={!!deleting}
                          title="Supprimer définitivement"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40 transition-all">
                          {deleting === doc.id ? <Spinner /> : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {confirmDoc && (
        <ConfirmModal
          title="Supprimer définitivement"
          message={`Êtes-vous sûr de vouloir supprimer définitivement "${confirmDoc.title}" ? Cette action est irréversible — le fichier sera effacé du serveur.`}
          confirmLabel="Supprimer définitivement"
          loading={!!deleting}
          onConfirm={handleForceDelete}
          onCancel={() => setConfirmDoc(null)}
        />
      )}

      {confirmEmpty && (
        <ConfirmModal
          title="Vider la corbeille"
          message={`Êtes-vous sûr de vouloir supprimer définitivement les ${docs.length} document(s) de la corbeille ? Cette action est irréversible.`}
          confirmLabel="Vider la corbeille"
          loading={emptying}
          onConfirm={handleEmptyBin}
          onCancel={() => setConfirmEmpty(false)}
        />
      )}
    </div>
  )
}
