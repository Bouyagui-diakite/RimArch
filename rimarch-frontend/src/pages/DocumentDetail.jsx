import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDocument, deleteDocument, downloadDocument } from '../api/documents'
import { useAuth } from '../hooks/useAuth'
import ConfirmModal from '../components/ConfirmModal'

const formatSize = (b) => {
  if (!b) return '—'
  if (b < 1024) return `${b} o`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} Ko`
  return `${(b / (1024 * 1024)).toFixed(1)} Mo`
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const fileIcon = (type) => {
  if (type?.includes('pdf'))   return { bg: 'bg-red-100',     text: 'text-red-600',     label: 'PDF' }
  if (type?.includes('word') || type?.includes('doc')) return { bg: 'bg-blue-100', text: 'text-blue-600', label: 'DOC' }
  if (type?.includes('sheet') || type?.includes('xls')) return { bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'XLS' }
  if (type?.includes('image')) return { bg: 'bg-purple-100', text: 'text-purple-600', label: 'IMG' }
  return { bg: 'bg-slate-100', text: 'text-slate-600', label: 'FILE' }
}

export default function DocumentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const [doc, setDoc]             = useState(null)
  const [loading, setLoading]     = useState(true)
  const [downloading, setDownloading]   = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError]         = useState('')

  const canEdit = hasRole('admin') || hasRole('archiviste')

  useEffect(() => {
    getDocument(id)
      .then(({ data }) => setDoc(data))
      .catch(() => setError('Document introuvable.'))
      .finally(() => setLoading(false))
  }, [id])

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

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteDocument(doc.id)
      navigate('/documents')
    } finally { setDeleting(false); setConfirmDelete(false) }
  }

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
      <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-slate-600 font-medium">{error}</p>
      <button onClick={() => navigate('/documents')} className="text-blue-600 text-sm hover:underline">
        ← Retour aux documents
      </button>
    </div>
  )

  const icon = fileIcon(doc.file_type)

  return (
    <div className="space-y-8 max-w-4xl">
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

      {/* Retour */}
      <button
        onClick={() => navigate('/documents')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour aux documents
      </button>

      {/* En-tête */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl ${icon.bg} flex items-center justify-center shrink-0`}>
              <span className={`text-lg font-bold ${icon.text}`}>{icon.label}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{doc.title}</h1>
              <p className="text-slate-400 text-sm mt-1">{doc.file_name}</p>
              <span className="inline-block mt-2 bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">
                {doc.categorie}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
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
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors border border-red-200"
              >
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
            )}
          </div>
        </div>

        {/* Description */}
        {doc.description && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</p>
            <p className="text-slate-600 text-sm leading-relaxed">{doc.description}</p>
          </div>
        )}
      </div>

      {/* Métadonnées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
        {[
          { label: 'Type de fichier', value: doc.file_type || '—' },
          { label: 'Taille',          value: formatSize(doc.file_size) },
          { label: 'Catégorie',       value: doc.categorie },
          { label: 'Uploadé par',     value: doc.uploader?.name || '—' },
          { label: 'Date d\'ajout',   value: formatDate(doc.created_at) },
          { label: 'Dernière mise à jour', value: formatDate(doc.updated_at) },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{m.label}</p>
            <p className="text-sm font-medium text-slate-800 truncate">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
