import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AuthLeftPanel from '../components/AuthLeftPanel'

function EyeIcon({ open }) {
  return open
    ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
    : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
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
    if (form.password !== form.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        const errs = data.errors ? Object.values(data.errors).flat().join(' ') : data.message
        setError(errs || 'Erreur lors de l\'inscription.')
        return
      }
      await login(form.email, form.password)
      navigate('/verify-email')
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      <AuthLeftPanel mode="register" />

      {/* ── Panneau droit ── */}
      <div className="flex-1 flex items-center justify-center bg-[#0f1117] px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Titre */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight">Créer un compte</h2>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3.5 mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm text-slate-400 mb-2">Nom complet</label>
              <input type="text" required value={form.name} onChange={set('name')}
                placeholder="Jean Dupont"
                className="w-full bg-[#161b27] border border-[#2a2f3e] rounded-xl px-4 py-3.5 text-base text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Adresse email</label>
              <input type="email" required value={form.email} onChange={set('email')}
                placeholder="votre@email.com"
                className="w-full bg-[#161b27] border border-[#2a2f3e] rounded-xl px-4 py-3.5 text-base text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                  placeholder="••••••••"
                  className="w-full bg-[#161b27] border border-[#2a2f3e] rounded-xl px-4 pr-12 py-3.5 text-base text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors">
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Confirmer le mot de passe</label>
              <input type={showPassword ? 'text' : 'password'} required value={form.password_confirmation} onChange={set('password_confirmation')}
                placeholder="••••••••"
                className="w-full bg-[#161b27] border border-[#2a2f3e] rounded-xl px-4 py-3.5 text-base text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold rounded-xl py-3.5 text-base transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-white font-bold hover:text-slate-300 transition-colors">
              Se connecter
            </Link>
          </p>

          <p className="text-center text-xs text-slate-700 mt-8">
            RIMArch © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}