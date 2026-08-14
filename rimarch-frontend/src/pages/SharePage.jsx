import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSharedDocument } from '../api/documents'
import api from '../api/axios'
import AuthShell from '../components/AuthShell'
import { Spinner, fileLabel, formatSize } from '../components/ui'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

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

  return (
    <AuthShell>
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#9c9ca8]">
          <Spinner className="h-7 w-7" />
        </div>
      ) : error ? (
        <div className="rise">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#e4b4b4] bg-[#fdf3f2] text-[#a33a35]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-display mt-5 text-[30px] leading-[1.05] text-[#14151c]">Lien indisponible</h1>
          <p className="mt-4 text-[13.5px] leading-relaxed text-[#6b6c7a]">{error}</p>
          <p className="mt-8 border-t border-[#e4e0d7] pt-6 text-[12px] text-[#9c9ca8]">
            Demandez un nouveau lien à la personne qui vous a partagé ce document.
          </p>
        </div>
      ) : (
        <div className="rise">
          <p className="eyebrow text-[#9c9ca8]">Document partagé</p>

          <div className="mt-4 flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#ddd8cd] bg-white text-[11px] font-semibold tracking-wide text-[#6b6c7a]">
              {fileLabel(doc.file_type)}
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-[24px] leading-tight text-[#14151c]">{doc.title}</h1>
              <p className="mt-1 truncate text-[12.5px] text-[#9c9ca8]">{doc.file_name}</p>
            </div>
          </div>

          <dl className="mt-8 divide-y divide-[#e4e0d7] border-y border-[#e4e0d7]">
            {[
              { label: 'Catégorie',       value: doc.categorie },
              { label: 'Taille',          value: formatSize(doc.file_size) },
              { label: 'Téléchargements', value: doc.download_count },
              { label: 'Expire le',       value: doc.expires_at ? formatDate(doc.expires_at) : 'Jamais' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4 py-3">
                <dt className="text-[12.5px] text-[#6b6c7a]">{label}</dt>
                <dd className="text-right text-[12.5px] font-medium text-[#14151c]">{value}</dd>
              </div>
            ))}
          </dl>

          <button
            onClick={handleDownload} disabled={downloading}
            className="group mt-7 flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#14151c] py-[15px] text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-all hover:bg-cobalt disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? (
              <>
                <Spinner />
                Téléchargement…
              </>
            ) : (
              <>
                Télécharger le document
                <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </>
            )}
          </button>

          <p className="mt-6 text-center text-[11.5px] text-[#9c9ca8]">
            Partagé via RIMArch — chaque téléchargement est comptabilisé.
          </p>
        </div>
      )}
    </AuthShell>
  )
}
