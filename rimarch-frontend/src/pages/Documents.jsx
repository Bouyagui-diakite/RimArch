import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDocuments, deleteDocument, downloadDocument, exportDocuments, exportDocumentsPdf } from '../api/documents'
import { downloadBlob } from '../utils/download'
import UploadModal from '../components/UploadModal'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../hooks/useAuth'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../hooks/useToast'

const CATEGORIES = ['Tous', 'RH', 'Finance', 'Direction', 'Juridique', 'Technique', 'Général']

const fileIcon = (type) => {
  if (type?.includes('pdf'))   return { bg: 'bg-red-100 dark:bg-red-500/10',       text: 'text-red-600 dark:text-red-400',       label: 'PDF' }
  if (type?.includes('word') || type?.includes('doc')) return { bg: 'bg-blue-100 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', label: 'DOC' }
  if (type?.includes('sheet') || type?.includes('xls')) return { bg: 'bg-emerald-100 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'XLS' }
  if (type?.includes('image') || type?.includes('png') || type?.includes('jpg')) return { bg: 'bg-purple-100 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', label: 'IMG' }
  return { bg: 'bg-slate-100 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', label: 'FILE' }
}

const formatSize = (bytes) => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

const Spinner = ({ className = 'w-4 h-4' }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

export default function Documents() {
  const { hasRole } = useAuth()
  const { addToast } = useToast()
  const [docs, setDocs]           = useState([])
  const [meta, setMeta]           = useState({})
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const debouncedSearch           = useDebounce(search, 300)
  const [categorie, setCategorie] = useState('Tous')
  const [page, setPage]           = useState(1)
  const [showUpload, setShowUpload]     = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const filterRef    = useRef(null)
  const selectAllRef = useRef(null)
  const [confirmDoc,  setConfirmDoc]  = useState(null)
  const [deleting,    setDeleting]    = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [downloadError, setDownloadError] = useState('')
  const [exporting,      setExporting]      = useState(false)
  const [exportingPdf,   setExportingPdf]   = useState(false)
  const [droppedFile, setDroppedFile] = useState(null)
  const [pageDragOver, setPageDragOver] = useState(false)
  const dragCounter = useRef(0)

  // Bulk select
  const [selectedIds,     setSelectedIds]     = useState(new Set())
  const [bulkDownloading, setBulkDownloading] = useState(false)
  const [bulkDeleting,    setBulkDeleting]    = useState(false)
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

  const [advanced, setAdvanced] = useState({
    file_type: '', date_from: '', date_to: '', size_min: '', size_max: '', sort: 'created_at', dir: 'desc',
  })
  const navigate = useNavigate()

  const setAdv = (key, val) => { setAdvanced(a => ({ ...a, [key]: val })); setPage(1) }
  const hasAdvanced = Object.entries(advanced).some(([k, v]) => v && k !== 'sort' && k !== 'dir')
  const resetAdvanced = () => { setAdvanced({ file_type: '', date_from: '', date_to: '', size_min: '', size_max: '', sort: 'created_at', dir: 'desc' }); setPage(1) }

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowAdvanced(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const [tick, setTick] = useState(0)
  const fetchDocs = () => setTick(t => t + 1)

  useEffect(() => {
    setSelectedIds(new Set())
  }, [page, debouncedSearch, categorie, advanced, tick])

  useEffect(() => {
    let cancelled = false
    const params = { page, sort: advanced.sort, dir: advanced.dir }
    if (debouncedSearch)      params.search    = debouncedSearch
    if (categorie !== 'Tous') params.categorie = categorie
    if (advanced.file_type)   params.file_type = advanced.file_type
    if (advanced.date_from)   params.date_from = advanced.date_from
    if (advanced.date_to)     params.date_to   = advanced.date_to
    if (advanced.size_min)    params.size_min  = advanced.size_min
    if (advanced.size_max)    params.size_max  = advanced.size_max

    getDocuments(params)
      .then(({ data }) => {
        if (!cancelled) {
          setDocs(data.data)
          setMeta({ total: data.total, lastPage: data.last_page, from: data.from, to: data.to })
          setLoading(false)
        }
      })
      .catch(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [page, debouncedSearch, categorie, advanced, tick])

  // Keep select-all checkbox indeterminate state in sync
  useEffect(() => {
    if (!selectAllRef.current) return
    const allSelected  = docs.length > 0 && docs.every(d => selectedIds.has(d.id))
    const someSelected = docs.some(d => selectedIds.has(d.id))
    selectAllRef.current.indeterminate = someSelected && !allSelected
    selectAllRef.current.checked = allSelected
  }, [selectedIds, docs])

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    const allSelected = docs.length > 0 && docs.every(d => selectedIds.has(d.id))
    setSelectedIds(allSelected ? new Set() : new Set(docs.map(d => d.id)))
  }

  const handleDelete = async () => {
    setDeleting(confirmDoc.id)
    try {
      await deleteDocument(confirmDoc.id)
      setConfirmDoc(null)
      fetchDocs()
      addToast('Document supprimé avec succès.')
    } finally { setDeleting(null) }
  }

  const handleDownload = async (doc) => {
    setDownloading(doc.id)
    setDownloadError('')
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
    } catch (err) {
      let msg = 'Erreur lors du téléchargement.'
      if (err.response?.data instanceof Blob) {
        try { const json = JSON.parse(await err.response.data.text()); msg = json.message || msg } catch {}
      } else {
        msg = err.response?.data?.message || msg
      }
      setDownloadError(msg)
    } finally { setDownloading(null) }
  }

  const handleBulkDownload = async () => {
    setBulkDownloading(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip   = new JSZip()
      const selected = docs.filter(d => selectedIds.has(d.id))
      await Promise.all(selected.map(async (doc) => {
        const { data } = await downloadDocument(doc.id)
        zip.file(doc.file_name, data)
      }))
      const blob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(blob, `rimarch_selection_${new Date().toISOString().slice(0, 10)}.zip`)
      setSelectedIds(new Set())
    } catch {
      addToast('Erreur lors du téléchargement groupé.', 'error')
    } finally { setBulkDownloading(false) }
  }

  const handleBulkDelete = async () => {
    const count = selectedIds.size
    setBulkDeleting(true)
    try {
      await Promise.all([...selectedIds].map(id => deleteDocument(id)))
      setSelectedIds(new Set())
      setShowBulkConfirm(false)
      fetchDocs()
      addToast(`${count} document${count > 1 ? 's' : ''} supprimé${count > 1 ? 's' : ''}.`)
    } catch {
      addToast('Erreur lors de la suppression groupée.', 'error')
    } finally { setBulkDeleting(false) }
  }

  const handleExportPdf = async () => {
    setExportingPdf(true)
    try {
      const params = {}
      if (search)               params.search    = search
      if (categorie !== 'Tous') params.categorie = categorie
      if (advanced.file_type)   params.file_type = advanced.file_type
      if (advanced.date_from)   params.date_from = advanced.date_from
      if (advanced.date_to)     params.date_to   = advanced.date_to
      if (advanced.size_min)    params.size_min  = advanced.size_min
      if (advanced.size_max)    params.size_max  = advanced.size_max
      const { data } = await exportDocumentsPdf(params)
      downloadBlob(data, `rimarch_documents_${new Date().toISOString().slice(0,10)}.pdf`)
    } finally { setExportingPdf(false) }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = {}
      if (search)               params.search    = search
      if (categorie !== 'Tous') params.categorie = categorie
      if (advanced.file_type)   params.file_type = advanced.file_type
      if (advanced.date_from)   params.date_from = advanced.date_from
      if (advanced.date_to)     params.date_to   = advanced.date_to
      if (advanced.size_min)    params.size_min  = advanced.size_min
      if (advanced.size_max)    params.size_max  = advanced.size_max
      const { data } = await exportDocuments(params)
      downloadBlob(data, `rimarch_documents_${new Date().toISOString().slice(0,10)}.csv`)
    } finally { setExporting(false) }
  }

  const canUpload = hasRole('admin') || hasRole('archiviste') || hasRole('consultant')
  const canDelete = hasRole('admin') || hasRole('archiviste')

  const handlePageDragEnter = (e) => {
    e.preventDefault()
    dragCounter.current++
    if (e.dataTransfer.items?.length > 0) setPageDragOver(true)
  }
  const handlePageDragLeave = (e) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setPageDragOver(false)
  }
  const handlePageDragOver = (e) => { e.preventDefault() }
  const handlePageDrop = (e) => {
    e.preventDefault()
    dragCounter.current = 0
    setPageDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) { setDroppedFile(f); setShowUpload(true) }
  }

  const selectCls = "w-full bg-slate-50 dark:bg-[#0d1018] border border-slate-200 dark:border-[#1e2436] rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-400 transition-all"
  const inputCls  = "w-full bg-slate-50 dark:bg-[#0d1018] border border-slate-200 dark:border-[#1e2436] rounded-lg px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"

  return (
    <div
      className="space-y-8 relative"
      onDragEnter={canUpload ? handlePageDragEnter : undefined}
      onDragLeave={canUpload ? handlePageDragLeave : undefined}
      onDragOver={canUpload ? handlePageDragOver : undefined}
      onDrop={canUpload ? handlePageDrop : undefined}
    >
      {/* Page-level drop overlay */}
      {pageDragOver && (
        <div className="absolute inset-0 z-40 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/80 dark:bg-blue-500/10 backdrop-blur-sm flex flex-col items-center justify-center gap-4 pointer-events-none">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/20 rounded-3xl flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">Déposez votre fichier ici</p>
          <p className="text-sm text-blue-400">Le formulaire s'ouvrira automatiquement</p>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Documents</h1>
          <p className="text-slate-400 text-sm mt-2">
            {meta.total ?? '—'} document{meta.total !== 1 ? 's' : ''} archivé{meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button onClick={handleExportPdf} disabled={exportingPdf}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors shadow-sm">
            {exportingPdf ? <Spinner /> : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
            Exporter PDF
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 bg-white dark:bg-[#111520] hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-60 text-slate-700 dark:text-slate-300 text-sm font-semibold px-4 py-3 rounded-xl transition-colors border border-slate-200 dark:border-[#1e2436] shadow-sm">
            {exporting ? <Spinner /> : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            Exporter CSV
          </button>
          {canUpload && (
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-md shadow-blue-600/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau document
            </button>
          )}
        </div>
      </div>

      {/* Download error */}
      {downloadError && (
        <div className="flex items-center justify-between gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
          <span>{downloadError}</span>
          <button onClick={() => setDownloadError('')} className="text-red-400 hover:text-red-600 shrink-0">✕</button>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-4 bg-blue-600 text-white px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-600/20">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold">
              {selectedIds.size} document{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
            <button onClick={() => setSelectedIds(new Set())}
              className="text-white/70 hover:text-white text-xs underline transition-colors">
              Tout désélectionner
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleBulkDownload} disabled={bulkDownloading}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              {bulkDownloading ? <Spinner /> : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              Télécharger ({selectedIds.size})
            </button>
            {canDelete && (
              <button onClick={() => setShowBulkConfirm(true)} disabled={bulkDeleting}
                className="flex items-center gap-2 bg-white/15 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                {bulkDeleting ? <Spinner /> : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                Supprimer ({selectedIds.size})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Barre de recherche + bouton filtre */}
      <div className="flex justify-center gap-2">
        <div className="flex items-center gap-3 bg-white dark:bg-[#111520] border border-slate-200 dark:border-[#1e2436] rounded-xl px-4 py-2.5 shadow-sm w-full max-w-md focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 dark:focus-within:ring-blue-500/10 transition-all">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher un document…"
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none" />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="text-slate-400 hover:text-slate-600 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="relative shrink-0" ref={filterRef}>
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className={`h-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border shadow-sm transition-all ${
              hasAdvanced
                ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-[#111520] border-slate-200 dark:border-[#1e2436] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filtres
            {hasAdvanced && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
          </button>

          {showAdvanced && (
            <div className="absolute left-0 top-full mt-2 z-30 bg-white dark:bg-[#111520] border border-slate-200 dark:border-[#1e2436] rounded-2xl shadow-xl p-5 w-72">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Type</label>
                  <select value={advanced.file_type} onChange={(e) => setAdv('file_type', e.target.value)} className={selectCls}>
                    <option value="">Tous</option>
                    <option value="pdf">PDF</option>
                    <option value="word">Word</option>
                    <option value="sheet">Excel</option>
                    <option value="image">Image</option>
                    <option value="plain">Texte</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Du</label>
                    <input type="date" value={advanced.date_from} onChange={(e) => setAdv('date_from', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Au</label>
                    <input type="date" value={advanced.date_to} onChange={(e) => setAdv('date_to', e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Min (Ko)</label>
                    <input type="number" min="0" value={advanced.size_min} onChange={(e) => setAdv('size_min', e.target.value)} placeholder="100" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Max (Ko)</label>
                    <input type="number" min="0" value={advanced.size_max} onChange={(e) => setAdv('size_max', e.target.value)} placeholder="5000" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Trier par</label>
                  <div className="flex gap-2">
                    <select value={advanced.sort} onChange={(e) => setAdv('sort', e.target.value)} className={selectCls}>
                      <option value="created_at">Date</option>
                      <option value="title">Titre</option>
                      <option value="file_size">Taille</option>
                      <option value="categorie">Catégorie</option>
                    </select>
                    <button onClick={() => setAdv('dir', advanced.dir === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 bg-slate-50 dark:bg-[#0d1018] border border-slate-200 dark:border-[#1e2436] rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium transition-all">
                      {advanced.dir === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
                {hasAdvanced && (
                  <button onClick={resetAdvanced}
                    className="w-full text-xs text-red-500 hover:text-red-700 font-medium border-t border-slate-100 dark:border-[#1e2436] pt-3 mt-1 transition-colors text-center">
                    Effacer les filtres
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filtres catégorie */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => { setCategorie(cat); setPage(1) }}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              categorie === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#111520] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-[#1e2436]'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Liste documents */}
      <div className="bg-white dark:bg-[#111520] rounded-2xl border border-slate-200 dark:border-[#1e2436] overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="w-8 h-8 text-blue-500" />
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">Aucun document trouvé</p>
            <p className="text-slate-400 text-sm mt-1">
              {search ? `Aucun résultat pour "${search}"` : 'Commencez par uploader un document'}
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 dark:bg-[#0d1018] border-b border-slate-100 dark:border-[#1e2436] text-xs font-bold text-slate-400 uppercase tracking-widest items-center">
              <div className="col-span-1 flex items-center">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 cursor-pointer accent-blue-600"
                />
              </div>
              <div className="col-span-4">Document</div>
              <div className="col-span-2">Catégorie</div>
              <div className="col-span-2">Uploadé par</div>
              <div className="col-span-1">Taille</div>
              <div className="col-span-1">Date</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-50 dark:divide-[#1e2436]">
              {docs.map((doc) => {
                const icon       = fileIcon(doc.file_type)
                const isSelected = selectedIds.has(doc.id)
                return (
                  <div
                    key={doc.id}
                    className={`grid grid-cols-12 gap-4 px-6 py-5 items-center transition-colors group ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-500/5'
                        : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(doc.id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 cursor-pointer accent-blue-600"
                      />
                    </div>

                    {/* Document */}
                    <div className="col-span-4 flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => navigate(`/documents/${doc.id}`)}>
                      <div className={`w-9 h-9 rounded-xl ${icon.bg} flex items-center justify-center shrink-0`}>
                        <span className={`text-xs font-bold ${icon.text}`}>{icon.label}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{doc.title}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{doc.file_name}</p>
                      </div>
                    </div>

                    {/* Catégorie */}
                    <div className="col-span-2">
                      <span className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-xs font-medium px-2.5 py-1 rounded-full">
                        {doc.categorie}
                      </span>
                    </div>

                    {/* Uploader */}
                    <div className="col-span-2 flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {doc.uploader?.name?.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400 truncate">{doc.uploader?.name}</span>
                    </div>

                    {/* Size */}
                    <div className="col-span-1 text-sm text-slate-500">{formatSize(doc.file_size)}</div>

                    {/* Date */}
                    <div className="col-span-1 text-sm text-slate-500">{formatDate(doc.created_at)}</div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <button onClick={() => handleDownload(doc)} disabled={downloading === doc.id} title="Télécharger"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all disabled:opacity-40">
                        {downloading === doc.id ? <Spinner /> : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                      </button>
                      {canDelete && (
                        <button onClick={() => setConfirmDoc(doc)} disabled={deleting === doc.id} title="Supprimer"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-40">
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

      {/* Pagination */}
      {meta.lastPage > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-500">{meta.from}–{meta.to} sur {meta.total} documents</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-[#111520] border border-slate-200 dark:border-[#1e2436] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              ← Précédent
            </button>
            <button onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))} disabled={page === meta.lastPage}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-[#111520] border border-slate-200 dark:border-[#1e2436] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              Suivant →
            </button>
          </div>
        </div>
      )}

      {/* Single delete confirm */}
      {confirmDoc && (
        <ConfirmModal
          title="Supprimer le document"
          message={`Êtes-vous sûr de vouloir supprimer "${confirmDoc.title}" ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          loading={!!deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDoc(null)}
        />
      )}

      {/* Bulk delete confirm */}
      {showBulkConfirm && (
        <ConfirmModal
          title="Supprimer la sélection"
          message={`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} document${selectedIds.size > 1 ? 's' : ''} ? Cette action est irréversible.`}
          confirmLabel={`Supprimer ${selectedIds.size} document${selectedIds.size > 1 ? 's' : ''}`}
          loading={bulkDeleting}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkConfirm(false)}
        />
      )}

      {showUpload && (
        <UploadModal
          initialFile={droppedFile}
          onClose={() => { setShowUpload(false); setDroppedFile(null) }}
          onSuccess={() => { setShowUpload(false); setDroppedFile(null); fetchDocs(); addToast('Document uploadé avec succès.') }}
        />
      )}
    </div>
  )
}
