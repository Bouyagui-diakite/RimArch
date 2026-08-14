import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AuthLeftPanel from '../components/AuthLeftPanel'
import AuthShell from '../components/AuthShell'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      const isAdmin = user?.roles?.some((r) => r.name === 'admin')
      navigate(isAdmin ? '/admin/utilisateurs' : '/dashboard')
    } catch (err) {
      setError(
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        'Identifiants incorrects.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell panel={<AuthLeftPanel mode="login" />}>

      {/* ── En-tête ── */}
      <div className="rise">
        <p className="eyebrow text-[#9c9ca8]">Espace sécurisé</p>
        <h1 className="font-display mt-2.5 text-[34px] leading-[1.05] text-[#14151c] sm:text-[40px]">
          Connexion
        </h1>
        <p className="mt-3 text-[13.5px] text-[#6b6c7a]">
          Entrez vos identifiants pour accéder à vos archives.
        </p>
      </div>

      {/* ── Erreur ── */}
      {error && (
        <div className="rise mt-7 flex items-start gap-3 rounded-lg border border-[#e4b4b4] bg-[#fdf3f2] px-4 py-3 text-[13px] text-[#a33a35]">
          <svg className="mt-px h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Formulaire ── */}
      <form onSubmit={handleSubmit} autoComplete="off" className="mt-8 space-y-5">

        <div className="rise delay-1">
          <label htmlFor="email" className="eyebrow mb-2 block text-[#6b6c7a]">Adresse email</label>
          <input
            id="email" type="email" required autoComplete="off"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="vous@exemple.com"
            className="field"
          />
        </div>

        <div className="rise delay-2">
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="password" className="eyebrow text-[#6b6c7a]">Mot de passe</label>
            <Link
              to="/forgot-password"
              className="text-[12px] font-medium text-cobalt underline decoration-cobalt/30 underline-offset-4 transition hover:decoration-cobalt"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password" type={showPassword ? 'text' : 'password'} required autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="field pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-[#a2a1a9] transition hover:bg-[#f2f0ea] hover:text-[#14151c]"
            >
              {showPassword
                ? <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg>
                : <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              }
            </button>
          </div>
        </div>

        <button
          type="submit" disabled={loading}
          className="rise delay-3 group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-lg bg-[#14151c] py-[15px] text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-all hover:bg-cobalt disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
              </svg>
              Connexion…
            </>
          ) : (
            <>
              Se connecter
              <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h15m0 0l-6-6m6 6l-6 6" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* ── Pied ── */}
      <div className="rise delay-4 mt-10 border-t border-[#e4e0d7] pt-6">
        <p className="text-[13px] text-[#6b6c7a]">
          Pas encore de compte ?{' '}
          <Link
            to="/register"
            className="font-semibold text-cobalt underline decoration-cobalt/30 underline-offset-4 transition hover:decoration-cobalt"
          >
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
