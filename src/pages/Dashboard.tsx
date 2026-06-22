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
import { Line, Doughnut } from 'react-chartjs-2'
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

  useEffect(() => {
    setIsLoading(true)
    api.get(`/dashboard/metrics?days=${period}`)
      .then((res) => setMetrics(res.data.metrics))
      .catch(() => {/* usar mock em caso de erro de conexão */})
      .finally(() => setIsLoading(false))
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
        </>
      )}
    </div>
  )
}
