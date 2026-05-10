const features = [
  { icon: '🗂️', title: 'Archivage structuré',   desc: 'Classez par fonds, séries et catégories' },
  { icon: '🔍', title: 'Recherche instantanée',  desc: 'Retrouvez n\'importe quel document en secondes' },
  { icon: '🔐', title: 'Accès sécurisé',         desc: 'Droits granulaires par rôle utilisateur' },
]

export default function AuthLeftPanel({ mode = 'login' }) {
  const isRegister = mode === 'register'

  return (
    <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">

      {/* Cercles décoratifs */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-600 opacity-[0.07] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500 opacity-[0.07] rounded-full pointer-events-none" />

      {/* ── Logo ── */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <span className="text-white font-bold text-base tracking-wide">RIMArch</span>
      </div>

      {/* ── Contenu central ── */}
      <div className="relative z-10 flex flex-col items-center text-center">

        {/* Icône principale */}
        <div className="w-16 h-16 bg-white/10 border border-white/15 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
          {isRegister ? (
            <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          )}
        </div>

        {/* Titre */}
        <h1 className="text-3xl font-bold text-white tracking-tight leading-snug mb-3">
          {isRegister ? 'Rejoignez RIMArch' : 'Bienvenue sur RIMArch'}
        </h1>

        {/* Sous-titre */}
        <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-10">
          {isRegister
            ? 'Créez votre compte et accédez à la plateforme de gestion d\'archives.'
            : 'Organisez, retrouvez et partagez vos documents d\'archives en toute sécurité.'}
        </p>

        {/* Features */}
        <div className="w-full space-y-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex items-center gap-4 bg-white/5 border border-white/8 rounded-xl px-4 py-3.5 text-left"
            >
              <span className="text-lg shrink-0 w-7 text-center">{f.icon}</span>
              <div>
                <p className="text-white text-sm font-semibold leading-none">{f.title}</p>
                <p className="text-slate-500 text-xs mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <p className="relative z-10 text-slate-600 text-xs text-center">
        © {new Date().getFullYear()} RIMArch — Tous droits réservés
      </p>
    </div>
  )
}
