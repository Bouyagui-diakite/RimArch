import { useState, useRef } from 'react'
import { uploadDocument } from '../api/documents'
import { Modal, Button, Field, Notice, inputCls, formatSize } from './ui'

const CATEGORIES = ['RH', 'Finance', 'Direction', 'Juridique', 'Technique', 'Général']

const MAX_SIZE = 50 * 1024 * 1024 // 50 Mo

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
  const [form, setForm] = useState({
    title: initialFile ? initialFile.name.replace(/\.[^.]+$/, '') : '',
    description: '',
    categorie: 'Général',
  })
  const [file, setFile] = useState(() => {
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
    if (err) { setFileError(err); setFile(null) }
    else     { setFileError(''); setFile(f) }
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

  const dropZoneCls = fileError
    ? 'border-[#c25048]/50 bg-[#c25048]/[0.05]'
    : dragging
      ? 'border-cobalt bg-cobalt/[0.06]'
      : file
        ? 'border-moss/50 bg-moss/[0.05]'
        : 'border-line hover:border-cobalt/40 hover:bg-raised'

  return (
    <Modal
      eyebrow="Fonds documentaire"
      title="Nouveau document"
      sub="Renseignez les informations, puis déposez le fichier."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>Annuler</Button>
          <Button type="submit" form="upload-form" variant="primary" loading={loading} disabled={!!fileError}>
            {loading ? 'Envoi…' : 'Déposer'}
          </Button>
        </>
      }
    >
      <form id="upload-form" onSubmit={handleSubmit} className="space-y-5">

        {error && <Notice>{error}</Notice>}

        <Field label="Titre">
          <input
            type="text" required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex : Rapport annuel 2024"
            className={inputCls}
          />
        </Field>

        <Field label="Catégorie">
          <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className={inputCls}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Description" hint="Optionnelle — utile pour la recherche plein texte.">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Contexte, provenance, cote…"
            className={`${inputCls} resize-none`}
          />
        </Field>

        <Field label="Fichier">
          <div
            onClick={() => fileRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`cursor-pointer rounded-lg border border-dashed p-7 text-center transition-all ${dropZoneCls}`}
          >
            <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

            {fileError ? (
              <div className="flex flex-col items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c25048]/30 text-[#c25048]">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-[13px] font-medium text-[#c25048]">{fileError}</p>
                <p className="text-[11.5px] text-faint">Cliquez pour choisir un autre fichier</p>
              </div>
            ) : file ? (
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-moss/40 text-moss">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{file.name}</p>
                  <p className="mt-0.5 text-[11.5px] text-faint">{formatSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  aria-label="Retirer le fichier"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setFileError('') }}
                  className="shrink-0 text-faint transition-colors hover:text-[#c25048]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <svg className="mx-auto mb-3 h-9 w-9 text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.3} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-[13.5px] font-medium text-ink">Glissez un fichier ici</p>
                <p className="mt-1 text-[12px] text-muted">
                  ou <span className="font-semibold text-accent">parcourez vos dossiers</span> — 50 Mo maximum
                </p>
                <p className="mt-1.5 text-[11px] text-faint">PDF · Word · Excel · PowerPoint · image · TXT · CSV</p>
              </>
            )}
          </div>
        </Field>
      </form>
    </Modal>
  )
}
