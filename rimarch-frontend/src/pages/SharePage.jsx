import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSharedDocument } from '../api/documents'
import api from '../api/axios'

const formatSize = (b) => {
  if (!b) return '—'
  if (b < 1024) return `${b} o`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} Ko`
  return `${(b / (1024 * 1024)).toFixed(1)} Mo`
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const fileIcon = (type) => {
  if (type?.includes('pdf'))                            return { bg: 'bg-red-100',     text: 'text-red-600',     label: 'PDF' }
  if (type?.includes('word') || type?.includes('doc'))  return { bg: 'bg-blue-100',    text: 'text-blue-600',    label: 'DOC' }
  if (type?.includes('sheet') || type?.includes('xls')) return { bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'XLS' }
  if (type?.includes('image'))                          return { bg: 'bg-purple-100',  text: 'text-purple-600',  label: 'IMG' }
  return { bg: 'bg-slate-100', text: 'text-slate-600', label: 'FILE' }
}

export default function SharePage() {
  const { token } = useParams()
  const [doc, setDoc]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    getSharedDocument(token)
      .then(({ data }) => setDoc(data))
      .catch((err) => {
        const status = err.response?.status
        setError(status === 410
          ? 'Ce lien de partage a expiré.'
          : 'Lien invalide ou introuvable.'
        )
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { data } = await api.get(`/share/${token}/download`, { responseType: 'blob' })
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

  const icon = doc ? fileIcon(doc.file_type) : null

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <span className="font-bold text-slate-800 text-xl tracking-wide">RIMArch</span>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Lien invalide</h2>
            <p className="text-slate-500 text-sm">{error}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Document partagé</p>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${icon.bg} flex items-center justify-center shrink-0`}>
                  <span className={`text-base font-bold ${icon.text}`}>{icon.label}</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-800 truncate">{doc.title}</h2>
                  <p className="text-sm text-slate-400 truncate mt-0.5">{doc.file_name}</p>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="px-8 py-6 space-y-4">
              {[
                { label: 'Catégorie',         value: doc.categorie },
                { label: 'Taille',            value: formatSize(doc.file_size) },
                { label: 'Téléchargements',   value: doc.download_count },
                { label: 'Expire le',         value: doc.expires_at ? formatDate(doc.expires_at) : 'Jamais' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-semibold text-slate-800">{value}</span>
                </div>
              ))}
            </div>

            {/* Download button */}
            <div className="px-8 pb-8">
              <button onClick={handleDownload} disabled={downloading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-sm transition-colors shadow-lg shadow-blue-600/20">
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
                {downloading ? 'Téléchargement…' : 'Télécharger le document'}
              </button>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-8">
        Ce lien a été partagé via RIMArch — Système de gestion des archives
      </p>
    </div>
  )
}
