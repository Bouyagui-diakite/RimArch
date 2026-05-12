import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../hooks/useAuth'

const Spinner = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

export default function VerifyEmail() {
  const { id, hash }   = useParams()
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const { logout }     = useAuth()

  const handleBackToLogin = async () => {
    await logout()
    navigate('/login')
  }

  const [status, setStatus]     = useState('idle')
  const [message, setMessage]   = useState('')
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  useEffect(() => {
    if (!id || !hash) { setStatus('waiting'); return }

    setStatus('verifying')
    const expires   = searchParams.get('expires')
    const signature = searchParams.get('signature')

    api.get(`/auth/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`)
      .then(() => { setStatus('success'); setTimeout(() => navigate('/dashboard'), 3000) })
      .catch((err) => { setMessage(err.response?.data?.message || 'Lien invalide ou expiré.'); setStatus('error') })
  }, [id, hash])

  const handleResend = async () => {
    setResending(true); setResendMsg('')
    try {
      await api.post('/auth/email/resend')
      setResendMsg('Email renvoyé ! Vérifiez votre boîte mail.')
    } catch { setResendMsg("Erreur lors de l'envoi. Réessayez.") }
    finally { setResending(false) }
  }

  const iconConfig = {
    verifying: { bg: 'bg-blue-500/10',   icon: <Spinner /> },
    success:   { bg: 'bg-emerald-500/10', icon: <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> },
    error:     { bg: 'bg-red-500/10',    icon: <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> },
    waiting:   { bg: 'bg-amber-500/10',  icon: <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
  }

  const { bg, icon } = iconConfig[status] || iconConfig.waiting

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6">

      {/* Logo */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <span className="text-white font-bold text-base">RIMArch</span>
      </div>

      <div className="w-full max-w-sm text-center">

        {/* Icône */}
        <div className={`w-16 h-16 ${bg} border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6`}>
          {icon}
        </div>

        {/* Vérification */}
        {status === 'verifying' && (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Vérification en cours…</h2>
            <p className="text-slate-400 text-sm">Patientez quelques secondes.</p>
          </>
        )}

        {/* Succès */}
        {status === 'success' && (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Email vérifié !</h2>
            <p className="text-slate-400 text-sm mb-5">Votre adresse email a été confirmée. Redirection automatique…</p>
            <Link to="/dashboard" className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors">
              Accéder au dashboard →
            </Link>
          </>
        )}

        {/* Erreur */}
        {status === 'error' && (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Lien invalide</h2>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            <button onClick={handleResend} disabled={resending}
              className="flex items-center gap-2 bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors mx-auto">
              {resending && <Spinner />}
              Renvoyer l'email
            </button>
            {resendMsg && <p className="text-sm text-slate-400 mt-4">{resendMsg}</p>}
          </>
        )}

        {/* En attente */}
        {status === 'waiting' && (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Vérifiez votre email</h2>
            <p className="text-slate-400 text-sm mb-6">
              Un lien de vérification vous a été envoyé. Cliquez dessus pour activer votre compte.
            </p>
            <button onClick={handleResend} disabled={resending}
              className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors mx-auto">
              {resending && <Spinner />}
              {resending ? 'Envoi…' : "Renvoyer l'email"}
            </button>
            {resendMsg && <p className="text-sm text-emerald-400 font-medium mt-4">{resendMsg}</p>}
            <button onClick={handleBackToLogin} className="block mx-auto mt-5 text-slate-600 text-xs hover:text-slate-400 transition-colors">
              ← Retour à la connexion
            </button>
          </>
        )}

        <p className="text-slate-700 text-xs mt-10">RIMArch © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
