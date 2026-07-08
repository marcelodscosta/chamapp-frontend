import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { api } from '../services/api'
import type { Order } from '../types'
import './MapView.css'

// Tipos
interface UserLocation {
  userId: string
  name: string
  email: string
  phone?: string
  latitude: number
  longitude: number
  has_active_order: boolean
  last_seen_at: string
}

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Ícones coloridos por status
function createStatusIcon(color: string, size = 28) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${size}px; height: ${size}px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// Ícone de usuário com letra inicial
function createUserIcon(name: string, hasActiveOrder: boolean) {
  const color = hasActiveOrder ? '#F59E0B' : '#3B82F6'
  const initial = name.charAt(0).toUpperCase()
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 36px; height: 36px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
      font-weight: bold; font-size: 14px; color: white; font-family: sans-serif;
    ">${initial}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em Separação',
  OUT_FOR_DELIVERY: 'Em Rota',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
}

const STATUS_ICON_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#3B82F6',
  PREPARING: '#8B5CF6',
  OUT_FOR_DELIVERY: '#06B6D4',
  DELIVERED: '#10B981',
  CANCELLED: '#EF4444',
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function copyGoogleMapsLink(lat: number, lng: number, name: string) {
  const url = `https://www.google.com/maps?q=${lat},${lng}`
  navigator.clipboard.writeText(url).then(() => {
    alert(`Link de localização de ${name} copiado!`)
  }).catch(() => {
    // Fallback para navegadores sem clipboard API
    window.open(url, '_blank')
  })
}

const DEFAULT_CENTER: [number, number] = [-9.1620, -40.9708] // Casa Nova, Bahia

