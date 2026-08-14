import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../api/axios'
import AuthShell from '../components/AuthShell'
import PasswordStrength from '../components/PasswordStrength'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const token          = searchParams.get('token') || ''
  const emailParam     = searchParams.get('email') || ''

  const [form, setForm]       = useState({ email: emailParam, password: '', password_confirmation: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { ...form, token })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const errs = err.response?.data?.errors
      setError(errs ? Object.values(errs).flat().join(' ') : err.response?.data?.message || 'Lien invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      {success ? (
        <div className="rise">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#bcd8cb] bg-[#f0f7f3] text-[#2f7d63]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display mt-5 text-[31px] leading-[1.05] text-[#14151c]">Mot de passe modifié</h1>
          <p className="mt-4 text-[13.5px] leading-relaxed text-[#6b6c7a]">
            Votre nouveau mot de passe est actif. Redirection vers la page de connexion…
          </p>
          <div className="mt-9 border-t border-[#e4e0d7] pt-6">
            <Link to="/login" className="text-[13px] font-semibold text-cobalt underline decoration-cobalt/30 underline-offset-4 transition hover:decoration-cobalt">
              Se connecter maintenant →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="rise">
            <p className="eyebrow text-[#9c9ca8]">Réinitialisation</p>
            <h1 className="font-display mt-2.5 text-[31px] leading-[1.05] text-[#14151c] sm:text-[36px]">
              Nouveau mot de passe
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[#6b6c7a]">
              Au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.
            </p>
          </div>

          {error && (
            <div className="rise mt-6 flex items-start gap-3 rounded-lg border border-[#e4b4b4] bg-[#fdf3f2] px-4 py-3 text-[13px] leading-snug text-[#a33a35]">
              <svg className="mt-px h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">

            <div className="rise delay-1">
              <label htmlFor="email" className="eyebrow mb-2 block text-[#6b6c7a]">Compte concerné</label>
              <input id="email" type="email" value={form.email} readOnly
                className="field cursor-not-allowed bg-[#f2f0ea] text-[#6b6c7a]" />
            </div>

            <div className="rise delay-2">
              <label htmlFor="password" className="eyebrow mb-2 block text-[#6b6c7a]">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  id="password" type={showPw ? 'text' : 'password'} required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" className="field pr-12"
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-[#a2a1a9] transition hover:bg-[#f2f0ea] hover:text-[#14151c]"
                >
                  {showPw
                    ? <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg>
                    : <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            <div className="rise delay-3">
              <label htmlFor="password_confirmation" className="eyebrow mb-2 block text-[#6b6c7a]">Confirmation</label>
              <input
                id="password_confirmation" type={showPw ? 'text' : 'password'} required
                value={form.password_confirmation}
                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                placeholder="••••••••" className="field"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="rise delay-4 group flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#14151c] py-[15px] text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-all hover:bg-cobalt disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
                  </svg>
                  Enregistrement…
                </>
              ) : (
                <>
                  Réinitialiser
                  <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h15m0 0l-6-6m6 6l-6 6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="rise delay-5 mt-9 border-t border-[#e4e0d7] pt-6">
            <Link to="/login" className="text-[13px] font-semibold text-cobalt underline decoration-cobalt/30 underline-offset-4 transition hover:decoration-cobalt">
              ← Retour à la connexion
            </Link>
          </div>
        </>
      )}
    </AuthShell>
  )
}
