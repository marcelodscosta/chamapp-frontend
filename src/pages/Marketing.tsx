import { useState } from 'react'
import { Megaphone, Image as ImageIcon, Send, Users } from 'lucide-react'
import { api } from '../services/api'
import './Marketing.css'

type FilterType = 'ALL' | 'NEVER_BOUGHT' | 'INACTIVE_30_DAYS'

export function Marketing() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [filter, setFilter] = useState<FilterType>('ALL')
  
  const [isLoading, setIsLoading] = useState(false)
  const [successResult, setSuccessResult] = useState<{ targeted: number; sent: number } | null>(null)
  const [error, setError] = useState('')

  async function handleSendPush(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccessResult(null)

    try {
      const response = await api.post('/marketing/push', {
        title,
        body,
        imageUrl,
        filter
      })
      setSuccessResult({
        targeted: response.data.usersTargeted,
        sent: response.data.tokensSent
      })
      // Limpar form após envio bem sucedido opcionalmente
      // setTitle(''); setBody(''); setImageUrl('')
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || 'Erro ao enviar campanha de marketing.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="marketing-container">
      <div className="marketing-header">
        <div className="header-title">
          <div className="icon-wrapper bg-gradient">
            <Megaphone className="icon-primary" />
          </div>
          <div>
            <h1>Campanhas de Marketing</h1>
            <p>Envie notificações push em massa para seus clientes</p>
          </div>
        </div>
      </div>

      <div className="marketing-content">
        <form className="marketing-form card" onSubmit={handleSendPush}>
          <h2>Nova Campanha</h2>
          
          <div className="input-group">
            <label className="input-label">Público Alvo</label>
            <div className="select-wrapper">
              <Users className="input-icon" size={18} />
              <select 
                className="input-field with-icon"
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
              >
                <option value="ALL">Todos os Clientes</option>
                <option value="NEVER_BOUGHT">Nunca Compraram</option>
                <option value="INACTIVE_30_DAYS">Inativos há mais de 30 dias</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Título da Notificação</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ex: Promoção de Fim de Semana! 🍕"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={60}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Mensagem</label>
            <textarea 
              className="input-field textarea-field" 
              placeholder="Escreva a mensagem que vai aparecer no celular do cliente..."
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              maxLength={150}
            />
            <span className="char-count">{body.length}/150</span>
          </div>

          <div className="input-group">
            <label className="input-label">URL da Imagem (Opcional)</label>
            <div className="input-with-icon">
              <ImageIcon className="input-icon" size={18} />
              <input 
                type="url" 
                className="input-field with-icon" 
                placeholder="https://exemplo.com/imagem.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            <span className="input-hint">Cole o link de uma imagem para exibi-la rica no celular do cliente.</span>
          </div>

          {error && <div className="alert error">{error}</div>}
          
          {successResult && (
            <div className="alert success">
              <strong>Campanha disparada com sucesso! 🚀</strong><br/>
              Atingiu {successResult.targeted} clientes. {successResult.sent} dispositivos receberam o Push!
            </div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary btn-large"
              disabled={isLoading || !title.trim() || !body.trim()}
            >
              <Send size={20} />
              {isLoading ? 'Enviando...' : 'Disparar Notificação Push'}
            </button>
          </div>
        </form>

        <div className="marketing-preview card">
          <h2>Preview do Celular</h2>
          <div className="phone-mockup">
            <div className="phone-screen">
              <div className="notification-bubble">
                <div className="notification-header">
                  <div className="app-icon-small"></div>
                  <span>ChamApp • Agora</span>
                </div>
                <div className="notification-body">
                  <strong>{title || 'Título da Notificação'}</strong>
                  <p>{body || 'A mensagem aparecerá aqui...'}</p>
                </div>
                {imageUrl && (
                  <div className="notification-image">
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.display = 'block';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