export function MapView() {
  const [orders, setOrders] = useState<Order[]>([])
  const [userLocations, setUserLocations] = useState<UserLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('OUT_FOR_DELIVERY')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [ordersRes, locationsRes] = await Promise.all([
          api.get('/orders', { params: { limit: '200' } }),
          api.get('/admin/users/locations'),
        ])
        setOrders(ordersRes.data.orders ?? ordersRes.data.data ?? [])
        setUserLocations(locationsRes.data.users ?? [])
      } catch {
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 30000) // Atualiza a cada 30s
    return () => clearInterval(interval)
  }, [])

  const filtered = orders.filter((o) => {
    if (filterStatus === 'ACTIVE') return ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status)
    return o.status === filterStatus
  })

  // Pedidos com coordenadas válidas
  const ordersWithCoords = filtered.filter(
    (o) => o.address?.latitude && o.address?.longitude
  )

  const counters = {
    PENDING: orders.filter((o) => o.status === 'PENDING').length,
    OUT_FOR_DELIVERY: orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length,
    PREPARING: orders.filter((o) => o.status === 'PREPARING').length,
    ONLINE_USERS: userLocations.filter((u) => !u.has_active_order).length,
    ORDERING_USERS: userLocations.filter((u) => u.has_active_order).length,
  }

  return (
    <div className="map-page">
      <header className="page-header">
        <div>
          <h1>Mapa de Entregas</h1>
          <p>Acompanhe os pedidos em tempo real. Atualiza automaticamente a cada 30s.</p>
        </div>
      </header>

      {/* KPIs ativos */}
      <div className="map-kpis">
        <div className="map-kpi" style={{ borderLeft: '3px solid #F59E0B' }}>
          <span className="map-kpi-num">{counters.PENDING}</span>
          <span className="map-kpi-label">Pendentes</span>
        </div>
        <div className="map-kpi" style={{ borderLeft: '3px solid #8B5CF6' }}>
          <span className="map-kpi-num">{counters.PREPARING}</span>
          <span className="map-kpi-label">Em Separação</span>
        </div>
        <div className="map-kpi" style={{ borderLeft: '3px solid #06B6D4' }}>
          <span className="map-kpi-num">{counters.OUT_FOR_DELIVERY}</span>
          <span className="map-kpi-label">Em Rota</span>
        </div>
        <div className="map-kpi" style={{ borderLeft: '3px solid #3B82F6' }}>
          <span className="map-kpi-num">{counters.ONLINE_USERS}</span>
          <span className="map-kpi-label">Usuários Online</span>
        </div>
        <div className="map-kpi" style={{ borderLeft: '3px solid #F59E0B' }}>
          <span className="map-kpi-num">{counters.ORDERING_USERS}</span>
          <span className="map-kpi-label">Com Pedido Ativo</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="map-filters">
        {[
          { value: 'ACTIVE', label: 'Todos Ativos' },
          { value: 'PENDING', label: 'Pendentes' },
          { value: 'OUT_FOR_DELIVERY', label: 'Em Rota' },
          { value: 'DELIVERED', label: 'Entregues' },
        ].map((f) => (
          <button
            key={f.value}
            className={`filter-chip ${filterStatus === f.value ? 'active' : ''}`}
            onClick={() => setFilterStatus(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card map-card">
        {isLoading ? (
          <div className="loading-state"><p>Carregando pedidos...</p></div>
        ) : (
          <>
            {ordersWithCoords.length === 0 && (
              <div className="map-no-coords-warning">
                ⚠️ {filtered.length} pedido(s) encontrado(s), mas sem coordenadas de endereço registradas ainda.
              </div>
            )}
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={13}
              style={{ height: '560px', width: '100%', borderRadius: '0 0 8px 8px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />

              {/* Marcadores de pedidos */}
              {ordersWithCoords.map((order) => (
                <Marker
                  key={order.id}
                  position={[order.address.latitude!, order.address.longitude!]}
                  icon={createStatusIcon(STATUS_ICON_COLORS[order.status] ?? '#94A3B8')}
                >
                  <Popup>
                    <div className="map-popup">
                      <strong>#{order.id.slice(-6).toUpperCase()}</strong>
                      <p><b>Cliente:</b> {order.customer?.name}</p>
                      <p><b>Status:</b> {STATUS_LABELS[order.status]}</p>
                      <p><b>Total:</b> {formatCurrency(order.total)}</p>
                      <p><b>Endereço:</b> {order.address.street}, {order.address.number}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Marcadores de usuários online */}
              {userLocations.map((user) => (
                <Marker
                  key={user.userId}
                  position={[user.latitude, user.longitude]}
                  icon={createUserIcon(user.name, user.has_active_order)}
                >
                  <Popup>
                    <div className="map-popup">
                      <strong>{user.name}</strong>
                      <p><b>Status:</b> {user.has_active_order ? '🟠 Com pedido ativo' : '🔵 Online'}</p>
                      {user.phone && <p><b>Tel:</b> {user.phone}</p>}
                      <p style={{ fontSize: '11px', color: '#888' }}>
                        Última atualização: {new Date(user.last_seen_at).toLocaleTimeString('pt-BR')}
                      </p>
                      <button
                        onClick={() => copyGoogleMapsLink(user.latitude, user.longitude, user.name)}
                        style={{
                          marginTop: '8px', width: '100%', padding: '6px 12px',
                          background: '#3B82F6', color: 'white', border: 'none',
                          borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px',
                        }}
                      >
                        📋 Copiar localização
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Legenda */}
            <div style={{ display: 'flex', gap: '16px', padding: '10px 16px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', flexWrap: 'wrap', fontSize: '12px' }}>
              <span><span style={{ display:'inline-block', width:12, height:12, borderRadius:'50%', background:'#3B82F6', marginRight:4 }} />Usuário online</span>
              <span><span style={{ display:'inline-block', width:12, height:12, borderRadius:'50%', background:'#F59E0B', marginRight:4 }} />Com pedido ativo</span>
              <span><span style={{ display:'inline-block', width:12, height:12, borderRadius:'50%', background:'#06B6D4', marginRight:4 }} />Em rota</span>
              <span><span style={{ display:'inline-block', width:12, height:12, borderRadius:'50%', background:'#8B5CF6', marginRight:4 }} />Em Separação</span>
              <span><span style={{ display:'inline-block', width:12, height:12, borderRadius:'50%', background:'#10B981', marginRight:4 }} />Entregue</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
