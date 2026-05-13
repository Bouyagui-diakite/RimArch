import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { updateProfile, updatePassword } from '../api/profile'

const roleColors = {
  admin:      'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  archiviste: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  consultant: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  lecteur:    'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
}

export default function Profile() {
  const { user } = useAuth()

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
    if (passwords.password !== passwords.password_confirmation) {
      setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' })
      return
    }
    setPwLoading(true)
    setPwMsg({ type: '', text: '' })
    try {
      await updatePassword(passwords)
      setPwMsg({ type: 'success', text: 'Mot de passe mis à jour avec succès.' })
      setPasswords({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      const errs = err.response?.data?.errors
      setPwMsg({ type: 'error', text: errs ? Object.values(errs).flat().join(' ') : 'Erreur lors du changement.' })
    } finally { setPwLoading(false) }
  }

  const Alert = ({ msg }) => {
    if (!msg.text) return null
    const isSuccess = msg.type === 'success'
    return (
      <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${isSuccess ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-red-50 border border-red-100 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'}`}>
        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          {isSuccess
            ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          }
        </svg>
        {msg.text}
      </div>
    )
  }

  const inputCls = "w-full bg-slate-50 dark:bg-[#0d1018] border-2 border-slate-200 dark:border-[#1e2436] rounded-2xl px-5 py-[14px] text-base text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#111520] focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-500/10 transition-all"

  return (
    <div className="max-w-xl mx-auto space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Mon profil</h1>
        <p className="text-slate-400 text-sm mt-2">Gérez vos informations personnelles</p>
      </div>

      {/* Carte identité */}
      <div className="bg-white dark:bg-[#111520] rounded-2xl border border-slate-200 dark:border-[#1e2436] p-7 flex items-center gap-6 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-md shadow-blue-200 dark:shadow-blue-500/10">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800 dark:text-white">{user?.name}</p>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {user?.roles?.map((r) => (
              <span key={r.name} className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColors[r.name] || 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400'}`}>
                {r.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Modifier nom */}
      <div className="bg-white dark:bg-[#111520] rounded-2xl border border-slate-200 dark:border-[#1e2436] shadow-sm overflow-hidden">
        <div className="px-7 py-5 border-b border-slate-100 dark:border-[#1e2436]">
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Informations générales</h2>
        </div>
        <div className="px-7 py-7">
          <form onSubmit={handleProfileSave} className="space-y-7">
            <Alert msg={profileMsg} />
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Nom complet</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Adresse email</label>
              <input type="email" value={user?.email} disabled
                className="w-full bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-[#1e2436] rounded-2xl px-5 py-[14px] text-base text-slate-400 cursor-not-allowed" />
              <p className="text-xs text-slate-400 mt-1.5">L'email ne peut pas être modifié.</p>
            </div>
            <div className="flex justify-end pt-1">
              <button type="submit" disabled={profileLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition-colors">
                {profileLoading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Changer mot de passe */}
      <div className="bg-white dark:bg-[#111520] rounded-2xl border border-slate-200 dark:border-[#1e2436] shadow-sm overflow-hidden">
        <div className="px-7 py-5 border-b border-slate-100 dark:border-[#1e2436]">
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Changer le mot de passe</h2>
        </div>
        <div className="px-7 py-7">
          <form onSubmit={handlePasswordSave} className="space-y-7">
            <Alert msg={pwMsg} />
            {[
              { key: 'current_password', label: 'Mot de passe actuel' },
              { key: 'password',         label: 'Nouveau mot de passe' },
              { key: 'password_confirmation', label: 'Confirmer le nouveau mot de passe' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{label}</label>
                <input type="password" required value={passwords[key]}
                  onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
                  placeholder="••••••••" className={inputCls} />
              </div>
            ))}
            <div className="flex justify-end pt-1">
              <button type="submit" disabled={pwLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition-colors">
                {pwLoading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : 'Mettre à jour'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
