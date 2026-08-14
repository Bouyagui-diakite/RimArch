import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDocument, deleteDocument, downloadDocument, updateDocument } from '../api/documents'
import ShareModal from '../components/ShareModal'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import ConfirmModal from '../components/ConfirmModal'
import {
  panelCls, Spinner, Button, Field, EmptyState, Tag,
  fileLabel, formatSize, formatDateTime, inputCls,
} from '../components/ui'

const CATEGORIES = ['RH', 'Finance', 'Direction', 'Juridique', 'Technique', 'Général']

const formatLongDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'

const ICON = {
  eye:      <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>,
  share:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />,
  download: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
  edit:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
  trash:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
}

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">{path}</svg>
)

export default function DocumentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const { addToast } = useToast()

  const [doc, setDoc]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const [downloading, setDownloading]     = useState(false)
  const [deleting, setDeleting]           = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [editing, setEditing]         = useState(false)
  const [editForm, setEditForm]       = useState({ title: '', description: '', categorie: '' })
  const [editLoading, setEditLoading] = useState(false)

  const [previewUrl, setPreviewUrl]         = useState(null)
  const [previewing, setPreviewing]         = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [showShare, setShowShare]           = useState(false)

  const canEdit  = hasRole('admin') || hasRole('archiviste')
  const canShare = hasRole('admin') || hasRole('archiviste')

  useEffect(() => {
    getDocument(id)
      .then(({ data }) => {
        setDoc(data)
        setEditForm({ title: data.title, description: data.description || '', categorie: data.categorie })
      })
      .catch(() => setError('Document introuvable.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { data } = await downloadDocument(doc.id)
      const url  = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', doc.file_name)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } finally { setDownloading(false) }
  }

  const handlePreview = async () => {
    if (previewUrl) { setPreviewing(true); return }
    setPreviewLoading(true)
    try {
      const { data } = await downloadDocument(doc.id)
      const mime = doc.file_type || 'application/octet-stream'
      const url  = URL.createObjectURL(new Blob([data], { type: mime }))
      setPreviewUrl(url)
      setPreviewing(true)
    } catch {
      addToast('Impossible de charger l\'aperçu.', 'error')
    } finally { setPreviewLoading(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteDocument(doc.id)
      addToast('Document supprimé avec succès.')
      navigate('/documents')
    } finally { setDeleting(false); setConfirmDelete(false) }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setEditLoading(true)
    try {
      const { data } = await updateDocument(doc.id, editForm)
      setDoc(data)
      setEditing(false)
      addToast('Document mis à jour.')
    } catch {
      addToast('Erreur lors de la mise à jour.', 'error')
    } finally { setEditLoading(false) }
  }

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-faint">
      <Spinner className="h-7 w-7" />
    </div>
  )

  if (error) return (
    <div className={`${panelCls} overflow-hidden`}>
      <EmptyState
        title="Document introuvable"
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        Ce document a peut-être été supprimé ou déplacé vers la corbeille.
      </EmptyState>
      <div className="flex justify-center border-t border-line px-6 py-4">
        <Button onClick={() => navigate('/documents')}>← Retour aux documents</Button>
      </div>
    </div>
  )

  const isImage = doc.file_type?.includes('image')
  const isPdf   = doc.file_type?.includes('pdf')
  const previewable = isImage || isPdf

  const meta = [
    { label: 'Type de fichier',      value: doc.file_type || '—' },
    { label: 'Taille',               value: formatSize(doc.file_size) },
    { label: 'Catégorie',            value: doc.categorie },
    { label: 'Déposé par',           value: doc.uploader?.name || '—' },
    { label: "Date d'ajout",         value: formatLongDate(doc.created_at) },
    { label: 'Dernière mise à jour', value: formatDateTime(doc.updated_at) },
  ]

  return (
    <div className="max-w-4xl space-y-6">

      {/* ── Aperçu ── */}
      {previewing && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0d16]/80 p-4 backdrop-blur-sm" onClick={() => setPreviewing(false)}>
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-6 py-4">
              <p className="truncate text-[13px] font-medium text-ink">{doc.file_name}</p>
              <button
                onClick={() => setPreviewing(false)}
                aria-label="Fermer l’aperçu"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-raised hover:text-ink"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {isPdf ? (
              <object data={previewUrl} type="application/pdf" className="w-full flex-1" style={{ minHeight: '70vh' }}>
                <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-muted">
                  <p className="text-[13px]">Aperçu non disponible dans ce navigateur.</p>
                  <Button onClick={handleDownload}>Télécharger le fichier</Button>
                </div>
              </object>
            ) : isImage ? (
              <div className="flex flex-1 items-center justify-center overflow-auto bg-raised p-6">
                <img src={previewUrl} alt={doc.title} className="max-h-full max-w-full rounded-lg object-contain" />
              </div>
            ) : null}
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Supprimer le document"
          message={`Êtes-vous sûr de vouloir supprimer « ${doc?.title} » ? Le document partira à la corbeille.`}
          confirmLabel="Supprimer"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {/* ── Retour ── */}
      <button
        onClick={() => navigate('/documents')}
        className="group flex items-center gap-2 text-[12.5px] font-medium text-muted transition-colors hover:text-ink"
      >
        <span className="transition-transform group-hover:-translate-x-0.5">←</span>
        Retour aux documents
      </button>

      {/* ── Carte principale ── */}
      <div className={`${panelCls} overflow-hidden`}>
        <div className="relative overflow-hidden border-b border-white/10 bg-[#0b0d16] px-7 py-7 grain">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-cobalt/25 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/[0.06] text-[12px] font-semibold tracking-wide text-white">
              {fileLabel(doc.file_type)}
            </span>
            <div className="min-w-0">
              <p className="eyebrow text-cobalt-glow">{doc.categorie}</p>
              <h1 className="font-display mt-2 text-[25px] leading-tight text-white">{doc.title}</h1>
              <p className="mt-1.5 truncate text-[12.5px] text-white/45">
                {doc.file_name} · {formatSize(doc.file_size)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-7 py-4">
          <Button variant="primary" onClick={handleDownload} loading={downloading} icon={<Icon path={ICON.download} />}>
            Télécharger
          </Button>
          {previewable && (
            <Button onClick={handlePreview} loading={previewLoading} icon={<Icon path={ICON.eye} />}>
              Aperçu
            </Button>
          )}
          {canShare && (
            <Button onClick={() => setShowShare(true)} icon={<Icon path={ICON.share} />}>
              Partager
            </Button>
          )}
          {canEdit && (
            <>
              <Button
                onClick={() => setEditing(!editing)}
                icon={<Icon path={ICON.edit} />}
                className={editing ? 'border-cobalt/40 text-accent' : ''}
              >
                Modifier
              </Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)} loading={deleting} icon={<Icon path={ICON.trash} />}>
                Supprimer
              </Button>
            </>
          )}
        </div>

        {!editing && doc.description && (
          <div className="px-7 py-6">
            <p className="eyebrow text-faint">Description</p>
            <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-muted">{doc.description}</p>
          </div>
        )}
      </div>

      {/* ── Édition ── */}
      {editing && (
        <div className={`${panelCls} overflow-hidden`}>
          <div className="border-b border-line px-7 py-4">
            <h2 className="font-display text-[16px] leading-none text-ink">Modifier le document</h2>
            <p className="mt-1.5 text-[12px] text-faint">Les modifications sont journalisées.</p>
          </div>
          <form onSubmit={handleEdit} className="space-y-5 px-7 py-6">
            <Field label="Titre">
              <input type="text" required value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Catégorie">
              <select value={editForm.categorie}
                onChange={e => setEditForm({ ...editForm, categorie: e.target.value })} className={inputCls}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Description">
              <textarea rows={3} value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Description optionnelle…"
                className={`${inputCls} resize-none`} />
            </Field>
            <div className="flex justify-end gap-2.5 border-t border-line pt-5">
              <Button type="button" onClick={() => setEditing(false)}>Annuler</Button>
              <Button type="submit" variant="primary" loading={editLoading}>Enregistrer</Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Métadonnées ── */}
      <div className={`${panelCls} overflow-hidden`}>
        <div className="border-b border-line px-7 py-4">
          <h2 className="font-display text-[16px] leading-none text-ink">Fiche technique</h2>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2">
          {meta.map((m, i) => {
            const lastMobile  = i === meta.length - 1
            const lastRowDesk = i >= meta.length - 2
            return (
              <div
                key={m.label}
                className={`border-line px-7 py-4 ${lastMobile ? '' : 'border-b'} ${lastRowDesk ? 'sm:border-b-0' : 'sm:border-b'} ${i % 2 === 0 ? 'sm:border-r' : ''}`}
              >
                <dt className="eyebrow text-faint">{m.label}</dt>
                <dd className="mt-1.5 truncate text-[13.5px] font-medium text-ink">{m.value}</dd>
              </div>
            )
          })}
        </dl>
      </div>

      {doc.uploader?.name && (
        <div className="flex items-center gap-2 px-1 text-[12px] text-faint">
          <Tag>Traçabilité</Tag>
          Toute consultation ou modification de ce document est enregistrée dans les journaux.
        </div>
      )}

      {showShare && doc && (
        <ShareModal doc={doc} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}
