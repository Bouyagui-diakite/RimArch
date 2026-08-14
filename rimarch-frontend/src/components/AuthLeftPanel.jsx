/* Panneau visuel des pages d'authentification.
   Composition éditoriale : encre profonde, trame d'archives, grain. */

const COPY = {
  login: {
    kicker: 'Plateforme d’archives',
    title: 'Bienvenue',
    text: 'Vos fonds, séries et dossiers réunis dans un seul espace. Classés, sécurisés, retrouvables en quelques secondes.',
  },
  register: {
    kicker: 'Créer un compte',
    title: 'Rejoignez-nous',
    text: 'Ouvrez votre espace RIMArch et commencez à structurer vos archives dès la première minute.',
  },
}

const STATS = [
  { value: '256-bit', label: 'Chiffrement' },
  { value: '4 rôles', label: 'Habilitations' },
  { value: '24/7', label: 'Disponibilité' },
]

/* Pile de dossiers en perspective — dessinée, pas photographiée. */
function ArchiveStack() {
  return (
    <svg
      viewBox="0 0 320 300"
      fill="none"
      className="w-full max-w-[280px] drop-shadow-2xl"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sheet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4560ff" />
          <stop offset="100%" stopColor="#1f3bff" />
        </linearGradient>
      </defs>

      {/* Feuilles empilées */}
      {[0, 1, 2].map((i) => {
        const y = i * 46
        return (
          <g key={i} opacity={1 - i * 0.22}>
            <path
              d={`M160 ${28 + y} L296 ${86 + y} L160 ${144 + y} L24 ${86 + y} Z`}
              fill="url(#sheet)"
              stroke="rgba(255,255,255,0.24)"
              strokeWidth="1"
            />
            {i === 2 && (
              <path
                d={`M160 ${144 + y} L296 ${86 + y} L296 ${98 + y} L160 ${156 + y} L24 ${98 + y} L24 ${86 + y} Z`}
                fill="url(#edge)"
                opacity="0.9"
              />
            )}
          </g>
        )
      })}

      {/* Lignes de reliure */}
      <g stroke="rgba(255,255,255,0.28)" strokeWidth="1" strokeDasharray="3 5">
        <path d="M24 86 L24 178" />
        <path d="M296 86 L296 178" />
        <path d="M160 28 L160 120" />
      </g>
    </svg>
  )
}

export default function AuthLeftPanel({ mode = 'login' }) {
  const copy = COPY[mode] ?? COPY.login

  return (
    <div className="relative hidden lg:flex lg:w-[46%] shrink-0 flex-col justify-between overflow-hidden bg-[#0b0d16] grain">

      {/* Halos */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-cobalt/25 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-[380px] w-[380px] rounded-full bg-cobalt-lift/15 blur-[120px]" />

      {/* Trame */}
      <div className="blueprint pointer-events-none absolute inset-0 opacity-40" />

      {/* Filet vertical typographique */}
      <div className="pointer-events-none absolute inset-y-0 left-14 w-px bg-white/[0.07]" />

      {/* ── Haut : marque ── */}
      <div className="relative z-10 flex items-center gap-3 px-11 pt-10">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white">
          <span className="text-[15px] font-semibold leading-none text-[#0b0d16]">R</span>
        </div>
        <span className="text-[13px] font-semibold tracking-[0.22em] text-white uppercase">RIMArch</span>
      </div>

      {/* ── Centre : illustration ── */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-11 py-5">
        <ArchiveStack />
      </div>

      {/* ── Bas : accroche ── */}
      <div className="relative z-10 px-11 pb-10">
        <p className="eyebrow text-cobalt-glow">{copy.kicker}</p>
        <h2 className="font-display mt-3 text-[34px] leading-[1.06] text-white">
          {copy.title}<span className="text-cobalt-glow">.</span>
        </h2>
        <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-white/55">
          {copy.text}
        </p>

        <div className="mt-8 grid grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-lg border border-white/10">
          {STATS.map((s) => (
            <div key={s.label} className="px-3 py-3.5">
              <p className="text-[13px] font-semibold text-white">{s.value}</p>
              <p className="mt-0.5 text-[11px] text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
