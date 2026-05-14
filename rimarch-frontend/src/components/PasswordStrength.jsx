const LEVELS = [
  { min: 0, label: 'Très faible', bar: 'bg-red-500',     text: 'text-red-500',     segments: 1 },
  { min: 2, label: 'Faible',      bar: 'bg-orange-500',  text: 'text-orange-500',  segments: 2 },
  { min: 3, label: 'Moyen',       bar: 'bg-amber-500',   text: 'text-amber-500',   segments: 3 },
  { min: 5, label: 'Fort',        bar: 'bg-blue-500',    text: 'text-blue-500',    segments: 4 },
  { min: 6, label: 'Très fort',   bar: 'bg-emerald-500', text: 'text-emerald-500', segments: 4 },
]

function getLevel(password) {
  if (!password) return null
  let score = 0
  if (password.length >= 8)           score++
  if (password.length >= 12)          score++
  if (/[A-Z]/.test(password))         score++
  if (/[a-z]/.test(password))         score++
  if (/[0-9]/.test(password))         score++
  if (/[^A-Za-z0-9]/.test(password))  score++
  return [...LEVELS].reverse().find(l => score >= l.min) ?? LEVELS[0]
}

const CRITERIA = [
  { label: '8 caractères minimum', test: (p) => p.length >= 8 },
  { label: 'Lettre majuscule',      test: (p) => /[A-Z]/.test(p) },
  { label: 'Chiffre',               test: (p) => /[0-9]/.test(p) },
  { label: 'Caractère spécial',     test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export default function PasswordStrength({ password }) {
  if (!password) return null
  const level = getLevel(password)

  return (
    <div className="mt-3 space-y-2.5">
      {/* Segments bar */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((seg) => (
          <div key={seg} className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${seg <= level.segments ? level.bar : ''}`}
              style={{ width: seg <= level.segments ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Label + criteria */}
      <div className="flex items-start justify-between gap-4">
        <span className={`text-xs font-semibold ${level.text}`}>{level.label}</span>
        <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
          {CRITERIA.map(({ label, test }) => {
            const ok = test(password)
            return (
              <span key={label} className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${ok ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-600'}`}>
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {ok
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  }
                </svg>
                {label}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
