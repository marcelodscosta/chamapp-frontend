import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import './Login.css'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'E-mail ou senha incorretos.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>ChamApp</h1>
          <p>Painel Administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label className="input-label" htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              className="input-field"
              placeholder="admin@chamapp.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Senha</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ flex: 1, paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary, #666)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-submit" disabled={isLoading}>
            <LogIn size={18} />
            {isLoading ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  )
}
