import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../hooks/useAuth'
import AuthShell from '../components/AuthShell'
import { Button, Spinner } from '../components/ui'

const STATUS_COPY = {
  verifying: {
    eyebrow: 'Vérification',
    title: 'Vérification en cours',
    text: 'Quelques secondes, nous validons votre lien.',
  },
  success: {
    eyebrow: 'Compte activé',
    title: 'Email vérifié',
    text: 'Votre adresse est confirmée. Redirection automatique vers votre espace…',
  },
  error: {
    eyebrow: 'Échec',
    title: 'Lien invalide',
    text: '',
  },
  waiting: {
    eyebrow: 'Dernière étape',
    title: 'Vérifiez votre email',
    text: 'Un lien de vérification vient de vous être envoyé. Cliquez dessus pour activer votre compte.',
  },
}

function StatusMark({ status }) {
  const tone = {
    verifying: 'border-cobalt/30 bg-cobalt/[0.06] text-cobalt',
    success:   'border-[#bcd8cb] bg-[#f0f7f3] text-[#2f7d63]',
    error:     'border-[#e4b4b4] bg-[#fdf3f2] text-[#a33a35]',
    waiting:   'border-[#e0cba8] bg-[#fbf5ea] text-[#a2711f]',
  }[status]

  const glyph = {
    verifying: <Spinner className="h-5 w-5" />,
    success:   <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" /></svg>,
    error:     <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" /></svg>,
    waiting:   <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  }[status]

  return (
    <div className={`flex h-11 w-11 items-center justify-center rounded-lg border ${tone}`}>
      {glyph}
    </div>
  )
}

export default function VerifyEmail() {
  const { id, hash }   = useParams()
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const { logout, refreshUser } = useAuth()

  const handleBackToLogin = async () => {
    await logout()
    navigate('/login')
  }

  const [status, setStatus]       = useState(() => (id && hash) ? 'verifying' : 'waiting')
  const [message, setMessage]     = useState('')
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  useEffect(() => {
    if (!id || !hash) return

    const expires   = searchParams.get('expires')
    const signature = searchParams.get('signature')

    api.get(`/auth/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`)
      .then(async () => { setStatus('success'); await refreshUser(); setTimeout(() => navigate('/dashboard'), 3000) })
      .catch((err) => { setMessage(err.response?.data?.message || 'Lien invalide ou expiré.'); setStatus('error') })
  }, [id, hash, navigate, searchParams])

  const handleResend = async () => {
    setResending(true); setResendMsg('')
    try {
      await api.post('/auth/email/resend')
      setResendMsg('Email renvoyé ! Vérifiez votre boîte de réception.')
    } catch { setResendMsg("Erreur lors de l'envoi. Réessayez dans un instant.") }
    finally { setResending(false) }
  }

  const copy = STATUS_COPY[status] || STATUS_COPY.waiting

  return (
    <AuthShell>
      <div className="rise">
        <StatusMark status={status} />

        <p className="eyebrow mt-5 text-[#9c9ca8]">{copy.eyebrow}</p>
        <h1 className="font-display mt-2.5 text-[31px] leading-[1.05] text-[#14151c]">{copy.title}</h1>
        <p className="mt-3 text-[13.5px] leading-relaxed text-[#6b6c7a]">
          {status === 'error' ? message : copy.text}
        </p>

        {status === 'success' && (
          <div className="mt-8 border-t border-[#e4e0d7] pt-6">
            <Link
              to="/dashboard"
              className="text-[13px] font-semibold text-cobalt underline decoration-cobalt/30 underline-offset-4 transition hover:decoration-cobalt"
            >
              Accéder à mon espace →
            </Link>
          </div>
        )}

        {(status === 'waiting' || status === 'error') && (
          <>
            <div className="mt-8">
              <Button variant="primary" size="lg" onClick={handleResend} loading={resending} className="w-full">
                {resending ? 'Envoi…' : "Renvoyer l'email"}
              </Button>
            </div>

            {resendMsg && (
              <p className="mt-4 text-[12.5px] font-medium text-[#2f7d63]">{resendMsg}</p>
            )}

            <div className="mt-8 border-t border-[#e4e0d7] pt-6">
              <button
                onClick={handleBackToLogin}
                className="text-[13px] font-semibold text-cobalt underline decoration-cobalt/30 underline-offset-4 transition hover:decoration-cobalt"
              >
                ← Retour à la connexion
              </button>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  )
}
