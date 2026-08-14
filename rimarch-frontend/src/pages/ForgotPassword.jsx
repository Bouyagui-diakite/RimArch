import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import api from '../api/axios'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      const errs = err.response?.data?.errors
      setError(errs ? Object.values(errs).flat().join(' ') : err.response?.data?.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      {sent ? (
        <div className="rise">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#bcd8cb] bg-[#f0f7f3] text-[#2f7d63]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="font-display mt-5 text-[31px] leading-[1.05] text-[#14151c]">Email envoyé</h1>
          <p className="mt-4 text-[13.5px] leading-relaxed text-[#6b6c7a]">
            Un lien de réinitialisation vient d’être envoyé à{' '}
            <span className="font-semibold text-[#14151c]">{email}</span>. Vérifiez votre boîte de réception,
            le lien reste valable 60 minutes.
          </p>
          <div className="mt-9 border-t border-[#e4e0d7] pt-6">
            <Link to="/login" className="text-[13px] font-semibold text-cobalt underline decoration-cobalt/30 underline-offset-4 transition hover:decoration-cobalt">
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="rise">
            <p className="eyebrow text-[#9c9ca8]">Récupération</p>
            <h1 className="font-display mt-2.5 text-[31px] leading-[1.05] text-[#14151c] sm:text-[36px]">
              Mot de passe oublié
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[#6b6c7a]">
              Indiquez votre adresse email : nous vous enverrons un lien de réinitialisation.
            </p>
          </div>

          {error && (
            <div className="rise mt-6 flex items-start gap-3 rounded-lg border border-[#e4b4b4] bg-[#fdf3f2] px-4 py-3 text-[13px] text-[#a33a35]">
              <svg className="mt-px h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="rise delay-1">
              <label htmlFor="email" className="eyebrow mb-2 block text-[#6b6c7a]">Adresse email</label>
              <input
                id="email" type="email" required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="field"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="rise delay-2 group flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#14151c] py-[15px] text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-all hover:bg-cobalt disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
                  </svg>
                  Envoi…
                </>
              ) : (
                <>
                  Envoyer le lien
                  <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h15m0 0l-6-6m6 6l-6 6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="rise delay-3 mt-9 border-t border-[#e4e0d7] pt-6">
            <Link to="/login" className="text-[13px] font-semibold text-cobalt underline decoration-cobalt/30 underline-offset-4 transition hover:decoration-cobalt">
              ← Retour à la connexion
            </Link>
          </div>
        </>
      )}
    </AuthShell>
  )
}
