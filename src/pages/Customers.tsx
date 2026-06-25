import { useEffect, useState, useCallback } from 'react'
import { Search, Users, Clock, Star, Edit2 } from 'lucide-react'
import { api } from '../services/api'
import type { User } from '../types'
import './Customers.css'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR')
}


function RecurrencyBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="badge badge-neutral">Novo</span>
  if (days <= 7) return <span className="badge badge-success">Ativo (&lt;7d)</span>
  if (days <= 30) return <span className="badge badge-warning">Regular (≤30d)</span>
  if (days <= 90) return <span className="badge badge-warning-dark">Em risco (≤90d)</span>
  return <span className="badge badge-danger">Inativo (&gt;90d)</span>
}

function CustomerModal({
  customer,
  onClose,
  onSuccess,
}: {
  customer: User
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(customer.name)
  const [email, setEmail] = useState(customer.email)
  const [phone, setPhone] = useState(customer.phone || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await api.put(`/users/${customer.id}`, { name, email, phone })
      onSuccess()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao salvar cliente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar Cliente</h3>
          <button className="btn-icon" onClick={onClose} type="button">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-group">
            <label className="input-label">Nome</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">E-mail</label>
            <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Telefone</label>
            <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface CustomerWithStats extends User {
  totalOrders?: number
  lastOrderAt?: string
  daysSinceLastOrder?: number | null
  loyaltyAccount?: {
    balance_points: number
    balance_cashback: number
    last_activity_at: string
    tier: {
      name: string
      color_hex: string | null
    }
  } | null
}

export function Customers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [customerModal, setCustomerModal] = useState<{ open: boolean; item: User | null }>({ open: false, item: null })

  const loadCustomers = useCallback(async () => {
    setIsLoading(true)
    try {
      // Busca usuários (role CUSTOMER)
      const res = await api.get('/users?limit=200')
      const allUsers: User[] = res.data.users ?? res.data.data ?? []
      const customerList = allUsers.filter((u) => u.role === 'CUSTOMER')
      
      // Tenta enriquecer com dados de pedidos (pode não ter acesso individual,
      // mas o backend permite filtrar por customerId)
      const enriched: CustomerWithStats[] = customerList.map((u: any) => {
        let days = null
        if (u.loyaltyAccount && u.loyaltyAccount.last_activity_at) {
          const lastActivity = new Date(u.loyaltyAccount.last_activity_at)
          const diffTime = Math.abs(new Date().getTime() - lastActivity.getTime())
          days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }
        
        return {
          ...u,
          createdAt: u.created_at ?? u.createdAt,
          isActive: u.is_active !== undefined ? u.is_active : (u.isActive ?? true),
          daysSinceLastOrder: days,
        }
      })
      
      setCustomers(enriched)
    } catch {
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadCustomers() }, [loadCustomers])

  const handleToggleStatus = async (userId: string) => {
    try {
      await api.patch(`/users/${userId}/toggle-status`)
      setCustomers((prev) =>
        prev.map((c) => c.id === userId ? { ...c, isActive: !c.isActive } : c)
      )
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao alterar status.')
    }
  }

  const filtered = customers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (statusFilter === 'active') return c.isActive
    if (statusFilter === 'inactive') return !c.isActive
    return true
  })

  const totalActive = customers.filter((c) => c.isActive).length

  return (
    <div className="customers-page">
      <header className="page-header">
        <div>
          <h1>Clientes</h1>
          <p>Visualize e gerencie a base de clientes.</p>
        </div>
      </header>

      {/* KPI rápidos */}
      <div className="customers-kpis">
        <div className="mini-kpi card">
          <Users size={18} color="var(--accent-primary)" />
          <div>
            <p className="mini-kpi-label">Total de Clientes</p>
            <p className="mini-kpi-value">{customers.length}</p>
          </div>
        </div>
        <div className="mini-kpi card">
          <Star size={18} color="#10B981" />
          <div>
            <p className="mini-kpi-label">Clientes Ativos</p>
            <p className="mini-kpi-value">{totalActive}</p>
          </div>
        </div>
        <div className="mini-kpi card">
          <Clock size={18} color="#F59E0B" />
          <div>
            <p className="mini-kpi-label">Inativos (+90d)</p>
            <p className="mini-kpi-value">
              {customers.filter((c) => c.daysSinceLastOrder != null && c.daysSinceLastOrder > 90).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="customers-filters">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              className={`filter-chip ${statusFilter === f ? 'active' : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Inativos'}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="loading-state"><p>Carregando clientes...</p></div>
        ) : (
          <div className="table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Telefone</th>
                  <th>Membro desde</th>
                  <th>Recorrência</th>
                  <th>Fidelidade</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="customer-info">
                        <div className="customer-avatar">{customer.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <p style={{ fontWeight: 500 }}>{customer.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{customer.phone ?? '—'}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {formatDate(customer.createdAt)}
                    </td>
                    <td>
                      <RecurrencyBadge days={customer.daysSinceLastOrder ?? null} />
                    </td>
                    <td>
                      {customer.loyaltyAccount ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span 
                            className="badge" 
                            style={{ 
                              backgroundColor: customer.loyaltyAccount.tier.color_hex ? `${customer.loyaltyAccount.tier.color_hex}20` : 'var(--bg-secondary)',
                              color: customer.loyaltyAccount.tier.color_hex ?? 'var(--text-primary)',
                              width: 'fit-content'
                            }}
                          >
                            {customer.loyaltyAccount.tier.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {customer.loyaltyAccount.balance_points} pts
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${customer.isActive ? 'status-success' : 'status-danger'}`}>
                        {customer.isActive ? 'Ativo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-icon"
                        onClick={() => setCustomerModal({ open: true, item: customer })}
                        title="Editar cliente"
                        style={{ marginRight: 8 }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className={`btn btn-secondary toggle-btn ${customer.isActive ? 'toggle-deactivate' : 'toggle-activate'}`}
                        onClick={() => handleToggleStatus(customer.id)}
                        title={customer.isActive ? 'Bloquear cliente' : 'Desbloquear cliente'}
                      >
                        {customer.isActive ? 'Bloquear' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {customerModal.open && customerModal.item && (
        <CustomerModal
          customer={customerModal.item}
          onClose={() => setCustomerModal({ open: false, item: null })}
          onSuccess={() => {
            setCustomerModal({ open: false, item: null })
            loadCustomers()
          }}
        />
      )}
    </div>
  )
}
