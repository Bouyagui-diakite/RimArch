import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import api from '../api/axios'

export default function VerifyEmail() {
  const { id, hash }    = useParams()
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()

  const [status, setStatus]   = useState('idle')  // idle | verifying | success | error | waiting
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  useEffect(() => {
    if (!id || !hash) {
      setStatus('waiting')
      return
    }

    setStatus('verifying')
    const expires   = searchParams.get('expires')
    const signature = searchParams.get('signature')

    api.get(`/auth/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`)
      .then(() => {
        setStatus('success')
        setTimeout(() => navigate('/dashboard'), 3000)
      })
      .catch((err) => {
        setMessage(err.response?.data?.message || 'Lien invalide ou expiré.')
        setStatus('error')
      })
  }, [id, hash])

  const handleResend = async () => {
    setResending(true)
    setResendMsg('')
    try {
      await api.post('/auth/email/resend')
      setResendMsg('Email renvoyé ! Vérifiez votre boîte mail.')
    } catch {
      setResendMsg('Erreur lors de l\'envoi. Réessayez.')
    } finally { setResending(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full max-w-md p-8 text-center">

        {/* Icône */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
          status === 'success' ? 'bg-emerald-100' :
          status === 'error'   ? 'bg-red-100' :
          status === 'verifying' ? 'bg-blue-100' : 'bg-amber-100'
        }`}>
          {status === 'verifying' ? (
            <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : status === 'success' ? (
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : status === 'error' ? (
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
        </div>

        {/* Contenu selon état */}
        {status === 'verifying' && (
          <>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Vérification en cours…</h2>
            <p className="text-slate-400 text-sm">Patientez quelques secondes.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Email vérifié !</h2>
            <p className="text-slate-500 text-sm">Votre adresse email a été confirmée. Redirection automatique…</p>
            <Link to="/dashboard" className="inline-block mt-4 text-blue-600 text-sm font-semibold hover:underline">
              Accéder au dashboard →
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Lien invalide</h2>
            <p className="text-slate-500 text-sm mb-6">{message}</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors mx-auto"
            >
              {resending ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Renvoyer l'email
            </button>
            {resendMsg && <p className="text-sm text-slate-500 mt-3">{resendMsg}</p>}
          </>
        )}

        {status === 'waiting' && (
          <>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Vérifiez votre email</h2>
            <p className="text-slate-500 text-sm mb-6">
              Un email de vérification vous a été envoyé. Cliquez sur le lien dans l'email pour activer votre compte.
            </p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors mx-auto"
            >
              {resending ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : null}
              {resending ? 'Envoi…' : 'Renvoyer l\'email'}
            </button>
            {resendMsg && (
              <p className="text-sm text-emerald-600 font-medium mt-3">{resendMsg}</p>
            )}
            <Link to="/login" className="block mt-4 text-slate-400 text-xs hover:text-slate-600">
              ← Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
