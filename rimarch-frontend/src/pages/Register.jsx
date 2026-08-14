import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import PasswordStrength from '../components/PasswordStrength'
import AuthLeftPanel from '../components/AuthLeftPanel'
import AuthShell from '../components/AuthShell'
import api from '../api/axios'

function EyeIcon({ open }) {
  return open
    ? <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg>
    : <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
}

function ConfirmPasswordInput({ value, password, showPassword, onChange }) {
  const isEmpty = !value
  const matches = value === password

  const stateCls = isEmpty
    ? ''
    : matches
      ? 'border-[#3f8f74] focus:border-[#3f8f74] focus:shadow-[0_0_0_3px_rgba(63,143,116,0.14)]'
      : 'border-[#cf6a63] focus:border-[#cf6a63] focus:shadow-[0_0_0_3px_rgba(207,106,99,0.14)]'

  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'} required
        value={value} onChange={onChange} autoComplete="new-password"
        placeholder="••••••••"
        className={`field pr-11 ${stateCls}`}
      />
      {!isEmpty && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          {matches
            ? <svg className="h-4 w-4 text-[#2f7d63]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" /></svg>
            : <svg className="h-4 w-4 text-[#c25048]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" /></svg>
          }
        </span>
      )}
    </div>
  )
}

const PASSWORD_REQUIREMENTS = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.'

function isStrongPassword(p) {
  return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)
}

function extractApiError(err) {
  const data = err.response?.data
  if (data?.errors) return Object.values(data.errors).flat().join(' ')
  return data?.message || "Erreur lors de l'inscription."
}

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isStrongPassword(form.password)) { setError(PASSWORD_REQUIREMENTS); return }
    if (form.password !== form.password_confirmation) { setError('Les mots de passe ne correspondent pas.'); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      await login(form.email, form.password)
      navigate('/verify-email')
    } catch (err) {
      setError(extractApiError(err))
    } finally { setLoading(false) }
  }

  return (
    <AuthShell panel={<AuthLeftPanel mode="register" />}>

      <div className="rise">
        <p className="eyebrow text-[#9c9ca8]">Nouveau compte</p>
        <h1 className="font-display mt-2.5 text-[32px] leading-[1.05] text-[#14151c] sm:text-[37px]">
          Créer un compte
        </h1>
        <p className="mt-3 text-[13.5px] text-[#6b6c7a]">
          Quelques informations et votre espace est prêt.
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

      <form onSubmit={handleSubmit} autoComplete="off" className="mt-7 space-y-5">

        <div className="rise delay-1">
          <label htmlFor="name" className="eyebrow mb-2 block text-[#6b6c7a]">Nom complet</label>
          <input id="name" type="text" required autoComplete="off" value={form.name} onChange={set('name')}
            placeholder="Jean Dupont" className="field" />
        </div>

        <div className="rise delay-2">
          <label htmlFor="email" className="eyebrow mb-2 block text-[#6b6c7a]">Adresse email</label>
          <input id="email" type="email" required autoComplete="off" value={form.email} onChange={set('email')}
            placeholder="vous@exemple.com" className="field" />
        </div>

        <div className="rise delay-3">
          <label htmlFor="password" className="eyebrow mb-2 block text-[#6b6c7a]">Mot de passe</label>
          <div className="relative">
            <input id="password" type={showPassword ? 'text' : 'password'} required autoComplete="new-password"
              value={form.password} onChange={set('password')}
              placeholder="••••••••" className="field pr-12" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-[#a2a1a9] transition hover:bg-[#f2f0ea] hover:text-[#14151c]"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          <PasswordStrength password={form.password} />
        </div>

        <div className="rise delay-4">
          <label className="eyebrow mb-2 block text-[#6b6c7a]">Confirmation</label>
          <ConfirmPasswordInput
            value={form.password_confirmation} password={form.password}
            showPassword={showPassword} onChange={set('password_confirmation')}
          />
        </div>

        <button
          type="submit" disabled={loading}
          className="rise delay-5 group flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#14151c] py-[15px] text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-all hover:bg-cobalt disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
              </svg>
              Création…
            </>
          ) : (
            <>
              Créer mon compte
              <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h15m0 0l-6-6m6 6l-6 6" />
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="rise delay-6 mt-8 border-t border-[#e4e0d7] pt-6">
        <p className="text-[13px] text-[#6b6c7a]">
          Vous avez déjà un compte ?{' '}
          <Link
            to="/login"
            className="font-semibold text-cobalt underline decoration-cobalt/30 underline-offset-4 transition hover:decoration-cobalt"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
