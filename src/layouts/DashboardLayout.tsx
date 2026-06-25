import { useEffect, useRef, useCallback } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MapPin,
  ShoppingBag,
  Package,
  Users,
  Settings,
  Megaphone,
  LogOut,
  Store,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import './DashboardLayout.css'

export function DashboardLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // --- LÓGICA DE ALERTA SONORO GLOBAL ---
  const audioCtxRef = useRef<AudioContext | null>(null)
  const beepIntervalRef = useRef<number | null>(null)

  const startBeep = useCallback(() => {
    if (beepIntervalRef.current) return
    const play = () => {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) audioCtxRef.current = new AudioContextClass()
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {})
      }
      if (!audioCtxRef.current || audioCtxRef.current.state === 'suspended') return
      
      const osc = audioCtxRef.current.createOscillator()
      const gain = audioCtxRef.current.createGain()
      osc.type = 'square'
      osc.frequency.value = 800 
      gain.gain.value = 0.05
      osc.connect(gain)
      gain.connect(audioCtxRef.current.destination)
      
      const now = audioCtxRef.current.currentTime
      osc.start(now)
      osc.stop(now + 0.3)
    }
    
    play()
    beepIntervalRef.current = window.setInterval(play, 2000)
  }, [])

  const stopBeep = useCallback(() => {
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current)
      beepIntervalRef.current = null
    }
  }, [])

  const checkPendingOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders', { params: { limit: 1, status: 'PENDING' } })
      const pendingCount = res.data.orders?.length || res.data.data?.length || 0
      if (pendingCount > 0) {
        startBeep()
      } else {
        stopBeep()
      }
    } catch (err) {
      // Falha ao verificar
    }
  }, [startBeep, stopBeep])

  // Inicializa o áudio ao primeiro clique do usuário para destravar o Autoplay do navegador
  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) audioCtxRef.current = new AudioContextClass()
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume()
      }
    }
    document.addEventListener('click', initAudio)
    return () => document.removeEventListener('click', initAudio)
  }, [])

  // Escuta WebSocket e verifica na montagem
  useEffect(() => {
    checkPendingOrders()

    import('../lib/socket').then(({ socket }) => {
      socket.on('order:created', checkPendingOrders)
      socket.on('order:status_updated', checkPendingOrders)
      
      return () => {
        socket.off('order:created', checkPendingOrders)
        socket.off('order:status_updated', checkPendingOrders)
      }
    })
  }, [checkPendingOrders])
  // --------------------------------------

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-box">
            <Store size={20} color="var(--accent-primary)" />
            <span className="logo-text">ChamApp</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ShoppingBag size={18} />
            <span>Pedidos</span>
          </NavLink>
          <NavLink to="/catalog" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Package size={18} />
            <span>Catálogo</span>
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Clientes</span>
          </NavLink>
          <NavLink to="/marketing" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Megaphone size={18} />
            <span>Marketing (Push)</span>
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <MapPin size={18} />
            <span>Mapa de Entregas</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={18} />
            <span>Configurações</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </div>
          )}
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
