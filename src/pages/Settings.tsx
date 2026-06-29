import { useEffect, useState } from 'react'
import { Save, Store, Star, AlertCircle, CheckCircle, CalendarDays, Plus, Trash2, HelpCircle } from 'lucide-react'
import { api } from '../services/api'
import type { StoreSettings, LoyaltyConfig } from '../types'
import './Settings.css'

type ToastType = 'success' | 'error'

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  )
}

export function Settings() {
  const [tab, setTab] = useState<'store' | 'loyalty' | 'calendar'>('store')
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null)
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true)
      try {
        const [sRes, lRes] = await Promise.all([
          api.get('/settings'),
          api.get('/loyalty/config'),
        ])
        setStoreSettings(sRes.data.settings)
        setLoyaltyConfig(lRes.data.config)
      } catch {
        /* silent */
      } finally {
        setIsLoading(false)
      }
    }
    loadAll()
  }, [])

  const handleStoreChange = (field: keyof StoreSettings, value: any) => {
    setStoreSettings((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  const handleLoyaltyChange = (field: keyof LoyaltyConfig, value: any) => {
    setLoyaltyConfig((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  const saveStore = async () => {
    if (!storeSettings) return
    setIsSaving(true)
    try {
      await api.put('/settings', {
        name: storeSettings.name,
        phone: storeSettings.phone,
        address: storeSettings.address,
        delivery_fee: storeSettings.delivery_fee,
        free_delivery_above: storeSettings.free_delivery_above,
        min_order_value: storeSettings.min_order_value,
        store_open: storeSettings.store_open,
        opening_time: storeSettings.opening_time,
        closing_time: storeSettings.closing_time,
        operating_days: storeSettings.operating_days,
        holidays: storeSettings.holidays,
      })
      setToast({ message: 'Configurações salvas com sucesso!', type: 'success' })
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message ?? 'Erro ao salvar.', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const saveLoyalty = async () => {
    if (!loyaltyConfig) return
    setIsSaving(true)
    try {
      await api.put('/loyalty/config', {
        program_enabled: loyaltyConfig.program_enabled,
        program_mode: loyaltyConfig.program_mode,
        points_per_real: loyaltyConfig.points_per_real,
        conversion_rate: loyaltyConfig.conversion_rate,
        min_points_to_redeem: loyaltyConfig.min_points_to_redeem,
        max_redeem_percent: loyaltyConfig.max_redeem_percent,
        expiry_days: loyaltyConfig.expiry_days,
        inactivity_days: loyaltyConfig.inactivity_days,
      })
      setToast({ message: 'Programa de fidelidade salvo!', type: 'success' })
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message ?? 'Erro ao salvar.', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="settings-page">
        <div className="loading-state card"><p>Carregando configurações...</p></div>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <header className="page-header">
        <div>
          <h1>Configurações</h1>
          <p>Gerencie a loja e o programa de fidelidade.</p>
        </div>
      </header>

      <div className="tabs-bar">
        <button className={`tab-btn ${tab === 'store' ? 'active' : ''}`} onClick={() => setTab('store')}>
          <Store size={15} style={{ marginRight: '0.375rem', display: 'inline' }} />
          Configurações da Loja
        </button>
        <button className={`tab-btn ${tab === 'calendar' ? 'active' : ''}`} onClick={() => setTab('calendar')}>
          <CalendarDays size={15} style={{ marginRight: '0.375rem', display: 'inline' }} />
          Calendário e Agendamentos
        </button>
        <button className={`tab-btn ${tab === 'loyalty' ? 'active' : ''}`} onClick={() => setTab('loyalty')}>
          <Star size={15} style={{ marginRight: '0.375rem', display: 'inline' }} />
          Programa de Fidelidade
        </button>
      </div>

      {tab === 'store' && storeSettings && (
        <div className="settings-card card">
          <div className="settings-section">
            <h3 className="settings-section-title">Informações Gerais</h3>
            <div className="settings-grid">
              <div className="input-group">
                <label className="input-label">Nome da Loja</label>
                <input className="input-field" value={storeSettings.name ?? ''} onChange={(e) => handleStoreChange('name', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Telefone</label>
                <input className="input-field" value={storeSettings.phone ?? ''} onChange={(e) => handleStoreChange('phone', e.target.value)} />
              </div>
              <div className="input-group col-span-2">
                <label className="input-label">Endereço</label>
                <input className="input-field" value={storeSettings.address ?? ''} onChange={(e) => handleStoreChange('address', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Entregas e Pedidos</h3>
            <div className="settings-grid">
              <div className="input-group">
                <label className="input-label">Taxa de Entrega (R$)</label>
                <input className="input-field" type="number" step="0.01" min="0" value={storeSettings.delivery_fee ?? 0} onChange={(e) => handleStoreChange('delivery_fee', parseFloat(e.target.value))} />
              </div>
              <div className="input-group">
                <label className="input-label">Entrega Grátis acima de (R$)</label>
                <input className="input-field" type="number" step="0.01" min="0" placeholder="Sem frete grátis" value={storeSettings.free_delivery_above ?? ''} onChange={(e) => handleStoreChange('free_delivery_above', e.target.value ? parseFloat(e.target.value) : null)} />
              </div>
              <div className="input-group">
                <label className="input-label">Pedido Mínimo (R$)</label>
                <input className="input-field" type="number" step="0.01" min="0" value={storeSettings.min_order_value ?? 0} onChange={(e) => handleStoreChange('min_order_value', parseFloat(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Controle Manual</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Use este controle para fechar ou abrir a loja emergencialmente, ignorando os horários definidos no Calendário.
            </p>
            <div className="settings-grid">
              <div className="input-group">
                <label className="settings-toggle-label">
                  <span>Loja Aberta Agora</span>
                  <div className="toggle-switch" onClick={() => handleStoreChange('store_open', !storeSettings.store_open)}>
                    <div className={`toggle-track ${storeSettings.store_open ? 'on' : ''}`}>
                      <div className="toggle-thumb" />
                    </div>
                    <span className={storeSettings.store_open ? 'text-success' : 'text-muted'}>
                      {storeSettings.store_open ? 'Aberta' : 'Fechada'}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-actions">
            <button className="btn btn-primary" onClick={saveStore} disabled={isSaving}>
              <Save size={16} />
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      )}

      {tab === 'calendar' && storeSettings && (
        <div className="settings-card card">
          <div className="settings-section">
            <h3 className="settings-section-title">Dias de Funcionamento</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Selecione quais dias da semana a loja atende pedidos agendados e configure o horário comercial para eles.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
                const currentDays = storeSettings.operating_days || []
                const dayConfig = currentDays.find(d => d.day === dayIdx) || { day: dayIdx, open: false, start: '08:00', end: '18:00' }
                
                return (
                  <div key={dayIdx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '150px', fontWeight: 500 }}>
                      <input 
                        type="checkbox" 
                        checked={dayConfig.open}
                        onChange={(e) => {
                          const newDays = currentDays.filter(d => d.day !== dayIdx)
                          newDays.push({ ...dayConfig, open: e.target.checked })
                          handleStoreChange('operating_days', newDays)
                        }}
                      />
                      {dayNames[dayIdx]}
                    </label>
                    {dayConfig.open ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                          type="time" 
                          className="input-field" 
                          style={{ padding: '0.25rem 0.5rem' }} 
                          value={dayConfig.start} 
                          onChange={(e) => {
                            const newDays = currentDays.filter(d => d.day !== dayIdx)
                            newDays.push({ ...dayConfig, start: e.target.value })
                            handleStoreChange('operating_days', newDays)
                          }}
                        />
                        <span>até</span>
                        <input 
                          type="time" 
                          className="input-field" 
                          style={{ padding: '0.25rem 0.5rem' }} 
                          value={dayConfig.end} 
                          onChange={(e) => {
                            const newDays = currentDays.filter(d => d.day !== dayIdx)
                            newDays.push({ ...dayConfig, end: e.target.value })
                            handleStoreChange('operating_days', newDays)
                          }}
                        />
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Fechado</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Feriados e Exceções (Dias Fechados)</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Adicione datas específicas em que a loja não abrirá (ex: Natal, Ano Novo).
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <input 
                type="date" 
                className="input-field" 
                id="newHolidayDate"
                style={{ width: 'auto' }}
              />
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.5rem 1rem' }}
                onClick={() => {
                  const el = document.getElementById('newHolidayDate') as HTMLInputElement
                  if (el.value) {
                    const currentHolidays = storeSettings.holidays || []
                    if (!currentHolidays.includes(el.value)) {
                      handleStoreChange('holidays', [...currentHolidays, el.value])
                    }
                    el.value = ''
                  }
                }}
              >
                <Plus size={16} /> Adicionar Data
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(storeSettings.holidays || []).map(dateStr => (
                <div key={dateStr} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  <span>{new Date(dateStr + 'T12:00:00Z').toLocaleDateString('pt-BR')}</span>
                  <button 
                    className="btn" 
                    style={{ color: 'var(--accent-danger)' }}
                    onClick={() => {
                      handleStoreChange('holidays', (storeSettings.holidays || []).filter(d => d !== dateStr))
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {(!storeSettings.holidays || storeSettings.holidays.length === 0) && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                  Nenhuma data de exceção cadastrada.
                </div>
              )}
            </div>
          </div>

          <div className="settings-actions">
            <button className="btn btn-primary" onClick={saveStore} disabled={isSaving}>
              <Save size={16} />
              {isSaving ? 'Salvando...' : 'Salvar Calendário'}
            </button>
          </div>
        </div>
      )}

      {tab === 'loyalty' && loyaltyConfig && (
        <div className="settings-card card">
          <div className="settings-section">
            <h3 className="settings-section-title">Configurações do Programa</h3>
            <div className="settings-grid">
              <div className="input-group">
                <div className="label-with-tooltip">
                  <label className="input-label">Modo do Programa</label>
                  <div className="tooltip-container" tabIndex={0}>
                    <HelpCircle size={14} className="tooltip-icon" />
                    <span className="tooltip-text">Define se o programa de fidelidade opera acumulando Pontos virtuais ou retornando Cashback em dinheiro (R$).</span>
                  </div>
                </div>
                <select className="input-field" value={loyaltyConfig.program_mode} onChange={(e) => handleLoyaltyChange('program_mode', e.target.value)}>
                  <option value="POINTS">Pontos</option>
                  <option value="CASHBACK">Cashback</option>
                </select>
              </div>
              <div className="input-group">
                <div className="label-with-tooltip">
                  <label className="input-label">Pontos por R$ 1,00 gasto</label>
                  <div className="tooltip-container" tabIndex={0}>
                    <HelpCircle size={14} className="tooltip-icon" />
                    <span className="tooltip-text">Quantidade de pontos que o cliente ganha a cada R$ 1,00 gasto em compras na loja. Exemplo: se configurado como 10, uma compra de R$ 50,00 gera 500 pontos.</span>
                  </div>
                </div>
                <input className="input-field" type="number" step="0.1" min="0" value={loyaltyConfig.points_per_real} onChange={(e) => handleLoyaltyChange('points_per_real', parseFloat(e.target.value))} />
              </div>
              <div className="input-group">
                <div className="label-with-tooltip">
                  <label className="input-label">Taxa de Conversão (pts → R$)</label>
                  <div className="tooltip-container" tabIndex={0}>
                    <HelpCircle size={14} className="tooltip-icon" />
                    <span className="tooltip-text">Quantidade de pontos necessários para obter R$ 1,00 de desconto. Exemplo: se configurado como 10, cada 10 pontos equivalem a R$ 1,00 de desconto (ex: 500 pts = R$ 50,00 de desconto).</span>
                  </div>
                </div>
                <input className="input-field" type="number" step="0.01" min="0" value={loyaltyConfig.conversion_rate} onChange={(e) => handleLoyaltyChange('conversion_rate', parseFloat(e.target.value))} />
              </div>
              <div className="input-group">
                <div className="label-with-tooltip">
                  <label className="input-label">Mínimo de Pontos para Resgatar</label>
                  <div className="tooltip-container" tabIndex={0}>
                    <HelpCircle size={14} className="tooltip-icon" />
                    <span className="tooltip-text">Quantidade mínima de pontos que o cliente deve acumular antes de conseguir realizar um resgate no carrinho do app.</span>
                  </div>
                </div>
                <input className="input-field" type="number" min="0" value={loyaltyConfig.min_points_to_redeem} onChange={(e) => handleLoyaltyChange('min_points_to_redeem', parseInt(e.target.value))} />
              </div>
              <div className="input-group">
                <div className="label-with-tooltip">
                  <label className="input-label">% Máximo de Desconto no Pedido</label>
                  <div className="tooltip-container" tabIndex={0}>
                    <HelpCircle size={14} className="tooltip-icon" />
                    <span className="tooltip-text">Limite máximo de desconto que pode ser pago usando os pontos acumulados, calculado sobre o valor total do pedido. Evita que o pedido saia totalmente de graça.</span>
                  </div>
                </div>
                <input className="input-field" type="number" step="1" min="0" max="100" value={loyaltyConfig.max_redeem_percent} onChange={(e) => handleLoyaltyChange('max_redeem_percent', parseFloat(e.target.value))} />
              </div>
              <div className="input-group">
                <div className="label-with-tooltip">
                  <label className="input-label">Expiração dos Pontos (dias)</label>
                  <div className="tooltip-container" tabIndex={0}>
                    <HelpCircle size={14} className="tooltip-icon" />
                    <span className="tooltip-text">Prazo de validade de cada ponto acumulado, contado a partir do dia em que foi ganho. Deixe em branco se os pontos não expirarem.</span>
                  </div>
                </div>
                <input className="input-field" type="number" min="1" value={loyaltyConfig.expiry_days ?? ''} placeholder="Sem expiração" onChange={(e) => handleLoyaltyChange('expiry_days', e.target.value ? parseInt(e.target.value) : undefined)} />
              </div>
              <div className="input-group">
                <div className="label-with-tooltip">
                  <label className="input-label">Inatividade para expirar (dias)</label>
                  <div className="tooltip-container" tabIndex={0}>
                    <HelpCircle size={14} className="tooltip-icon" />
                    <span className="tooltip-text">Se o cliente passar este número de dias sem realizar nenhuma compra ou ação na loja, todo o saldo acumulado de pontos dele será zerado de uma vez.</span>
                  </div>
                </div>
                <input className="input-field" type="number" min="1" value={loyaltyConfig.inactivity_days ?? ''} placeholder="Não expira por inatividade" onChange={(e) => handleLoyaltyChange('inactivity_days', e.target.value ? parseInt(e.target.value) : undefined)} />
              </div>
            </div>
          </div>

          <div className="settings-section">
            <label className="settings-toggle-label">
              <span>Programa Ativo</span>
              <div className="toggle-switch" onClick={() => handleLoyaltyChange('program_enabled', !loyaltyConfig.program_enabled)}>
                <div className={`toggle-track ${loyaltyConfig.program_enabled ? 'on' : ''}`}>
                  <div className="toggle-thumb" />
                </div>
                <span className={loyaltyConfig.program_enabled ? 'text-success' : 'text-muted'}>
                  {loyaltyConfig.program_enabled ? 'Ativado' : 'Desativado'}
                </span>
              </div>
            </label>
          </div>

          <div className="settings-actions">
            <button className="btn btn-primary" onClick={saveLoyalty} disabled={isSaving}>
              <Save size={16} />
              {isSaving ? 'Salvando...' : 'Salvar Fidelidade'}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
