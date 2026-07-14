import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { api } from '../services/api'
import type { User } from '../types'
import { useAuth } from '../contexts/AuthContext'
import './Team.css'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Atendente',
  DELIVERY: 'Entregador',
}

function NewTeamMemberModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('DELIVERY')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await api.post('/team', { name, email, password, phone, role })
      alert('Membro criado com sucesso!')
      onSuccess()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao criar membro.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Novo Membro da Equipe</h3>
          <button className="btn-icon" onClick={onClose} type="button">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form" autoComplete="off">
          <div className="input-group">
            <label className="input-label">Nome Completo</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="input-group">
            <label className="input-label">E-mail (Login)</label>
            <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="input-group">
            <label className="input-label">Telefone (Opcional)</label>
            <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="input-group">
            <label className="input-label">Senha de Acesso</label>
            <input type="password" minLength={6} className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="input-group">
            <label className="input-label">Cargo / Nível de Acesso</label>
            <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="DELIVERY">Entregador (Acesso apenas ao App Delivery)</option>
              <option value="OPERATOR">Atendente (Acesso limitado ao Painel)</option>
              <option value="ADMIN">Administrador (Acesso total)</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Adicionar Membro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditTeamMemberModal({
  member,
  onClose,
  onSuccess,
}: {
  member: User
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(member.name)
  const [email, setEmail] = useState(member.email)
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState(member.phone || '')
  const [role, setRole] = useState(member.role)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await api.put(`/team/${member.id}`, { name, email, password, phone, role })
      alert('Membro atualizado com sucesso!')
      onSuccess()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao atualizar membro.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar Membro da Equipe</h3>
          <button className="btn-icon" onClick={onClose} type="button">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form" autoComplete="off">
          <div className="input-group">
            <label className="input-label">Nome Completo</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="input-group">
            <label className="input-label">E-mail (Login)</label>
            <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="input-group">
            <label className="input-label">Telefone (Opcional)</label>
            <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="input-group">
            <label className="input-label">Nova Senha de Acesso (Deixe em branco para manter a atual)</label>
            <input type="password" minLength={6} className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" autoComplete="new-password" />
          </div>
          <div className="input-group">
            <label className="input-label">Cargo / Nível de Acesso</label>
            <select className="input-field" value={role} onChange={(e) => setRole(e.target.value as User['role'])}>
              <option value="DELIVERY">Entregador (Acesso apenas ao App Delivery)</option>
              <option value="OPERATOR">Atendente (Acesso limitado ao Painel)</option>
              <option value="ADMIN">Administrador (Acesso total)</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Team() {
  const { user: currentUser } = useAuth()
  const [members, setMembers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [memberToEdit, setMemberToEdit] = useState<User | null>(null)

  const loadTeam = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/team')
      const mapped = (res.data.users || []).map((u: any) => ({
        ...u,
        isActive: u.is_active,
        createdAt: u.created_at,
      }))
      setMembers(mapped)
    } catch (err: any) {
      if (err?.response?.status === 403) {
        alert('Você não tem permissão para acessar esta página.')
      } else {
        alert('Erro ao carregar equipe.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTeam()
  }, [loadTeam])

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/team/${id}/toggle-status`)
      setMembers((prev) =>
        prev.map((m) => m.id === id ? { ...m, isActive: !m.isActive } : m)
      )
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao alterar status.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente este membro?')) return
    try {
      await api.delete(`/team/${id}`)
      setMembers((prev) => prev.filter((m) => m.id !== id))
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao excluir membro.')
    }
  }

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="team-page">
        <header className="page-header">
          <div>
            <h1>Acesso Negado</h1>
            <p>Apenas administradores podem gerenciar a equipe.</p>
          </div>
        </header>
      </div>
    )
  }

  return (
    <div className="team-page">
      <header className="page-header">
        <div>
          <h1>Equipe do Sistema</h1>
          <p>Gerencie os administradores, atendentes e entregadores.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Novo Membro</span>
        </button>
      </header>

      <div className="card">
        {isLoading ? (
          <div className="loading-state"><p>Carregando equipe...</p></div>
        ) : (
          <div className="table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Membro</th>
                  <th>Cargo</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="team-info">
                        <div className="team-avatar">{member.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <p style={{ fontWeight: 500 }}>
                            {member.name} {member.id === currentUser?.id ? '(Você)' : ''}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge role-${member.role.toLowerCase()}`}>
                        {ROLE_LABELS[member.role] || member.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{member.phone ?? '—'}</td>
                    <td>
                      <span className={`status-badge ${member.isActive ? 'status-success' : 'status-danger'}`}>
                        {member.isActive ? 'Ativo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {member.id !== currentUser?.id && (
                        <>
                          <button
                            className="btn-icon"
                            onClick={() => setMemberToEdit(member)}
                            title="Editar cadastro"
                            style={{ marginRight: 8, color: 'var(--text-secondary)' }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className={`btn btn-secondary toggle-btn ${member.isActive ? 'toggle-deactivate' : 'toggle-activate'}`}
                            onClick={() => handleToggleStatus(member.id)}
                            title={member.isActive ? 'Bloquear acesso' : 'Desbloquear acesso'}
                            style={{ marginRight: 8 }}
                          >
                            {member.isActive ? 'Bloquear' : 'Ativar'}
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(member.id)}
                            title="Excluir permanentemente"
                            style={{ color: 'var(--accent-danger)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      Nenhum membro encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <NewTeamMemberModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false)
            loadTeam()
          }}
        />
      )}

      {memberToEdit && (
        <EditTeamMemberModal
          member={memberToEdit}
          onClose={() => setMemberToEdit(null)}
          onSuccess={() => {
            setMemberToEdit(null)
            loadTeam()
          }}
        />
      )}
    </div>
  )
}
