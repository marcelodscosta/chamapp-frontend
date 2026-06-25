import { useEffect, useState } from 'react'
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import { api } from '../services/api'
import type { DashboardMetrics } from '../types'
import './Dashboard.css'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Title, Tooltip, Filler, Legend
)

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendentes',
  CONFIRMED: 'Confirmados',
  PREPARING: 'Preparando',
  OUT_FOR_DELIVERY: 'Em Rota',
  DELIVERED: 'Entregues',
  CANCELLED: 'Cancelados',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#3B82F6',
  PREPARING: '#8B5CF6',
  OUT_FOR_DELIVERY: '#06B6D4',
  DELIVERED: '#10B981',
  CANCELLED: '#EF4444',
}

const PAYMENT_COLORS: Record<string, string> = {
  PIX: '#00BDB3',
  DINHEIRO: '#10B981',
  CARTAO_CREDITO: '#8B5CF6',
  CARTAO_DEBITO: '#3B82F6',
  VALE_REFEICAO: '#F59E0B'
}

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'Pix',
  DINHEIRO: 'Dinheiro',
  CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO: 'Cartão de Débito',
  VALE_REFEICAO: 'Vale Refeição'
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="kpi-card card">
      <div className="kpi-icon" style={{ backgroundColor: color + '1A' }}>
        <Icon size={22} color={color} />
      </div>
      <div className="kpi-data">
        <span className="kpi-label">{label}</span>
        <span className="kpi-value">{value}</span>
      </div>
    </div>
  )
}

