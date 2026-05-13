import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDocument, deleteDocument, downloadDocument, previewDocument, updateDocument } from '../api/documents'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import ConfirmModal from '../components/ConfirmModal'

const CATEGORIES = ['RH', 'Finance', 'Direction', 'Juridique', 'Technique', 'Général']

const formatSize = (b) => {
  if (!b) return '—'
  if (b < 1024) return `${b} o`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} Ko`
  return `${(b / (1024 * 1024)).toFixed(1)} Mo`
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const fileIcon = (type) => {
  if (type?.includes('pdf'))   return { bg: 'bg-red-100 dark:bg-red-500/10',       text: 'text-red-600 dark:text-red-400',       label: 'PDF',  previewable: true  }
  if (type?.includes('word') || type?.includes('doc')) return { bg: 'bg-blue-100 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', label: 'DOC', previewable: false }
  if (type?.includes('sheet') || type?.includes('xls')) return { bg: 'bg-emerald-100 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'XLS', previewable: false }
  if (type?.includes('image')) return { bg: 'bg-purple-100 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', label: 'IMG',  previewable: true  }
  return { bg: 'bg-slate-100 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', label: 'FILE', previewable: false }
}

export default function DocumentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const { addToast } = useToast()

  const [doc, setDoc]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const [downloading, setDownloading]       = useState(false)
  const [deleting, setDeleting]             = useState(false)
  const [confirmDelete, setConfirmDelete]   = useState(false)

  const [editing, setEditing]               = useState(false)
  const [editForm, setEditForm]             = useState({ title: '', description: '', categorie: '' })
  const [editLoading, setEditLoading]       = useState(false)

  const [previewUrl, setPreviewUrl]         = useState(null)
  const [previewing, setPreviewing]         = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)

  const canEdit = hasRole('admin') || hasRole('archiviste')

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
      const { data } = await previewDocument(doc.id)
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

  const inputCls = "w-full bg-slate-50 dark:bg-[#0d1018] border-2 border-slate-200 dark:border-[#1e2436] rounded-2xl px-5 py-[14px] text-base text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#111520] focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-500/10 transition-all"

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-14 h-14 bg-red-100 dark:bg-red-500/10 rounded-2xl flex items-center justify-center">
        <svg className="w-7 h-7 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-slate-600 dark:text-slate-400 font-medium">{error}</p>
      <button onClick={() => navigate('/documents')} className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
        ← Retour aux documents
      </button>
    </div>
  )

  const icon = fileIcon(doc.file_type)
  const isImage = doc.file_type?.includes('image')
  const isPdf   = doc.file_type?.includes('pdf')

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Preview modal */}
      {previewing && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewing(false)}>
          <div className="relative w-full max-w-4xl bg-white dark:bg-[#111520] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1e2436] shrink-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{doc.file_name}</p>
              <button onClick={() => setPreviewing(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-all shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {isPdf ? (
              <object
                data={previewUrl}
                type="application/pdf"
                className="w-full flex-1"
                style={{ minHeight: '70vh' }}
              >
                <div className="flex flex-col items-center justify-center h-full py-16 gap-4 text-slate-400">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-medium">Aperçu non disponible dans ce navigateur.</p>
                  <button onClick={handleDownload}
                    className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline">
                    Télécharger le fichier
                  </button>
                </div>
              </object>
            ) : isImage ? (
              <div className="flex items-center justify-center p-6 overflow-auto flex-1">
                <img src={previewUrl} alt={doc.title} className="max-w-full max-h-full object-contain rounded-xl" />
              </div>
            ) : null}
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Supprimer le document"
          message={`Êtes-vous sûr de vouloir supprimer "${doc?.title}" ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {/* Back */}
      <button onClick={() => navigate('/documents')}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-medium transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour aux documents
      </button>

      {/* Header card */}
      <div className="bg-white dark:bg-[#111520] rounded-2xl border border-slate-200 dark:border-[#1e2436] p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl ${icon.bg} flex items-center justify-center shrink-0`}>
              <span className={`text-lg font-bold ${icon.text}`}>{icon.label}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">{doc.title}</h1>
              <p className="text-slate-400 text-sm mt-1">{doc.file_name}</p>
              <span className="inline-block mt-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-xs font-medium px-2.5 py-1 rounded-full">
                {doc.categorie}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {icon.previewable && (
              <button onClick={handlePreview} disabled={previewLoading}
                className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-60 text-slate-700 dark:text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                {previewLoading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
                Aperçu
              </button>
            )}

            <button onClick={handleDownload} disabled={downloading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
              {downloading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              Télécharger
            </button>

            {canEdit && (
              <>
                <button onClick={() => setEditing(!editing)}
                  className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors border ${
                    editing
                      ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-white/5 border-transparent hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400'
                  }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modifier
                </button>
                <button onClick={() => setConfirmDelete(true)} disabled={deleting}
                  className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-60 text-red-600 dark:text-red-400 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors border border-red-200 dark:border-red-500/20">
                  {deleting ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                  Supprimer
                </button>
              </>
            )}
          </div>
        </div>

        {!editing && doc.description && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-[#1e2436]">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</p>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{doc.description}</p>
          </div>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white dark:bg-[#111520] rounded-2xl border border-blue-200 dark:border-blue-500/30 p-8 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 dark:text-white mb-6">Modifier le document</h2>
          <form onSubmit={handleEdit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Titre</label>
              <input type="text" required value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Catégorie</label>
              <select value={editForm.categorie}
                onChange={e => setEditForm({ ...editForm, categorie: e.target.value })}
                className={inputCls}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Description</label>
              <textarea rows={3} value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Description optionnelle…"
                className={`${inputCls} resize-none`} />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(false)}
                className="px-6 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={editLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2">
                {editLoading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
        {[
          { label: 'Type de fichier',      value: doc.file_type || '—' },
          { label: 'Taille',               value: formatSize(doc.file_size) },
          { label: 'Catégorie',            value: doc.categorie },
          { label: 'Uploadé par',          value: doc.uploader?.name || '—' },
          { label: "Date d'ajout",         value: formatDate(doc.created_at) },
          { label: 'Dernière mise à jour', value: formatDate(doc.updated_at) },
        ].map((m) => (
          <div key={m.label} className="bg-white dark:bg-[#111520] rounded-2xl border border-slate-200 dark:border-[#1e2436] px-6 py-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{m.label}</p>
            <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
