import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { updateProfile, updatePassword } from '../api/profile'
import PasswordStrength from '../components/PasswordStrength'
import { panelCls, PageHeader, SectionHead, Button, Field, inputCls, formatDateTime } from '../components/ui'

const PASSWORD_REQUIREMENTS = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.'

function isStrongPassword(p) {
  return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)
}

function Alert({ msg }) {
  if (!msg.text) return null
  const ok = msg.type === 'success'
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[13px] ${
      ok ? 'border-moss/30 bg-moss/[0.07] text-moss' : 'border-[#c25048]/30 bg-[#c25048]/[0.07] text-[#c25048]'
    }`}>
      <svg className="mt-px h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {ok
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        }
      </svg>
      {msg.text}
    </div>
  )
}

export default function Profile() {
  const { user, refreshUser } = useAuth()

  const [name, setName]             = useState(user?.name || '')
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' })
  const [profileLoading, setProfileLoading] = useState(false)

  const [passwords, setPasswords] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [pwMsg, setPwMsg]         = useState({ type: '', text: '' })
  const [pwLoading, setPwLoading] = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileMsg({ type: '', text: '' })
    try {
      await updateProfile({ name })
      setProfileMsg({ type: 'success', text: 'Profil mis à jour avec succès.' })
    } catch (err) {
      const errs = err.response?.data?.errors
      setProfileMsg({ type: 'error', text: errs ? Object.values(errs).flat().join(' ') : 'Erreur lors de la mise à jour.' })
    } finally { setProfileLoading(false) }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (!isStrongPassword(passwords.password)) { setPwMsg({ type: 'error', text: PASSWORD_REQUIREMENTS }); return }
    if (passwords.password !== passwords.password_confirmation) { setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' }); return }
    setPwLoading(true)
    setPwMsg({ type: '', text: '' })
    try {
      await updatePassword(passwords)
      await refreshUser()
      setPwMsg({ type: 'success', text: 'Mot de passe mis à jour avec succès.' })
      setPasswords({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      const errs = err.response?.data?.errors
      setPwMsg({ type: 'error', text: errs ? Object.values(errs).flat().join(' ') : 'Erreur lors du changement.' })
    } finally { setPwLoading(false) }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      <PageHeader eyebrow="Compte" title="Mon profil" sub="Vos informations personnelles et vos accès" />

      {/* ── Carte d'identité ── */}
      <div className={`${panelCls} overflow-hidden`}>
        <div className="relative overflow-hidden bg-[#0b0d16] px-7 py-7 grain">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-cobalt/25 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-5">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/[0.08] ring-1 ring-white/15">
                <span className="font-display text-[19px] leading-none text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#0b0d16] bg-moss" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-[22px] leading-none text-white">{user?.name}</p>
              <p className="mt-2 truncate text-[12.5px] text-white/45">{user?.email}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {user?.roles?.map((r) => (
                  <span key={r.name} className="rounded-full border border-white/20 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.1em] text-white/70">
                    {r.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="ml-auto hidden shrink-0 text-right sm:block">
              <p className="font-display text-[25px] leading-none text-white tabular-nums">{user?.documents_count ?? 0}</p>
              <p className="eyebrow mt-2 text-white/40">Documents déposés</p>
            </div>
          </div>
        </div>

        {user?.last_login && (
          <div className="flex items-center justify-between gap-4 px-7 py-3.5">
            <span className="text-[12.5px] text-muted">Dernière connexion</span>
            <span className="text-[12.5px] font-medium text-ink">{formatDateTime(user.last_login)}</span>
          </div>
        )}
      </div>

      {/* ── Informations générales ── */}
      <div className={`${panelCls} overflow-hidden`}>
        <SectionHead title="Informations générales" sub="Nom affiché et adresse de connexion" />
        <form onSubmit={handleProfileSave} className="space-y-5 px-7 py-6">
          <Alert msg={profileMsg} />

          <Field label="Nom complet">
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>

          <Field label="Adresse email" hint="L’email sert d’identifiant de connexion : il ne peut pas être modifié ici.">
            <input
              type="email" value={user?.email || ''} disabled
              className={`${inputCls} cursor-not-allowed bg-raised text-faint`}
            />
          </Field>

          <div className="flex justify-end border-t border-line pt-5">
            <Button type="submit" variant="primary" loading={profileLoading}>Enregistrer</Button>
          </div>
        </form>
      </div>

      {/* ── Sécurité ── */}
      <div className={`${panelCls} overflow-hidden`}>
        <SectionHead title="Sécurité" sub="Modifier votre mot de passe" />
        <form onSubmit={handlePasswordSave} className="space-y-5 px-7 py-6">
          <Alert msg={pwMsg} />

          <Field label="Mot de passe actuel">
            <input type="password" required value={passwords.current_password}
              onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
              placeholder="••••••••" className={inputCls} />
          </Field>

          <Field label="Nouveau mot de passe">
            <input type="password" required value={passwords.password}
              onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
              placeholder="••••••••" className={inputCls} />
            <PasswordStrength password={passwords.password} />
          </Field>

          <Field label="Confirmer le nouveau mot de passe">
            <input type="password" required value={passwords.password_confirmation}
              onChange={(e) => setPasswords({ ...passwords, password_confirmation: e.target.value })}
              placeholder="••••••••" className={inputCls} />
          </Field>

          <div className="flex justify-end border-t border-line pt-5">
            <Button type="submit" variant="primary" loading={pwLoading}>Mettre à jour</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
