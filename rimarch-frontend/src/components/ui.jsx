/* eslint-disable react-refresh/only-export-components --
   Fichier de design system : il expose volontairement des composants ET des
   constantes de style / helpers de formatage. Le fast-refresh recharge donc
   le module entier quand on le modifie, ce qui est acceptable ici. */

/* Primitives d'interface RIMArch — encre, papier, cobalt.
   Toutes les pages internes s'appuient dessus pour rester cohérentes. */

export const panelCls = 'rounded-[14px] border border-line bg-surface'

export const Spinner = ({ className = 'h-4 w-4' }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
  </svg>
)

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-ink/[0.07] dark:bg-white/[0.06] ${className}`} />
)

/* ── En-tête de page ── */
export function PageHeader({ eyebrow, title, sub, children }) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow text-faint">{eyebrow}</p>}
        <h1 className="font-display mt-2 text-[27px] leading-[1.08] text-ink sm:text-[32px]">{title}</h1>
        {sub && <p className="mt-2 text-[13px] text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  )
}

/* ── En-tête de panneau ── */
export function SectionHead({ title, sub, action }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-line px-6 py-4">
      <div className="min-w-0">
        <h2 className="font-display text-[16px] leading-none text-ink">{title}</h2>
        {sub && <p className="mt-1.5 text-[12px] text-faint">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

/* ── Boutons ──
   primary : encre pleine · secondary : contour · danger : rouge sourd · quiet : texte seul */
const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg text-[12px] font-semibold uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-50'

const BTN_VARIANTS = {
  primary:   'bg-ink text-canvas hover:bg-cobalt hover:text-white',
  secondary: 'border border-line text-muted hover:border-ink hover:text-ink',
  danger:    'border border-[#c25048]/35 text-[#c25048] hover:bg-[#c25048] hover:text-white hover:border-[#c25048]',
  quiet:     'text-muted hover:text-ink',
}

const BTN_SIZES = {
  sm: 'px-3.5 py-2 text-[11px]',
  md: 'px-5 py-2.5',
  lg: 'px-6 py-3.5',
}

export function Button({ variant = 'secondary', size = 'md', loading, icon, children, className = '', ...props }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`${BTN_BASE} ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
}

/* ── Bouton icône ── */
export function IconButton({ label, danger, loading, children, className = '', ...props }) {
  return (
    <button
      {...props}
      title={label}
      aria-label={label}
      disabled={props.disabled || loading}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors disabled:opacity-40 ${
        danger ? 'hover:bg-[#c25048]/10 hover:text-[#c25048]' : 'hover:bg-raised hover:text-ink'
      } ${className}`}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

/* ── Lien fléché ── */
export function LinkButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="group flex shrink-0 items-center gap-1.5 text-[12px] font-semibold text-accent transition-all hover:gap-2.5"
    >
      {children}
      <span aria-hidden="true">→</span>
    </button>
  )
}

/* ── Étiquettes ── */
export const Tag = ({ children, className = '' }) => (
  <span className={`inline-flex items-center rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-muted ${className}`}>
    {children}
  </span>
)

/* Pastille de type de fichier — carré à filet, code trois lettres */
export const FileTag = ({ type, className = '' }) => (
  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-[10px] font-semibold tracking-wide text-muted ${className}`}>
    {fileLabel(type)}
  </span>
)

export const fileLabel = (type) => {
  if (type?.includes('pdf')) return 'PDF'
  if (type?.includes('word') || type?.includes('doc')) return 'DOC'
  if (type?.includes('sheet') || type?.includes('xls') || type?.includes('excel') || type?.includes('csv')) return 'XLS'
  if (type?.includes('image') || type?.includes('png') || type?.includes('jpg')) return 'IMG'
  if (type?.includes('zip') || type?.includes('rar')) return 'ZIP'
  if (type?.includes('plain') || type?.includes('text')) return 'TXT'
  return 'FIC'
}

