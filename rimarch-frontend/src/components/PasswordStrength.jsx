const LEVELS = [
  { min: 0, label: 'Très faible', bar: 'bg-[#c25048]', text: 'text-[#c25048]', segments: 1 },
  { min: 2, label: 'Faible',      bar: 'bg-clay',      text: 'text-clay',      segments: 2 },
  { min: 3, label: 'Moyen',       bar: 'bg-[#b8892f]', text: 'text-[#b8892f]', segments: 3 },
  { min: 5, label: 'Fort',        bar: 'bg-cobalt',    text: 'text-cobalt',    segments: 4 },
  { min: 6, label: 'Très fort',   bar: 'bg-moss',      text: 'text-moss',      segments: 4 },
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
      {/* Jauge + niveau */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">
          {[1, 2, 3, 4].map((seg) => (
            <div key={seg} className="h-1 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-300 ${seg <= level.segments ? level.bar : ''}`}
                style={{ width: seg <= level.segments ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>
        <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] ${level.text}`}>
          {level.label}
        </span>
      </div>

      {/* Critères */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {CRITERIA.map(({ label, test }) => {
          const ok = test(password)
          return (
            <span key={label} className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${ok ? 'text-moss' : 'text-faint'}`}>
              <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  )
}
