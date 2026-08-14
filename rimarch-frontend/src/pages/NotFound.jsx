import { useNavigate } from 'react-router-dom'
import { panelCls, Button } from '../components/ui'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className={`${panelCls} overflow-hidden`}>
      <div className="relative overflow-hidden bg-[#0b0d16] px-8 py-14 text-center grain">
        <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-cobalt/25 blur-[90px]" />
        <div className="blueprint pointer-events-none absolute inset-0 opacity-40" />
        <p className="font-display relative text-[84px] leading-none text-white/90 sm:text-[110px]">404</p>
        <p className="eyebrow relative mt-2 text-cobalt-glow">Cote introuvable</p>
      </div>

      <div className="px-8 py-9 text-center">
        <h1 className="font-display text-[23px] leading-tight text-ink">Page introuvable</h1>
        <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-muted">
          Le lien est peut-être obsolète, ou le document a été déplacé vers la corbeille.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <Button onClick={() => navigate(-1)}>← Retour</Button>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>Tableau de bord</Button>
        </div>
      </div>
    </div>
  )
}