/* ── Champ de recherche ── */
export function SearchField({ value, onChange, onClear, placeholder = 'Rechercher…', className = '' }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2.5 transition-all focus-within:border-cobalt focus-within:shadow-[0_0_0_3px_var(--rim-accent-soft)] ${className}`}>
      <svg className="h-4 w-4 shrink-0 text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink placeholder-faint focus:outline-none"
      />
      {value && (
        <button onClick={onClear} aria-label="Effacer" className="shrink-0 text-faint transition-colors hover:text-ink">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

/* ── Onglets / filtres en pastilles ── */
export function Pills({ items, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const key = typeof item === 'string' ? item : item.value
        const label = typeof item === 'string' ? item : item.label
        const active = key === value
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-all ${
              active
                ? 'bg-ink text-canvas'
                : 'border border-line text-muted hover:border-ink hover:text-ink'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/* ── État vide ── */
export function EmptyState({ title, children, icon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-line text-faint">
        {icon || (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
      </div>
      {title && <p className="font-display text-[16px] text-ink">{title}</p>}
      {children && <p className="max-w-xs text-[13px] text-muted">{children}</p>}
    </div>
  )
}

/* ── Bandeau d'alerte ── */
export function Notice({ tone = 'error', children, onClose }) {
  const tones = {
    error:   'border-[#c25048]/30 bg-[#c25048]/[0.07] text-[#a33a35] dark:text-[#e08b85]',
    warning: 'border-clay/30 bg-clay/[0.07] text-clay',
    info:    'border-cobalt/25 bg-cobalt/[0.06] text-accent',
  }
  return (
    <div className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-[13px] ${tones[tone]}`}>
      <span className="flex items-start gap-2.5">
        <svg className="mt-px h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {children}
      </span>
      {onClose && (
        <button onClick={onClose} aria-label="Fermer" className="shrink-0 opacity-60 transition-opacity hover:opacity-100">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

/* ── Pagination ── */
export function Pagination({ page, lastPage, from, to, total, unit = 'éléments', onPage }) {
  if (!lastPage || lastPage <= 1) return null
  return (
    <div className="flex items-center justify-between gap-4 px-1">
      <p className="text-[12.5px] text-muted">
        {from}–{to} sur {total} {unit}
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}>
          ← Précédent
        </Button>
        <Button size="sm" onClick={() => onPage(Math.min(lastPage, page + 1))} disabled={page === lastPage}>
          Suivant →
        </Button>
      </div>
    </div>
  )
}

/* ── Champ de formulaire clair/sombre (pages internes) ── */
export const inputCls =
  'w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink placeholder-faint transition-all focus:border-cobalt focus:outline-none focus:shadow-[0_0_0_3px_var(--rim-accent-soft)]'

export function Field({ label, children, hint }) {
  return (
    <div>
      {label && <label className="eyebrow mb-2 block text-muted">{label}</label>}
      {children}
      {hint && <p className="mt-1.5 text-[11.5px] text-faint">{hint}</p>}
    </div>
  )
}

/* ── Modale ── */
const MODAL_SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl', xl: 'max-w-2xl' }

export function Modal({ eyebrow, title, sub, onClose, children, footer, size = 'lg' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b0d16]/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-2xl ${MODAL_SIZES[size]}`}>
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-7 py-5">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow text-faint">{eyebrow}</p>}
            <h2 className="font-display mt-1.5 text-[20px] leading-none text-ink">{title}</h2>
            {sub && <p className="mt-2 text-[12.5px] text-muted">{sub}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-raised hover:text-ink"
          >
            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6">{children}</div>

        {footer && (
          <div className="flex shrink-0 justify-end gap-2.5 border-t border-line px-7 py-4">{footer}</div>
        )}
      </div>
    </div>
  )
}

/* ── Formatage ── */
export const formatSize = (bytes) => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export const formatRelative = (iso) => {
  if (!iso) return '—'
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return "À l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
