import { useEffect, useState } from 'react'
import { getUsers, getRoles, updateUserRole, deleteUser, createUser } from '../../api/admin'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import ConfirmModal from '../../components/ConfirmModal'
import {
  panelCls, Spinner, PageHeader, Button, IconButton, Modal, Field,
  Notice, Tag, inputCls, formatDate,
} from '../../components/ui'

/* Le rôle porte une couleur d'accent discrète, jamais un aplat criard. */
const roleAccent = {
  admin:      'border-[#c25048]/40 text-[#c25048]',
  archiviste: 'border-cobalt/40 text-accent',
  consultant: 'border-clay/40 text-clay',
  lecteur:    'border-line text-muted',
}

const ICON = {
  plus:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 5v14M5 12h14" />,
  trash: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
}

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">{path}</svg>
)

const CREATE_FIELDS = [
  { label: 'Nom complet',   key: 'name',     type: 'text',     placeholder: 'Jean Dupont',      autoComplete: 'off' },
  { label: 'Adresse email', key: 'email',    type: 'email',    placeholder: 'jean@rimarch.com', autoComplete: 'off' },
  { label: 'Mot de passe',  key: 'password', type: 'password', placeholder: '••••••••',         autoComplete: 'new-password' },
]

export default function AdminUsers() {
  const { user: me } = useAuth()
  const { addToast } = useToast()
  const [users, setUsers]               = useState([])
  const [roles, setRoles]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [showCreate, setShowCreate]     = useState(false)
  const [confirmUser, setConfirmUser]   = useState(null)
  const [deleting, setDeleting]         = useState(null)
  const [updatingRole, setUpdatingRole] = useState(null)

  const [form, setForm]           = useState({ name: '', email: '', password: '', role: 'lecteur' })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [u, r] = await Promise.all([getUsers(), getRoles()])
      setUsers(u.data); setRoles(r.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const handleRoleChange = async (userId, role) => {
    setUpdatingRole(userId)
    try {
      const { data } = await updateUserRole(userId, role)
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, roles: data.roles } : u))
      addToast('Rôle mis à jour.')
    } catch { addToast('Erreur lors de la mise à jour du rôle.', 'error') }
    finally { setUpdatingRole(null) }
  }

  const handleDelete = async () => {
    setDeleting(confirmUser.id)
    try {
      await deleteUser(confirmUser.id)
      setUsers((prev) => prev.filter((u) => u.id !== confirmUser.id))
      setConfirmUser(null)
      addToast('Utilisateur supprimé.')
    } catch { addToast('Erreur lors de la suppression.', 'error') }
    finally { setDeleting(null) }
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
      addToast('Utilisateur créé avec succès.')
    } catch (err) {
      const errs = err.response?.data?.errors
      setFormError(errs ? Object.values(errs).flat().join(' ') : 'Erreur lors de la création.')
    } finally { setFormLoading(false) }
  }

  return (
    <div className="space-y-6">

      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        sub={`${users.length} compte${users.length !== 1 ? 's' : ''} enregistré${users.length !== 1 ? 's' : ''}`}
      >
        <Button variant="primary" onClick={() => setShowCreate(true)} icon={<Icon path={ICON.plus} />}>
          Nouvel utilisateur
        </Button>
      </PageHeader>

      <div className={`${panelCls} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-24 text-faint">
            <Spinner className="h-7 w-7" />
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-12 gap-4 border-b border-line bg-raised px-6 py-3 lg:grid">
              <div className="eyebrow col-span-4 text-faint">Utilisateur</div>
              <div className="eyebrow col-span-3 text-faint">Rôle</div>
              <div className="eyebrow col-span-2 text-faint">Documents</div>
              <div className="eyebrow col-span-2 text-faint">Inscrit le</div>
              <div className="eyebrow col-span-1 text-right text-faint">Actions</div>
            </div>

            <div className="divide-y divide-line">
              {users.map((user) => {
                const role = user.roles?.[0]
                const isMe = user.id === me?.id
                return (
                  <div key={user.id} className="transition-colors hover:bg-raised">

                    {/* Mobile */}
                    <div className="flex items-center gap-3 px-4 py-4 lg:hidden">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink">
                        <span className="text-[15px] font-semibold leading-none text-canvas">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[13.5px] font-semibold text-ink">{user.name}</p>
                          {isMe && <Tag className="border-cobalt/40 text-accent">Vous</Tag>}
                        </div>
                        <p className="truncate text-[11.5px] text-faint">{user.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          {role && <Tag className={roleAccent[role.name] || ''}>{role.label || role.name}</Tag>}
                          <span className="text-[11.5px] text-faint">
                            {user.documents_count ?? 0} doc{user.documents_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      {!isMe && (
                        <IconButton label="Supprimer" danger onClick={() => setConfirmUser(user)} loading={deleting === user.id}>
                          <Icon path={ICON.trash} />
                        </IconButton>
                      )}
                    </div>

                    {/* Desktop */}
                    <div className="hidden grid-cols-12 items-center gap-4 px-6 py-3.5 lg:grid">
                      <div className="col-span-4 flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink">
                          <span className="text-[14px] font-semibold leading-none text-canvas">
                            {user.name?.charAt(0).toUpperCase()}
                          </span>
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[13.5px] font-medium text-ink">{user.name}</p>
                            {isMe && <Tag className="border-cobalt/40 text-accent">Vous</Tag>}
                          </div>
                          <p className="truncate text-[11.5px] text-faint">{user.email}</p>
                        </div>
                      </div>

                      <div className="col-span-3">
                        {updatingRole === user.id ? (
                          <Spinner className="h-4 w-4 text-accent" />
                        ) : (
                          <select
                            value={role?.name || ''}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={isMe}
                            aria-label={`Rôle de ${user.name}`}
                            className={`cursor-pointer rounded-full border bg-transparent py-1.5 pl-3.5 pr-2 text-[11.5px] font-medium transition-all focus:outline-none focus:shadow-[0_0_0_3px_var(--rim-accent-soft)] disabled:cursor-not-allowed disabled:opacity-60 ${roleAccent[role?.name] || 'border-line text-muted'}`}
                          >
                            {roles.map((r) => <option key={r.name} value={r.name} className="bg-surface text-ink">{r.label}</option>)}
                          </select>
                        )}
                      </div>

                      <div className="col-span-2">
                        <span className="font-display text-[16px] text-ink tabular-nums">{user.documents_count ?? 0}</span>
                        <span className="ml-1.5 text-[11.5px] text-faint">doc{user.documents_count !== 1 ? 's' : ''}</span>
                      </div>

                      <div className="col-span-2 text-[12.5px] text-muted">{formatDate(user.created_at)}</div>

                      <div className="col-span-1 flex justify-end">
                        {!isMe && (
                          <IconButton label="Supprimer" danger onClick={() => setConfirmUser(user)} loading={deleting === user.id}>
                            <Icon path={ICON.trash} />
                          </IconButton>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {confirmUser && (
        <ConfirmModal title="Supprimer l'utilisateur"
          message={`Supprimer le compte de « ${confirmUser.name} » ? Toutes ses sessions seront révoquées.`}
          confirmLabel="Supprimer" loading={!!deleting}
          onConfirm={handleDelete} onCancel={() => setConfirmUser(null)} />
      )}

      {showCreate && (
        <Modal
          eyebrow="Administration"
          title="Nouvel utilisateur"
          sub="Créez un compte et attribuez-lui un rôle."
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <Button onClick={() => setShowCreate(false)} disabled={formLoading}>Annuler</Button>
              <Button type="submit" form="create-user-form" variant="primary" loading={formLoading}>Créer le compte</Button>
            </>
          }
        >
          <form id="create-user-form" onSubmit={handleCreate} autoComplete="off" className="space-y-5">
            {formError && <Notice>{formError}</Notice>}

            {CREATE_FIELDS.map(({ label, key, type, placeholder, autoComplete }) => (
              <Field key={key} label={label}>
                <input
                  type={type} required autoComplete={autoComplete} value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder} className={inputCls}
                />
              </Field>
            ))}

            <Field label="Rôle" hint="Le rôle détermine les droits de lecture, dépôt et administration.">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}>
                {roles.map((r) => <option key={r.name} value={r.name}>{r.label}</option>)}
              </select>
            </Field>
          </form>
        </Modal>
      )}
    </div>
  )
}
