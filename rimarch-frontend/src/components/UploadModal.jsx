import { useState, useRef } from 'react'
import { uploadDocument } from '../api/documents'

const CATEGORIES = ['RH', 'Finance', 'Direction', 'Juridique', 'Technique', 'Général']

const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

const ALLOWED_TYPES = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
  'image/webp': 'WEBP',
}

const ACCEPT = Object.keys(ALLOWED_TYPES)
  .concat(['.pdf','.doc','.docx','.xls','.xlsx','.ppt','.pptx','.txt','.csv','.jpg','.jpeg','.png','.gif','.webp'])
  .join(',')

const Label = ({ children, required }) => (
  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
)

const inputClass = "w-full bg-slate-50 dark:bg-[#0d1018] border-2 border-slate-200 dark:border-[#1e2436] rounded-2xl px-5 py-[14px] text-base text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#111520] focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-500/10 transition-all"

function validateFile(f) {
  if (f.size > MAX_SIZE) {
    const sizeMo = (f.size / (1024 * 1024)).toFixed(1)
    return `Fichier trop volumineux (${sizeMo} Mo) — maximum 50 Mo.`
  }
  if (!ALLOWED_TYPES[f.type]) {
    return `Type de fichier non supporté (${f.type || 'inconnu'}). Formats acceptés : PDF, Word, Excel, PowerPoint, image, TXT, CSV.`
  }
  return null
}

export default function UploadModal({ onClose, onSuccess, initialFile = null }) {
  const [form, setForm]         = useState({
    title: initialFile ? initialFile.name.replace(/\.[^.]+$/, '') : '',
    description: '',
    categorie: 'Général',
  })
  const [file, setFile]         = useState(() => {
    if (!initialFile) return null
    const err = validateFile(initialFile)
    return err ? null : initialFile
  })
  const [fileError, setFileError] = useState(() => {
    if (!initialFile) return ''
    return validateFile(initialFile) || ''
  })
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const fileRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    const err = validateFile(f)
    if (err) {
      setFileError(err)
      setFile(null)
    } else {
      setFileError('')
      setFile(f)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Veuillez sélectionner un fichier valide.'); return }
    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('title',       form.title)
      fd.append('description', form.description)
      fd.append('categorie',   form.categorie)
      fd.append('file',        file)
      await uploadDocument(fd)
      onSuccess()
    } catch (err) {
      const data = err.response?.data
      const errs = data?.errors ? Object.values(data.errors).flat().join(' ') : null
      setError(errs || data?.message || `Erreur lors de l'upload. (${err.response?.status ?? 'réseau'})`)
    } finally { setLoading(false) }
  }

  const formatSize = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} Ko` : `${(b / (1024 * 1024)).toFixed(1)} Mo`

  const dropZoneCls = fileError
    ? 'border-red-400 bg-red-50 dark:bg-red-500/5'
    : dragging
      ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10'
      : file
        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
        : 'border-slate-200 dark:border-[#1e2436] hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-white/5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-[#111520] rounded-3xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-[#1e2436] flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-10 py-7 border-b border-slate-100 dark:border-[#1e2436] shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Nouveau document</h2>
            <p className="text-slate-400 text-sm mt-1.5">Remplissez les informations et uploadez votre fichier</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <form id="upload-form" onSubmit={handleSubmit} className="px-10 py-9 space-y-7 overflow-y-auto flex-1">

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border-2 border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl px-5 py-4 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Titre */}
          <div>
            <Label required>Titre</Label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex : Rapport annuel 2024"
              className={inputClass}
            />
          </div>

          {/* Catégorie */}
          <div>
            <Label>Catégorie</Label>
            <select
              value={form.categorie}
              onChange={(e) => setForm({ ...form, categorie: e.target.value })}
              className={inputClass}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Description optionnelle…"
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Zone upload */}
          <div>
            <Label required>Fichier</Label>
            <div
              onClick={() => fileRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dropZoneCls}`}
            >
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />

              {fileError ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-11 h-11 bg-red-100 dark:bg-red-500/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">{fileError}</p>
                  <p className="text-xs text-red-400">Cliquez pour choisir un autre fichier</p>
                </div>
              ) : file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[220px]">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatSize(file.size)}</p>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setFileError('') }}
                    className="ml-auto text-slate-400 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <svg className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Glissez un fichier ici</p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    ou <span className="text-blue-500 font-medium">cliquez pour parcourir</span> — max 50 Mo
                  </p>
                  <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
                    PDF, Word, Excel, PowerPoint, image, TXT, CSV
                  </p>
                </>
              )}
            </div>
          </div>
        </form>

        {/* Sticky footer buttons */}
        <div className="flex justify-end gap-3 px-10 py-6 border-t border-slate-100 dark:border-[#1e2436] shrink-0 bg-white dark:bg-[#111520] rounded-b-3xl">
          <button type="button" onClick={onClose}
            className="px-7 py-3.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl text-sm transition-colors">
            Annuler
          </button>
          <button type="submit" form="upload-form" disabled={loading || !!fileError}
            className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-2xl text-sm transition-colors flex items-center gap-2">
            {loading ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>Upload en cours…</>
            ) : 'Uploader'}
          </button>
        </div>
      </div>
    </div>
  )
}
