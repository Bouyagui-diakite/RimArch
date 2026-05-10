import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">🗂️</span>
        </div>
        <h1 className="text-8xl font-black text-slate-200 leading-none mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Page introuvable</h2>
        <p className="text-slate-400 text-sm mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
          >
            ← Retour
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all"
          >
            Tableau de bord
          </button>
        </div>
      </div>
    </div>
  )
}
