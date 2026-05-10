import { useEffect, useState } from 'react'
import { getUsers, getRoles, updateUserRole, deleteUser, createUser } from '../../api/admin'
import { useAuth } from '../../hooks/useAuth'
import ConfirmModal from '../../components/ConfirmModal'

const roleColors = {
  admin:      'bg-red-100 text-red-700 border-red-200',
  archiviste: 'bg-blue-100 text-blue-700 border-blue-200',
  consultant: 'bg-amber-100 text-amber-700 border-amber-200',
  lecteur:    'bg-slate-100 text-slate-600 border-slate-200',
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function AdminUsers() {
  const { user: me } = useAuth()
  const [users, setUsers]         = useState([])
  const [roles, setRoles]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [confirmUser, setConfirmUser] = useState(null)
  const [deleting, setDeleting]       = useState(null)
  const [updatingRole, setUpdatingRole] = useState(null)

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'lecteur' })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [u, r] = await Promise.all([getUsers(), getRoles()])
      setUsers(u.data)
      setRoles(r.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const handleRoleChange = async (userId, role) => {
    setUpdatingRole(userId)
    try {
      const { data } = await updateUserRole(userId, role)
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, roles: data.roles } : u))
    } finally { setUpdatingRole(null) }
  }

  const handleDelete = async () => {
    setDeleting(confirmUser.id)
    try {
      await deleteUser(confirmUser.id)
      setUsers((prev) => prev.filter((u) => u.id !== confirmUser.id))
      setConfirmUser(null)
    } finally { setDeleting(null) }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      const { data } = await createUser(form)
      setUsers((prev) => [data, ...prev])
      setShowCreate(false)
      setForm({ name: '', email: '', password: '', role: 'lecteur' })
    } catch (err) {
      const errs = err.response?.data?.errors
      setFormError(errs ? Object.values(errs).flat().join(' ') : 'Erreur lors de la création.')
    } finally { setFormLoading(false) }
  }

  return (
    <div className="space-y-8">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Utilisateurs</h1>
          <p className="text-slate-400 text-sm mt-2">{users.length} compte{users.length !== 1 ? 's' : ''} enregistré{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-md shadow-blue-600/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvel utilisateur
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <div className="col-span-4">Utilisateur</div>
              <div className="col-span-3">Rôle</div>
              <div className="col-span-2">Documents</div>
              <div className="col-span-2">Inscrit le</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y divide-slate-50">
              {users.map((user) => {
                const role = user.roles?.[0]
                return (
                  <div key={user.id} className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-slate-50 transition-colors">

                    {/* Avatar + info */}
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                          {user.id === me?.id && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Vous</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Rôle — select */}
                    <div className="col-span-3">
                      {updatingRole === user.id ? (
                        <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <select
                          value={role?.name || ''}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={user.id === me?.id}
                          className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60 ${roleColors[role?.name] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
                        >
                          {roles.map((r) => (
                            <option key={r.name} value={r.name}>{r.label}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Nb documents */}
                    <div className="col-span-2">
                      <span className="text-sm text-slate-600 font-medium">{user.documents_count ?? 0}</span>
                      <span className="text-xs text-slate-400 ml-1">doc{user.documents_count !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 text-sm text-slate-500">{formatDate(user.created_at)}</div>

                    {/* Supprimer */}
                    <div className="col-span-1 flex justify-end">
                      {user.id !== me?.id && (
                        <button
                          onClick={() => setConfirmUser(user)}
                          disabled={deleting === user.id}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-40"
                        >
                          {deleting === user.id ? (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Modale confirmation suppression */}
      {confirmUser && (
        <ConfirmModal
          title="Supprimer l'utilisateur"
          message={`Êtes-vous sûr de vouloir supprimer le compte de "${confirmUser.name}" ? Tous ses tokens seront révoqués.`}
          confirmLabel="Supprimer"
          loading={!!deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmUser(null)}
        />
      )}

      {/* Modal création */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Nouvel utilisateur</h2>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">{formError}</div>
              )}

              {[
                { label: 'Nom complet', key: 'name', type: 'text', placeholder: 'Jean Dupont' },
                { label: 'Adresse email', key: 'email', type: 'email', placeholder: 'jean@rimarch.com' },
                { label: 'Mot de passe', key: 'password', type: 'password', placeholder: '••••••••' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                  <input
                    type={type}
                    required
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Rôle</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                >
                  {roles.map((r) => <option key={r.name} value={r.name}>{r.label}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl py-2.5 text-sm transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={formLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors flex items-center justify-center gap-2">
                  {formLoading ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
