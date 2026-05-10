import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDocuments, deleteDocument, downloadDocument, exportDocuments } from '../api/documents'
import { downloadBlob } from '../utils/download'
import UploadModal from '../components/UploadModal'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../hooks/useAuth'

const CATEGORIES = ['Tous', 'RH', 'Finance', 'Direction', 'Juridique', 'Technique', 'Général']

const fileIcon = (type) => {
  if (type?.includes('pdf'))   return { bg: 'bg-red-100',    text: 'text-red-600',    label: 'PDF' }
  if (type?.includes('word') || type?.includes('doc')) return { bg: 'bg-blue-100', text: 'text-blue-600', label: 'DOC' }
  if (type?.includes('sheet') || type?.includes('xls')) return { bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'XLS' }
  if (type?.includes('image') || type?.includes('png') || type?.includes('jpg')) return { bg: 'bg-purple-100', text: 'text-purple-600', label: 'IMG' }
  return { bg: 'bg-slate-100', text: 'text-slate-600', label: 'FILE' }
}

const formatSize = (bytes) => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function Documents() {
  const { hasRole } = useAuth()
  const [docs, setDocs]           = useState([])
  const [meta, setMeta]           = useState({})
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [categorie, setCategorie] = useState('Tous')
  const [page, setPage]           = useState(1)
  const [showUpload, setShowUpload]   = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [confirmDoc,  setConfirmDoc]  = useState(null)
  const [deleting,    setDeleting]    = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [exporting,   setExporting]   = useState(false)
  const [advanced, setAdvanced] = useState({
    file_type: '', date_from: '', date_to: '', size_min: '', size_max: '', sort: 'created_at', dir: 'desc',
  })
  const navigate = useNavigate()

  const setAdv = (key, val) => setAdvanced(a => ({ ...a, [key]: val }))

  const hasAdvanced = Object.entries(advanced)
    .some(([k, v]) => v && k !== 'sort' && k !== 'dir')

  const resetAdvanced = () => setAdvanced({ file_type: '', date_from: '', date_to: '', size_min: '', size_max: '', sort: 'created_at', dir: 'desc' })

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, sort: advanced.sort, dir: advanced.dir }
      if (search)               params.search    = search
      if (categorie !== 'Tous') params.categorie = categorie
      if (advanced.file_type)   params.file_type = advanced.file_type
      if (advanced.date_from)   params.date_from = advanced.date_from
      if (advanced.date_to)     params.date_to   = advanced.date_to
      if (advanced.size_min)    params.size_min  = advanced.size_min
      if (advanced.size_max)    params.size_max  = advanced.size_max
      const { data } = await getDocuments(params)
      setDocs(data.data)
      setMeta({ total: data.total, lastPage: data.last_page, from: data.from, to: data.to })
    } catch { /* géré par l'interceptor */ }
    finally { setLoading(false) }
  }, [page, search, categorie, advanced])

  useEffect(() => { fetchDocs() }, [fetchDocs])
  useEffect(() => { setPage(1) }, [search, categorie, advanced])

  const handleDelete = async () => {
    setDeleting(confirmDoc.id)
    try {
      await deleteDocument(confirmDoc.id)
      setConfirmDoc(null)
      fetchDocs()
    } finally { setDeleting(null) }
  }

  const handleDownload = async (doc) => {
    setDownloading(doc.id)
    try {
      const { data, headers } = await downloadDocument(doc.id)
      const url  = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', doc.file_name)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch { /* silence */ }
    finally { setDownloading(null) }
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

  const canUpload  = hasRole('admin') || hasRole('archiviste')
  const canDelete  = hasRole('admin') || hasRole('archiviste')

  return (
    <div className="space-y-8">

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Documents</h1>
          <p className="text-slate-400 text-sm mt-2">
            {meta.total ?? '—'} document{meta.total !== 1 ? 's' : ''} archivé{meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 text-sm font-semibold px-4 py-3 rounded-xl transition-colors border border-slate-200 shadow-sm"
          >
            {exporting ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            Exporter CSV
          </button>

          {canUpload && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-md shadow-blue-600/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau document
            </button>
          )}
        </div>
      </div>

      {/* Barre de recherche + filtres */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un document…"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategorie(cat)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                categorie === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Filtres avancés
            {hasAdvanced && (
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">actifs</span>
            )}
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="border-t border-slate-100 px-5 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Type de fichier */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type de fichier</label>
              <select
                value={advanced.file_type}
                onChange={(e) => setAdv('file_type', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
              >
                <option value="">Tous les types</option>
                <option value="pdf">PDF</option>
                <option value="word">Word (DOC)</option>
                <option value="sheet">Excel (XLS)</option>
                <option value="image">Image</option>
                <option value="plain">Texte</option>
              </select>
            </div>

            {/* Date de */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ajouté du</label>
              <input
                type="date"
                value={advanced.date_from}
                onChange={(e) => setAdv('date_from', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
              />
            </div>

            {/* Date au */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Au</label>
              <input
                type="date"
                value={advanced.date_to}
                onChange={(e) => setAdv('date_to', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
              />
            </div>

            {/* Taille min */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Taille min (Ko)</label>
              <input
                type="number"
                min="0"
                value={advanced.size_min}
                onChange={(e) => setAdv('size_min', e.target.value)}
                placeholder="Ex: 100"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
              />
            </div>

            {/* Taille max */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Taille max (Ko)</label>
              <input
                type="number"
                min="0"
                value={advanced.size_max}
                onChange={(e) => setAdv('size_max', e.target.value)}
                placeholder="Ex: 5000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
              />
            </div>

            {/* Tri */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Trier par</label>
              <div className="flex gap-2">
                <select
                  value={advanced.sort}
                  onChange={(e) => setAdv('sort', e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                >
                  <option value="created_at">Date</option>
                  <option value="title">Titre</option>
                  <option value="file_size">Taille</option>
                  <option value="categorie">Catégorie</option>
                </select>
                <button
                  onClick={() => setAdv('dir', advanced.dir === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
                  title={advanced.dir === 'asc' ? 'Croissant' : 'Décroissant'}
                >
                  {advanced.dir === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {/* Reset */}
            {hasAdvanced && (
              <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                <button
                  onClick={resetAdvanced}
                  className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Effacer les filtres avancés
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Liste documents */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-700 font-medium">Aucun document trouvé</p>
            <p className="text-slate-400 text-sm mt-1">
              {search ? `Aucun résultat pour "${search}"` : 'Commencez par uploader un document'}
            </p>
          </div>
        ) : (
          <>
            {/* Header tableau */}
            <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <div className="col-span-5">Document</div>
              <div className="col-span-2">Catégorie</div>
              <div className="col-span-2">Uploadé par</div>
              <div className="col-span-1">Taille</div>
              <div className="col-span-1">Date</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Lignes */}
            <div className="divide-y divide-slate-50">
              {docs.map((doc) => {
                const icon = fileIcon(doc.file_type)
                return (
                  <div key={doc.id} className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-slate-50 transition-colors group">

                    {/* Nom + type */}
                    <div
                      className="col-span-5 flex items-center gap-3 min-w-0 cursor-pointer"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      <div className={`w-9 h-9 rounded-xl ${icon.bg} flex items-center justify-center shrink-0`}>
                        <span className={`text-xs font-bold ${icon.text}`}>{icon.label}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate hover:text-blue-600 transition-colors">{doc.title}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{doc.file_name}</p>
                      </div>
                    </div>

                    {/* Catégorie */}
                    <div className="col-span-2">
                      <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">
                        {doc.categorie}
                      </span>
                    </div>

                    {/* Uploader */}
                    <div className="col-span-2 flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {doc.uploader?.name?.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-600 truncate">{doc.uploader?.name}</span>
                    </div>

                    {/* Taille */}
                    <div className="col-span-1 text-sm text-slate-500">{formatSize(doc.file_size)}</div>

                    {/* Date */}
                    <div className="col-span-1 text-sm text-slate-500">{formatDate(doc.created_at)}</div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDownload(doc)}
                        disabled={downloading === doc.id}
                        title="Télécharger"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-40"
                      >
                        {downloading === doc.id ? (
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setConfirmDoc(doc)}
                          disabled={deleting === doc.id}
                          title="Supprimer"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-40"
                        >
                          {deleting === doc.id ? (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                          ) : (
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
          <p className="text-sm text-slate-500">
            {meta.from}–{meta.to} sur {meta.total} documents
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
              disabled={page === meta.lastPage}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}

      {/* Modale confirmation suppression */}
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

      {/* Modal upload */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); fetchDocs() }}
        />
      )}
    </div>
  )
}