export function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [period, setPeriod] = useState(7)
  const [isLoading, setIsLoading] = useState(true)
  const [storeOpen, setStoreOpen] = useState(true)

  useEffect(() => {
    api.get('/settings')
      .then(res => setStoreOpen(res.data.settings.store_open))
      .catch(console.error)
  }, [])

  const toggleStore = async () => {
    const newState = !storeOpen
    setStoreOpen(newState)
    try {
      await api.put('/settings', { store_open: newState })
    } catch {
      setStoreOpen(!newState)
      alert('Erro ao alterar status da loja')
    }
  }

  const loadMetrics = () => {
    setIsLoading(true)
    api.get(`/dashboard/metrics?days=${period}`)
      .then((res) => setMetrics(res.data.metrics))
      .catch(() => {/* usar mock em caso de erro de conexão */})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadMetrics()
  }, [period])

  useEffect(() => {
    import('../lib/socket').then(({ socket }) => {
      const handleUpdate = () => {
        api.get(`/dashboard/metrics?days=${period}`).then((res) => setMetrics(res.data.metrics)).catch(() => {})
      }
      
      socket.on('order:created', handleUpdate)
      socket.on('order:status_updated', handleUpdate)
      
      return () => {
        socket.off('order:created', handleUpdate)
        socket.off('order:status_updated', handleUpdate)
      }
    })
  }, [period])

  // ordersByStatus vem como Record<string, number> ex: { PENDING: 3, DELIVERED: 10 }
  const ordersByStatusEntries = metrics?.ordersByStatus
    ? Object.entries(metrics.ordersByStatus as Record<string, number>)
    : []

  const lineData = {
    labels: metrics?.revenueByDay?.map((d) => {
      const date = new Date(d.date)
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }) ?? [],
    datasets: [{
      fill: true,
      label: 'Faturamento',
      data: metrics?.revenueByDay?.map((d) => d.revenue) ?? [],
      borderColor: '#0066FF',
      backgroundColor: 'rgba(0, 102, 255, 0.08)',
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#0066FF',
    }],
  }

  const doughnutData = {
    labels: ordersByStatusEntries.map(([status]) => STATUS_LABELS[status] ?? status),
    datasets: [{
      data: ordersByStatusEntries.map(([, count]) => count),
      backgroundColor: ordersByStatusEntries.map(([status]) => STATUS_COLORS[status] ?? '#94A3B8'),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        grid: { color: '#F3F4F6' },
        ticks: { callback: (v: any) => `R$ ${v}` },
      },
      x: { grid: { display: false } },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { padding: 16, boxWidth: 12 } } },
    cutout: '65%',
  }

  const paymentData = {
    labels: metrics?.salesByPaymentMethod?.map((p) => PAYMENT_LABELS[p.method] ?? p.method) ?? [],
    datasets: [{
      data: metrics?.salesByPaymentMethod?.map((p) => p.total) ?? [],
      backgroundColor: metrics?.salesByPaymentMethod?.map((p) => PAYMENT_COLORS[p.method] ?? '#94A3B8') ?? [],
      borderWidth: 2,
      borderColor: '#fff',
    }],
  }

  // Pegar os 5 produtos mais vendidos por receita
  const topProducts = metrics?.productSales?.slice(0, 5) ?? []

  const productBarData = {
    labels: topProducts.map((p) => p.name),
    datasets: [{
      label: 'Receita Gerada (R$)',
      data: topProducts.map((p) => p.totalRevenue),
      backgroundColor: '#8B5CF6',
      borderRadius: 4,
    }],
  }

  const barOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#F3F4F6' }, ticks: { callback: (v: any) => `R$ ${v}` } },
      y: { grid: { display: false } },
    },
  }

  return (
    <div className="dashboard-container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h1 style={{ margin: 0 }}>Dashboard</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: storeOpen ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                {storeOpen ? '🟢 Aberta' : '🔴 Fechada'}
              </span>
              <button 
                onClick={toggleStore}
                className="btn"
                style={{ padding: '2px 8px', fontSize: '0.75rem', backgroundColor: storeOpen ? '#FEE2E2' : '#E0E7FF', color: storeOpen ? 'var(--accent-danger)' : 'var(--accent-primary)', border: 'none', borderRadius: '4px' }}
              >
                {storeOpen ? 'Fechar' : 'Abrir'}
              </button>
            </div>
          </div>
          <p>Visão geral dos últimos {period} dias.</p>
        </div>
        <div className="period-selector">
          {[7, 15, 30].map((d) => (
            <button
              key={d}
              className={`period-btn ${period === d ? 'active' : ''}`}
              onClick={() => setPeriod(d)}
            >
              {d} dias
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="loading-state"><p>Carregando métricas...</p></div>
      ) : (
        <>
          {/* Active Orders Banner */}
          {((metrics?.ordersByStatus?.PENDING ?? 0) + (metrics?.ordersByStatus?.CONFIRMED ?? 0) + (metrics?.ordersByStatus?.PREPARING ?? 0) + (metrics?.ordersByStatus?.OUT_FOR_DELIVERY ?? 0)) > 0 && (
            <div style={{
              backgroundColor: (metrics?.ordersByStatus?.PENDING ?? 0) > 0 ? '#FEF3C7' : '#E0F2FE',
              borderLeft: `4px solid ${(metrics?.ordersByStatus?.PENDING ?? 0) > 0 ? '#F59E0B' : '#3B82F6'}`,
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, color: (metrics?.ordersByStatus?.PENDING ?? 0) > 0 ? '#92400E' : '#075985', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={20} />
                  {(metrics?.ordersByStatus?.PENDING ?? 0) > 0 
                    ? `${metrics?.ordersByStatus?.PENDING ?? 0} pedido(s) aguardando aprovação!` 
                    : `${(metrics?.ordersByStatus?.CONFIRMED ?? 0) + (metrics?.ordersByStatus?.PREPARING ?? 0) + (metrics?.ordersByStatus?.OUT_FOR_DELIVERY ?? 0)} pedido(s) em andamento`}
                </h3>
                <p style={{ margin: '4px 0 0 0', color: (metrics?.ordersByStatus?.PENDING ?? 0) > 0 ? '#B45309' : '#0369A1', fontSize: '0.875rem' }}>
                  {(metrics?.ordersByStatus?.PENDING ?? 0) > 0 
                    ? 'Acesse a aba de Pedidos para confirmar os pedidos rapidamente.'
                    : 'Você tem pedidos ativos (Confirmados, Preparando ou Em Rota).'}
                </p>
              </div>
              <button 
                onClick={() => window.location.href = '/orders'}
                className="btn btn-primary"
                style={{ backgroundColor: (metrics?.ordersByStatus?.PENDING ?? 0) > 0 ? '#F59E0B' : '#3B82F6', border: 'none' }}
              >
                Ver Pedidos
              </button>
            </div>
          )}

          <div className="kpi-grid">
            <KpiCard label="Faturamento" value={formatCurrency(metrics?.totalRevenue ?? 0)} icon={DollarSign} color="#0066FF" />
            <KpiCard label="Total de Pedidos" value={String(metrics?.totalOrders ?? 0)} icon={ShoppingBag} color="#10B981" />
            <KpiCard label="Novos Clientes" value={String(metrics?.newCustomers ?? 0)} icon={Users} color="#F59E0B" />
            <KpiCard label="Ticket Médio" value={formatCurrency(metrics?.averageTicket ?? 0)} icon={TrendingUp} color="#8B5CF6" />
          </div>

          <div className="charts-grid">
            <div className="chart-section card">
              <div className="chart-header">
                <h3>Faturamento por dia</h3>
              </div>
              <div className="chart-container" style={{ height: '280px' }}>
                <Line options={lineOptions} data={lineData} />
              </div>
            </div>

            <div className="chart-section card">
              <div className="chart-header">
                <h3>Pedidos por status</h3>
              </div>
              <div className="chart-container" style={{ height: '280px' }}>
                <Doughnut options={doughnutOptions} data={doughnutData} />
              </div>
            </div>
          </div>

          <div className="charts-grid" style={{ marginTop: '1.5rem' }}>
            <div className="chart-section card">
              <div className="chart-header">
                <h3>Vendas por Pagamento</h3>
              </div>
              <div className="chart-container" style={{ height: '280px' }}>
                <Doughnut options={doughnutOptions} data={paymentData} />
              </div>
            </div>

            <div className="chart-section card">
              <div className="chart-header">
                <h3>Top Produtos (Receita)</h3>
              </div>
              <div className="chart-container" style={{ height: '280px' }}>
                <Bar options={barOptions} data={productBarData} />
              </div>
            </div>
          </div>

          <div className="chart-section card" style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
            <div className="chart-header">
              <h3>Desempenho de Produtos</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ticket médio de todos os produtos do catálogo com vendas no período.</p>
            </div>
            <table className="products-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th style={{ textAlign: 'right' }}>Qtd Vendida</th>
                  <th style={{ textAlign: 'right' }}>Receita Total</th>
                  <th style={{ textAlign: 'right' }}>Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.productSales?.map((product) => (
                  <tr key={product.productId}>
                    <td><strong>{product.name}</strong></td>
                    <td style={{ textAlign: 'right' }}>{product.quantitySold} un</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-primary)' }}>{formatCurrency(product.totalRevenue)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatCurrency(product.averageTicket)}</td>
                  </tr>
                ))}
                {(!metrics?.productSales || metrics.productSales.length === 0) && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum produto vendido neste período.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
