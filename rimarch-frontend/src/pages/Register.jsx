import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AuthLeftPanel from '../components/AuthLeftPanel'
import api from '../api/axios'

function InputWrapper({ children }) {
  return (
    <div className="flex items-stretch bg-[#0d1018] border border-[#1e2436] rounded-xl overflow-hidden focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
      {children}
    </div>
  )
}

function IconSlot({ children }) {
  return (
    <div className="px-4 flex items-center shrink-0 border-r border-[#1e2436] text-slate-500">
      {children}
    </div>
  )
}

const inputCls = "flex-1 min-w-0 bg-transparent py-5 px-4 text-base text-white placeholder-slate-600 focus:outline-none"

function EyeIcon({ open }) {
  return open
    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
}

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const passwordMatch = form.password_confirmation && form.password === form.password_confirmation

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      await login(form.email, form.password)
      navigate('/verify-email')
    } catch (err) {
      const data = err.response?.data
      const errs = data?.errors ? Object.values(data.errors).flat().join(' ') : data?.message
      setError(errs || "Erreur lors de l'inscription.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <AuthLeftPanel mode="register" />

      <div className="flex-1 flex items-center justify-center bg-[#0a0d14] px-8 py-12">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="bg-[#111520] border border-[#1e2436] rounded-2xl px-8 py-14 shadow-2xl shadow-black/50">

            <div className="mb-10">
              <h2 className="text-3xl font-bold text-white tracking-tight">Créer un compte</h2>
              <p className="text-slate-500 text-sm mt-2">Rejoignez la plateforme RIMArch</p>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3.5 mb-6 text-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Full name */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nom complet</label>
                <InputWrapper>
                  <IconSlot>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </IconSlot>
                  <input type="text" required value={form.name} onChange={set('name')}
                    placeholder="Jean Dupont" className={inputCls} />
                </InputWrapper>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Adresse email</label>
                <InputWrapper>
                  <IconSlot>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </IconSlot>
                  <input type="email" required value={form.email} onChange={set('email')}
                    placeholder="votre@email.com" className={inputCls} />
                </InputWrapper>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Mot de passe</label>
                <InputWrapper>
                  <IconSlot>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </IconSlot>
                  <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                    placeholder="••••••••" className={inputCls} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="px-4 flex items-center text-slate-600 hover:text-slate-400 transition-colors shrink-0">
                    <EyeIcon open={showPassword} />
                  </button>
                </InputWrapper>
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirmer le mot de passe</label>
                <div className={`flex items-stretch bg-[#0d1018] border rounded-xl overflow-hidden focus-within:ring-2 transition-all ${
                  form.password_confirmation
                    ? passwordMatch
                      ? 'border-emerald-500/40 focus-within:border-emerald-500/60 focus-within:ring-emerald-500/10'
                      : 'border-red-500/40 focus-within:border-red-500/60 focus-within:ring-red-500/10'
                    : 'border-[#1e2436] focus-within:border-blue-500/60 focus-within:ring-blue-500/10'
                }`}>
                  <div className="px-4 flex items-center shrink-0 border-r border-[#1e2436]">
                    {form.password_confirmation
                      ? passwordMatch
                        ? <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        : <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      : <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    }
                  </div>
                  <input type={showPassword ? 'text' : 'password'} required value={form.password_confirmation} onChange={set('password_confirmation')}
                    placeholder="••••••••" className={inputCls} />
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl py-4 text-base transition-all flex items-center justify-center gap-2 !mt-8 shadow-lg shadow-blue-600/25"
              >
                {loading ? (
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <>
                    Créer mon compte
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1e2436]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-slate-600 bg-[#111520]">Déjà un compte ?</span>
              </div>
            </div>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border border-[#1e2436] text-sm font-semibold text-slate-400 hover:text-white hover:border-slate-600 transition-all"
            >
              Se connecter
            </Link>
          </div>

          <p className="text-center text-xs text-slate-700 mt-8">
            RIMArch © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
