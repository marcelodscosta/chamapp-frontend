import { useEffect, useState, useCallback } from 'react'
import { Eye, Clock } from 'lucide-react'
import { api } from '../services/api'
import type { Order, OrderStatus } from '../types'
import './Orders.css'

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em Separação',
  OUT_FOR_DELIVERY: 'Em Rota',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'status-warning',
  CONFIRMED: 'status-info',
  PREPARING: 'status-purple',
  OUT_FOR_DELIVERY: 'status-cyan',
  DELIVERED: 'status-success',
  CANCELLED: 'status-danger',
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  CREDIT_CARD: 'Crédito',
  DEBIT_CARD: 'Débito',
}

const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [newOrderAlert, setNewOrderAlert] = useState<{ show: boolean, orderId?: string }>({ show: false })
  
  // O alerta sonoro foi movido para o DashboardLayout (Global)

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Record<string, string> = { limit: '100' }
      if (filterStatus) params.status = filterStatus
      const res = await api.get('/orders', { params })
      const data = res.data.orders ?? res.data.data ?? []
      
      const mappedOrders = data.map((o: any) => ({
        ...o,
        total: o.total_value !== undefined ? Number(o.total_value) : o.total,
        paymentMethod: o.payment_method ?? o.paymentMethod,
        createdAt: o.created_at ?? o.createdAt,
        deliveryFee: o.delivery_fee !== undefined ? Number(o.delivery_fee) : o.deliveryFee,
        subtotal: o.subtotal !== undefined ? Number(o.subtotal) : o.subtotal,
      }))

      setOrders(mappedOrders)
    } catch {
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { loadOrders() }, [loadOrders])

  useEffect(() => {
    import('../lib/socket').then(({ socket }) => {
      const handleNewOrder = (order: Order) => {
        setNewOrderAlert({ show: true, orderId: order.id })
        
        // Se for um pedido simulado, inserimos ele diretamente na tabela, senão recarregamos do DB
        if (order.id.startsWith('sim-')) {
          setOrders((prev) => [order, ...prev])
        } else {
          loadOrders()
        }
      }
      
      socket.on('order:created', handleNewOrder)
      socket.on('order:status_updated', handleNewOrder)
      return () => {
        socket.off('order:created', handleNewOrder)
        socket.off('order:status_updated', handleNewOrder)
      }
    })
  }, [loadOrders])

  // Verificação local removida pois o DashboardLayout já cuida disso.

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId)
    try {
      if (!orderId.startsWith('sim-')) {
        await api.patch(`/orders/${orderId}/status`, { status: newStatus })
      }
      
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
      )
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao atualizar status.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="orders-page">
      <header className="page-header">
        <div>
          <h1>Pedidos</h1>
          <p>Gerencie e acompanhe os pedidos em tempo real.</p>
        </div>
      </header>

      {/* Filtros por status */}
      <div className="status-filter-bar">
        {(['', 'PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const).map((s) => (
          <button
            key={s}
            className={`filter-chip ${filterStatus === s ? 'active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s === '' ? 'Todos' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {newOrderAlert.show && (
        <div className="new-order-toast" style={{
          backgroundColor: 'var(--accent-primary)',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <span>🔔 <strong>Novo pedido recebido!</strong> (#{newOrderAlert.orderId?.slice(-6).toUpperCase()})</span>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              onClick={() => {
                setNewOrderAlert({ show: false })
                if (newOrderAlert.orderId) {
                  const order = orders.find(o => o.id === newOrderAlert.orderId)
                  if (order) setSelectedOrder(order)
                }
              }}
              className="btn"
              style={{ backgroundColor: 'white', color: 'var(--accent-primary)', fontWeight: 'bold' }}
            >
              Ver Pedido
            </button>
            <button onClick={() => setNewOrderAlert({ show: false })} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          </div>
        </div>
      )}

      <div className="orders-body">
        {/* Tabela de pedidos */}
        <div className="card orders-table-card">
          {isLoading ? (
            <div className="loading-state"><p>Carregando pedidos...</p></div>
          ) : orders.length === 0 ? (
            <div className="empty-state"><p>Nenhum pedido encontrado.</p></div>
          ) : (
            <div className="table-container">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Pagamento</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className={selectedOrder?.id === order.id ? 'selected-row' : ''}>
                      <td className="order-id">#{order.id.slice(-6).toUpperCase()}</td>
                      <td>
                        <div className="order-customer">
                          <strong>{order.customer?.name}</strong>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {order.address
                              ? `${order.address.street}, ${order.address.number}`
                              : 'Endereço não informado'}
                          </div>
                          {(order as any).is_scheduled && (
                            <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              <Clock size={12} />
                              Agendado para: {new Date((order as any).scheduled_date!).toLocaleDateString('pt-BR')} ({(order as any).scheduled_time_slot})
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{formatCurrency(order.total)}</td>
                      <td>{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</td>
                      <td>
                        <span className={`status-badge ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="date-cell">{formatDate(order.createdAt)}</td>
                      <td>
                        <button
                          className="btn-icon"
                          onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                          title="Ver detalhes"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Painel lateral de detalhe */}
        {selectedOrder && (
          <div className="order-detail-panel card">
            <div className="detail-header">
              <h3>Pedido #{selectedOrder.id.slice(-6).toUpperCase()}</h3>
              <button className="btn-icon" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="detail-section">
              <p className="detail-label">Cliente</p>
              <p className="detail-value">{selectedOrder.customer?.name}</p>
              {selectedOrder.customer?.phone && <p className="detail-sub">{selectedOrder.customer.phone}</p>}
            </div>

            <div className="detail-section">
              <p className="detail-label">Endereço de entrega</p>
              <p className="detail-value">
                {selectedOrder.address?.street}, {selectedOrder.address?.number}
                {selectedOrder.address?.complement && ` – ${selectedOrder.address.complement}`}
              </p>
              <p className="detail-sub">{selectedOrder.address?.neighborhood} – {selectedOrder.address?.city}</p>
            </div>

            <div className="detail-section">
              <p className="detail-label">Itens</p>
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="detail-item">
                  <span>{item.quantity}x {item.name || 'Produto indisponível'}</span>
                  <span>{formatCurrency(Number(item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="detail-section">
              <div className="detail-totals">
                <div className="total-row"><span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                <div className="total-row"><span>Taxa de entrega</span><span>{formatCurrency(selectedOrder.deliveryFee)}</span></div>
                <div className="total-row total-final"><span>Total</span><span>{formatCurrency(selectedOrder.total)}</span></div>
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="detail-section">
                <p className="detail-label">Observações</p>
                <p className="detail-value">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Mudança de status */}
            {STATUS_FLOW[selectedOrder.status].length > 0 && (
              <div className="detail-section">
                <p className="detail-label">Avançar status para:</p>
                <div className="status-actions">
                  {STATUS_FLOW[selectedOrder.status].map((nextStatus) => (
                    <button
                      key={nextStatus}
                      className={`btn status-action-btn ${nextStatus === 'CANCELLED' ? 'btn-danger' : 'btn-primary'}`}
                      disabled={updatingId === selectedOrder.id}
                      onClick={() => handleStatusChange(selectedOrder.id, nextStatus)}
                    >
                      {STATUS_LABELS[nextStatus]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
