import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDocuments, deleteDocument, downloadDocument, exportDocuments, exportDocumentsPdf } from '../api/documents'
import { downloadBlob } from '../utils/download'
import UploadModal from '../components/UploadModal'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../hooks/useAuth'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../hooks/useToast'
import {
  panelCls, Spinner, PageHeader, Button, IconButton, SearchField, Pills,
  EmptyState, Notice, Pagination, FileTag, Tag, formatSize, formatDate, inputCls,
} from '../components/ui'

const CATEGORIES = ['Tous', 'RH', 'Finance', 'Direction', 'Juridique', 'Technique', 'Général']

const ICON = {
  download: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
  trash:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
  plus:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 5v14M5 12h14" />,
  pdf:      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
  csv:      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  filter:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />,
  upload:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />,
}

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">{path}</svg>
)

const checkboxCls = 'h-4 w-4 shrink-0 cursor-pointer rounded border-line accent-[#1f3bff]'

export default function Documents() {
  const { hasRole } = useAuth()
  const { addToast } = useToast()
  const [docs, setDocs]             = useState([])
  const [meta, setMeta]             = useState({})
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const debouncedSearch             = useDebounce(search, 300)
  const [categorie, setCategorie]   = useState('Tous')
  const [page, setPage]             = useState(1)
  const [showUpload, setShowUpload] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const filterRef    = useRef(null)
  const selectAllRef = useRef(null)
  const [confirmDoc,  setConfirmDoc]  = useState(null)
  const [deleting,    setDeleting]    = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [downloadError, setDownloadError] = useState('')
  const [exporting,    setExporting]    = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [droppedFile, setDroppedFile]   = useState(null)
  const [pageDragOver, setPageDragOver] = useState(false)
  const dragCounter = useRef(0)

  const [selectedIds,     setSelectedIds]     = useState(new Set())
  const [bulkDownloading, setBulkDownloading] = useState(false)
  const [bulkDeleting,    setBulkDeleting]    = useState(false)
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

  const [advanced, setAdvanced] = useState({ file_type: '', date_from: '', date_to: '', size_min: '', size_max: '', sort: 'created_at', dir: 'desc' })
  const navigate = useNavigate()

  const setAdv = (key, val) => { setAdvanced(a => ({ ...a, [key]: val })); setPage(1) }
  const hasAdvanced = Object.entries(advanced).some(([k, v]) => v && k !== 'sort' && k !== 'dir')
  const resetAdvanced = () => { setAdvanced({ file_type: '', date_from: '', date_to: '', size_min: '', size_max: '', sort: 'created_at', dir: 'desc' }); setPage(1) }

  useEffect(() => {
    const handler = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setShowAdvanced(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const [tick, setTick] = useState(0)
  const fetchDocs = () => setTick(t => t + 1)

  useEffect(() => { setSelectedIds(new Set()) }, [page, debouncedSearch, categorie, advanced, tick])

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

  useEffect(() => {
    if (!selectAllRef.current) return
    const allSelected  = docs.length > 0 && docs.every(d => selectedIds.has(d.id))
    const someSelected = docs.some(d => selectedIds.has(d.id))
    selectAllRef.current.indeterminate = someSelected && !allSelected
    selectAllRef.current.checked = allSelected
  }, [selectedIds, docs])

  const toggleSelect = (id) => setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  const toggleAll    = () => { const allSelected = docs.length > 0 && docs.every(d => selectedIds.has(d.id)); setSelectedIds(allSelected ? new Set() : new Set(docs.map(d => d.id))) }

  const handleDelete = async () => {
    setDeleting(confirmDoc.id)
    try { await deleteDocument(confirmDoc.id); setConfirmDoc(null); fetchDocs(); addToast('Document déplacé vers la corbeille.') }
    finally { setDeleting(null) }
  }

  const handleDownload = async (doc) => {
    setDownloading(doc.id); setDownloadError('')
    try {
      const { data } = await downloadDocument(doc.id)
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', doc.file_name)
      document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url)
    } catch (err) {
      let msg = 'Erreur lors du téléchargement.'
      if (err.response?.data instanceof Blob) { try { const json = JSON.parse(await err.response.data.text()); msg = json.message || msg } catch {} }
      else { msg = err.response?.data?.message || msg }
      setDownloadError(msg)
    } finally { setDownloading(null) }
  }

  const handleBulkDownload = async () => {
    setBulkDownloading(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      const selected = docs.filter(d => selectedIds.has(d.id))
      await Promise.all(selected.map(async (doc) => { const { data } = await downloadDocument(doc.id); zip.file(doc.file_name, data) }))
      const blob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(blob, `rimarch_selection_${new Date().toISOString().slice(0, 10)}.zip`)
      setSelectedIds(new Set())
    } catch { addToast('Erreur lors du téléchargement groupé.', 'error') }
    finally { setBulkDownloading(false) }
  }

  const handleBulkDelete = async () => {
    const count = selectedIds.size; setBulkDeleting(true)
    try {
      await Promise.all([...selectedIds].map(id => deleteDocument(id)))
      setSelectedIds(new Set()); setShowBulkConfirm(false); fetchDocs()
      addToast(`${count} document${count > 1 ? 's' : ''} déplacé${count > 1 ? 's' : ''} vers la corbeille.`)
    } catch { addToast('Erreur lors de la suppression groupée.', 'error') }
    finally { setBulkDeleting(false) }
  }

  const exportParams = () => {
    const params = {}
    if (search)               params.search    = search
    if (categorie !== 'Tous') params.categorie = categorie
    if (advanced.file_type)   params.file_type = advanced.file_type
    if (advanced.date_from)   params.date_from = advanced.date_from
    if (advanced.date_to)     params.date_to   = advanced.date_to
    if (advanced.size_min)    params.size_min  = advanced.size_min
    if (advanced.size_max)    params.size_max  = advanced.size_max
    return params
  }

  const handleExportPdf = async () => {
    setExportingPdf(true)
    try {
      const { data } = await exportDocumentsPdf(exportParams())
      downloadBlob(data, `rimarch_documents_${new Date().toISOString().slice(0,10)}.pdf`)
    } finally { setExportingPdf(false) }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const { data } = await exportDocuments(exportParams())
      downloadBlob(data, `rimarch_documents_${new Date().toISOString().slice(0,10)}.csv`)
    } finally { setExporting(false) }
  }

  const canUpload = hasRole('admin') || hasRole('archiviste') || hasRole('consultant')
  const canDelete = hasRole('admin') || hasRole('archiviste')

  const handlePageDragEnter = (e) => { e.preventDefault(); dragCounter.current++; if (e.dataTransfer.items?.length > 0) setPageDragOver(true) }
  const handlePageDragLeave = (e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setPageDragOver(false) }
  const handlePageDragOver  = (e) => { e.preventDefault() }
  const handlePageDrop = (e) => {
    e.preventDefault(); dragCounter.current = 0; setPageDragOver(false)
    const f = e.dataTransfer.files[0]; if (f) { setDroppedFile(f); setShowUpload(true) }
  }

  return (
    <div
      className="relative space-y-6"
      onDragEnter={canUpload ? handlePageDragEnter : undefined}
      onDragLeave={canUpload ? handlePageDragLeave : undefined}
      onDragOver={canUpload ? handlePageDragOver : undefined}
      onDrop={canUpload ? handlePageDrop : undefined}
    >
      {/* ── Zone de dépôt ── */}
      {pageDragOver && (
        <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 rounded-[18px] border-2 border-dashed border-cobalt/50 bg-cobalt/[0.06] backdrop-blur-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cobalt/30 bg-surface text-accent">
            <Icon path={ICON.upload} className="h-7 w-7" />
          </div>
          <p className="font-display text-[26px] text-ink">Déposez votre fichier ici</p>
          <p className="text-[13px] text-muted">Le formulaire s’ouvrira automatiquement</p>
        </div>
      )}

      {/* ── En-tête ── */}
      <PageHeader
        eyebrow="Fonds documentaire"
        title="Documents"
        sub={`${meta.total ?? '—'} document${meta.total !== 1 ? 's' : ''} archivé${meta.total !== 1 ? 's' : ''}`}
      >
        <Button onClick={handleExportPdf} loading={exportingPdf} icon={<Icon path={ICON.pdf} />}>PDF</Button>
        <Button onClick={handleExport} loading={exporting} icon={<Icon path={ICON.csv} />}>CSV</Button>
        {canUpload && (
          <Button variant="primary" onClick={() => setShowUpload(true)} icon={<Icon path={ICON.plus} />}>
            Nouveau
          </Button>
        )}
      </PageHeader>

      {downloadError && <Notice onClose={() => setDownloadError('')}>{downloadError}</Notice>}

      {/* ── Barre de sélection ── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col gap-3 rounded-[14px] bg-ink px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-canvas">
              {selectedIds.size} document{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
            <button onClick={() => setSelectedIds(new Set())} className="text-[11.5px] text-canvas/50 underline underline-offset-4 transition-colors hover:text-canvas">
              Tout désélectionner
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkDownload} disabled={bulkDownloading}
              className="inline-flex items-center gap-2 rounded-lg border border-canvas/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-canvas transition-all hover:bg-canvas hover:text-ink disabled:opacity-50"
            >
              {bulkDownloading ? <Spinner /> : <Icon path={ICON.download} className="h-3.5 w-3.5" />}
              Télécharger ({selectedIds.size})
            </button>
            {canDelete && (
              <button
                onClick={() => setShowBulkConfirm(true)} disabled={bulkDeleting}
                className="inline-flex items-center gap-2 rounded-lg border border-[#c25048]/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e08b85] transition-all hover:bg-[#c25048] hover:text-white disabled:opacity-50"
              >
                {bulkDeleting ? <Spinner /> : <Icon path={ICON.trash} className="h-3.5 w-3.5" />}
                Supprimer ({selectedIds.size})
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Recherche + filtres ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          onClear={() => { setSearch(''); setPage(1) }}
          placeholder="Rechercher un document…"
          className="w-full sm:max-w-md"
        />

        <div className="relative shrink-0" ref={filterRef}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition-all ${
              hasAdvanced ? 'border-cobalt/40 bg-cobalt/[0.06] text-accent' : 'border-line text-muted hover:border-ink hover:text-ink'
            }`}
          >
            <Icon path={ICON.filter} className="h-3.5 w-3.5" />
            Filtres
            {hasAdvanced && <span className="h-1.5 w-1.5 rounded-full bg-cobalt" />}
          </button>

          {showAdvanced && (
            <div className={`absolute right-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] space-y-4 p-5 shadow-2xl ${panelCls}`}>
              <div>
                <label className="eyebrow mb-2 block text-muted">Type</label>
                <select value={advanced.file_type} onChange={(e) => setAdv('file_type', e.target.value)} className={inputCls}>
                  <option value="">Tous</option>
                  <option value="pdf">PDF</option>
                  <option value="word">Word</option>
                  <option value="sheet">Excel</option>
                  <option value="image">Image</option>
                  <option value="plain">Texte</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow mb-2 block text-muted">Du</label>
                  <input type="date" value={advanced.date_from} onChange={(e) => setAdv('date_from', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="eyebrow mb-2 block text-muted">Au</label>
                  <input type="date" value={advanced.date_to} onChange={(e) => setAdv('date_to', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow mb-2 block text-muted">Min Ko</label>
                  <input type="number" min="0" value={advanced.size_min} onChange={(e) => setAdv('size_min', e.target.value)} placeholder="100" className={inputCls} />
                </div>
                <div>
                  <label className="eyebrow mb-2 block text-muted">Max Ko</label>
                  <input type="number" min="0" value={advanced.size_max} onChange={(e) => setAdv('size_max', e.target.value)} placeholder="5000" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="eyebrow mb-2 block text-muted">Trier par</label>
                <div className="flex gap-2">
                  <select value={advanced.sort} onChange={(e) => setAdv('sort', e.target.value)} className={inputCls}>
                    <option value="created_at">Date</option>
                    <option value="title">Titre</option>
                    <option value="file_size">Taille</option>
                    <option value="categorie">Catégorie</option>
                  </select>
                  <button
                    onClick={() => setAdv('dir', advanced.dir === 'asc' ? 'desc' : 'asc')}
                    aria-label="Inverser le tri"
                    className="shrink-0 rounded-lg border border-line px-3 text-[13px] font-semibold text-muted transition-all hover:border-ink hover:text-ink"
                  >
                    {advanced.dir === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
              {hasAdvanced && (
                <button
                  onClick={resetAdvanced}
                  className="w-full border-t border-line pt-3 text-center text-[11.5px] font-semibold text-[#c25048] transition-colors hover:opacity-70"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Catégories ── */}
      <Pills items={CATEGORIES} value={categorie} onChange={(cat) => { setCategorie(cat); setPage(1) }} />

      {/* ── Liste ── */}
      <div className={`${panelCls} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-24 text-faint">
            <Spinner className="h-7 w-7" />
          </div>
        ) : docs.length === 0 ? (
          <EmptyState title="Aucun document trouvé">
            {search ? `Aucun résultat pour « ${search} »` : 'Commencez par déposer un document dans le fonds.'}
          </EmptyState>
        ) : (
          <>
            {/* En-tête de tableau — desktop */}
            <div className="hidden grid-cols-12 items-center gap-4 border-b border-line bg-raised px-6 py-3 lg:grid">
              <div className="col-span-1 flex items-center">
                <input ref={selectAllRef} type="checkbox" onChange={toggleAll} aria-label="Tout sélectionner" className={checkboxCls} />
              </div>
              <div className="eyebrow col-span-4 text-faint">Document</div>
              <div className="eyebrow col-span-2 text-faint">Catégorie</div>
              <div className="eyebrow col-span-2 text-faint">Déposé par</div>
              <div className="eyebrow col-span-1 text-faint">Taille</div>
              <div className="eyebrow col-span-1 text-faint">Date</div>
              <div className="eyebrow col-span-1 text-right text-faint">Actions</div>
            </div>

            <div className="divide-y divide-line">
              {docs.map((doc) => {
                const isSelected = selectedIds.has(doc.id)
                return (
                  <div key={doc.id} className={`transition-colors ${isSelected ? 'bg-cobalt/[0.05]' : 'hover:bg-raised'}`}>

                    {/* Carte mobile */}
                    <div className="flex items-start gap-3 px-4 py-4 lg:hidden">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(doc.id)} aria-label={`Sélectionner ${doc.title}`} className={`${checkboxCls} mt-1`} />
                      <FileTag type={doc.file_type} />
                      <div className="min-w-0 flex-1" onClick={() => navigate(`/documents/${doc.id}`)}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13.5px] font-semibold text-ink">{doc.title}</p>
                          <div className="flex shrink-0 items-center gap-1" onClick={e => e.stopPropagation()}>
                            <IconButton label="Télécharger" onClick={() => handleDownload(doc)} loading={downloading === doc.id}>
                              <Icon path={ICON.download} />
                            </IconButton>
                            {canDelete && (
                              <IconButton label="Supprimer" danger onClick={() => setConfirmDoc(doc)} loading={deleting === doc.id}>
                                <Icon path={ICON.trash} />
                              </IconButton>
                            )}
                          </div>
                        </div>
                        <p className="mt-0.5 truncate text-[11.5px] text-faint">{doc.file_name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <Tag>{doc.categorie}</Tag>
                          <span className="text-[11.5px] text-faint">{doc.uploader?.name}</span>
                          <span className="text-[11.5px] text-faint">{formatSize(doc.file_size)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ligne desktop */}
                    <div className="group hidden grid-cols-12 items-center gap-4 px-6 py-3.5 lg:grid">
                      <div className="col-span-1 flex items-center">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(doc.id)} aria-label={`Sélectionner ${doc.title}`} className={checkboxCls} />
                      </div>
                      <div className="col-span-4 flex min-w-0 cursor-pointer items-center gap-3" onClick={() => navigate(`/documents/${doc.id}`)}>
                        <FileTag type={doc.file_type} className="transition-colors group-hover:border-accent/40 group-hover:text-accent" />
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-medium text-ink">{doc.title}</p>
                          <p className="mt-0.5 truncate text-[11.5px] text-faint">{doc.file_name}</p>
                        </div>
                      </div>
                      <div className="col-span-2"><Tag>{doc.categorie}</Tag></div>
                      <div className="col-span-2 flex min-w-0 items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink text-[10px] font-semibold text-canvas">
                          {doc.uploader?.name?.charAt(0)}
                        </span>
                        <span className="truncate text-[12.5px] text-muted">{doc.uploader?.name}</span>
                      </div>
                      <div className="col-span-1 text-[12.5px] text-muted tabular-nums">{formatSize(doc.file_size)}</div>
                      <div className="col-span-1 text-[12.5px] text-muted">{formatDate(doc.created_at)}</div>
                      <div className="col-span-1 flex items-center justify-end gap-1">
                        <IconButton label="Télécharger" onClick={() => handleDownload(doc)} loading={downloading === doc.id}>
                          <Icon path={ICON.download} />
                        </IconButton>
                        {canDelete && (
                          <IconButton label="Supprimer" danger onClick={() => setConfirmDoc(doc)} loading={deleting === doc.id}>
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

      <Pagination
        page={page} lastPage={meta.lastPage} from={meta.from} to={meta.to}
        total={meta.total} unit="documents" onPage={setPage}
      />

      {confirmDoc && (
        <ConfirmModal title="Supprimer le document"
          message={`Êtes-vous sûr de vouloir supprimer « ${confirmDoc.title} » ?`}
          confirmLabel="Supprimer" loading={!!deleting}
          onConfirm={handleDelete} onCancel={() => setConfirmDoc(null)} />
      )}
      {showBulkConfirm && (
        <ConfirmModal title="Supprimer la sélection"
          message={`Supprimer ${selectedIds.size} document${selectedIds.size > 1 ? 's' : ''} ?`}
          confirmLabel={`Supprimer ${selectedIds.size}`} loading={bulkDeleting}
          onConfirm={handleBulkDelete} onCancel={() => setShowBulkConfirm(false)} />
      )}
      {showUpload && (
        <UploadModal initialFile={droppedFile}
          onClose={() => { setShowUpload(false); setDroppedFile(null) }}
          onSuccess={() => { setShowUpload(false); setDroppedFile(null); fetchDocs(); addToast('Document uploadé avec succès.') }} />
      )}
    </div>
  )
}
