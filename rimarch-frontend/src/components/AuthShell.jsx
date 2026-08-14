/* Cadre commun aux pages d'authentification.
   Fond papier neutre, carte posée dessus — aucune couleur de fond saturée. */

export default function AuthShell({ panel, children }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden bg-[#f0eee9] px-4 py-7 sm:px-8">

      {/* Dégradé très léger pour éviter l'aplat parfaitement plat */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,#faf9f7_0%,#f0eee9_55%,#e9e6df_100%)]" />

      {/* ── Carte ── */}
      <div
        className={`fade relative z-10 flex w-full overflow-hidden rounded-[20px] border border-[#e0dcd3] bg-white shadow-[0_24px_70px_-30px_rgba(20,21,28,0.35)] ${
          panel ? 'max-w-[1060px]' : 'max-w-[520px]'
        }`}
      >

        {panel}

        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-12 lg:px-14 lg:py-12">
          <div className="mx-auto w-full max-w-[400px]">

            {/* Marque — visible seulement quand le volet visuel est masqué */}
            <div className={`mb-9 flex items-center gap-3 ${panel ? 'lg:hidden' : ''}`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#14151c]">
                <span className="text-[15px] font-semibold leading-none text-white">R</span>
              </div>
              <span className="text-[13px] font-semibold uppercase tracking-[0.22em] text-[#14151c]">RIMArch</span>
            </div>

            {children}
          </div>
        </div>
      </div>

      {/* Mentions */}
      <p className="relative z-10 text-center text-[11px] text-[#9c9ca8]">
        RIMArch © {new Date().getFullYear()} — Gestion et conservation d’archives
      </p>
    </div>
  )
}
