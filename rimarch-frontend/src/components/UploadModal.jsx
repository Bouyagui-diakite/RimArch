import { useState, useRef } from 'react'
import { uploadDocument } from '../api/documents'

const CATEGORIES = ['RH', 'Finance', 'Direction', 'Juridique', 'Technique', 'Général']

const Label = ({ children, required }) => (
  <label className="block text-sm font-bold text-slate-700 mb-3">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
)

const inputClass = "w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"

export default function UploadModal({ onClose, onSuccess }) {
  const [form, setForm]         = useState({ title: '', description: '', categorie: 'Général' })
  const [file, setFile]         = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const fileRef = useRef()

  const handleFile = (f) => { if (f) setFile(f) }
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Veuillez sélectionner un fichier.'); return }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Nouveau document</h2>
            <p className="text-slate-400 text-sm mt-1">Remplissez les informations et uploadez votre fichier</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-10 py-8 space-y-6 max-w-md mx-auto">

          {error && (
            <div className="bg-red-50 border-2 border-red-100 text-red-600 rounded-2xl px-5 py-4 text-sm font-medium">
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
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragging ? 'border-blue-400 bg-blue-50'
                : file    ? 'border-emerald-400 bg-emerald-50'
                :            'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-11 h-11 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800 truncate max-w-[220px]">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatSize(file.size)}</p>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="ml-auto text-slate-400 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-600">Glissez un fichier ici</p>
                  <p className="text-xs text-slate-400 mt-1.5">ou <span className="text-blue-500 font-medium">cliquez pour parcourir</span> — max 50 Mo</p>
                </>
              )}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-center gap-4 pt-2">
            <button type="button" onClick={onClose}
              className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-2xl text-sm transition-colors flex items-center gap-2">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>Upload en cours…</>
              ) : 'Uploader'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
