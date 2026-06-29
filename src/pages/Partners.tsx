import { useEffect, useState } from 'react'
import { Save, Plus, Trash2, Edit2, Eye, MousePointerClick, Users, Megaphone } from 'lucide-react'
import { api } from '../services/api'
import type { Partner, PartnerBanner } from '../types'
import './Partners.css'

type ToastType = 'success' | 'error'

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`toast toast-${type}`}>
      {message}
    </div>
  )
}

export function Partners() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [banners, setPartnerBanners] = useState<PartnerBanner[]>([])
  const [partnerSubTab, setPartnerSubTab] = useState<'list_partners' | 'list_banners'>('list_partners')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  // Formulário Parceiro
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null) // null, 'new' ou uuid
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    logo_url: '',
    description: '',
    phone: '',
    address: '',
    website: ''
  })

  // Formulário Banner
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null) // null, 'new' ou uuid
  const [bannerForm, setBannerForm] = useState({
    partnerId: '',
    image_url: '',
    target_type: 'EXTERNAL_LINK' as 'EXTERNAL_LINK' | 'PARTNER_PROFILE',
    target_url: '',
    priority: 0,
    expires_at: ''
  })

  // Uploads locais de arquivos
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedLogoFile(file)
    if (file) {
      setLogoPreview(URL.createObjectURL(file))
    } else {
      setLogoPreview(partnerForm.logo_url || null)
    }
  }

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedBannerFile(file)
    if (file) {
      setBannerPreview(URL.createObjectURL(file))
    } else {
      setBannerPreview(bannerForm.image_url || null)
    }
  }

  const loadPartnersData = async () => {
    setIsLoading(true)
    try {
      const [pRes, bRes] = await Promise.all([
        api.get('/partners'),
        api.get('/partners/banners')
      ])
      setPartners(pRes.data.partners || [])
      setPartnerBanners(bRes.data.banners || [])
    } catch {
      setToast({ message: 'Erro ao carregar parceiros e banners.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPartnersData()
  }, [])

  const savePartner = async () => {
    if (!partnerForm.name) {
      setToast({ message: 'O nome do parceiro é obrigatório.', type: 'error' })
      return
    }
    setIsSaving(true)
    try {
      let partnerId = editingPartnerId

      if (editingPartnerId === 'new') {
        const res = await api.post('/partners', partnerForm)
        partnerId = res.data.partner.id
        setToast({ message: 'Parceiro cadastrado com sucesso!', type: 'success' })
      } else if (editingPartnerId) {
        await api.put(`/partners/${editingPartnerId}`, partnerForm)
        setToast({ message: 'Parceiro atualizado com sucesso!', type: 'success' })
      }

      if (selectedLogoFile && partnerId) {
        const formData = new FormData()
        formData.append('file', selectedLogoFile)
        await api.patch(`/partners/${partnerId}/logo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      setEditingPartnerId(null)
      setSelectedLogoFile(null)
      setLogoPreview(null)
      loadPartnersData()
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message ?? 'Erro ao salvar parceiro.', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const deletePartner = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este parceiro? Isso removerá todos os seus banners.')) return
    try {
      await api.delete(`/partners/${id}`)
      setToast({ message: 'Parceiro removido com sucesso.', type: 'success' })
      loadPartnersData()
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message ?? 'Erro ao remover parceiro.', type: 'error' })
    }
  }

  const saveBanner = async () => {
    if (!bannerForm.partnerId || (!bannerForm.image_url && !selectedBannerFile)) {
      setToast({ message: 'Parceiro e imagem/arquivo do banner são obrigatórios.', type: 'error' })
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        ...bannerForm,
        image_url: bannerForm.image_url || 'https://placeholder.com',
        priority: Number(bannerForm.priority),
        expires_at: bannerForm.expires_at ? new Date(bannerForm.expires_at).toISOString() : undefined
      }

      let bannerId = editingBannerId

      if (editingBannerId === 'new') {
        const res = await api.post('/partners/banners', payload)
        bannerId = res.data.banner.id
        setToast({ message: 'Banner cadastrado com sucesso!', type: 'success' })
      } else if (editingBannerId) {
        await api.put(`/partners/banners/${editingBannerId}`, {
          ...payload,
          expires_at: bannerForm.expires_at ? new Date(bannerForm.expires_at).toISOString() : null
        })
        setToast({ message: 'Banner atualizado com sucesso!', type: 'success' })
      }

      if (selectedBannerFile && bannerId) {
        const formData = new FormData()
        formData.append('file', selectedBannerFile)
        await api.patch(`/partners/banners/${bannerId}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      setEditingBannerId(null)
      setSelectedBannerFile(null)
      setBannerPreview(null)
      loadPartnersData()
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message ?? 'Erro ao salvar banner.', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteBanner = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este banner?')) return
    try {
      await api.delete(`/partners/banners/${id}`)
      setToast({ message: 'Banner removido com sucesso.', type: 'success' })
      loadPartnersData()
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message ?? 'Erro ao remover banner.', type: 'error' })
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Parcerias Comerciais</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Gerencie parceiros comerciais e propagandas vinculadas ao aplicativo.</p>
        </div>
      </header>

      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p>Carregando parceiros e banners...</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {/* Navegação de sub-abas */}
          <div className="tabs-bar" style={{ padding: '0 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex' }}>
            <button className={`tab-btn ${partnerSubTab === 'list_partners' ? 'active' : ''}`} onClick={() => { setPartnerSubTab('list_partners'); setEditingPartnerId(null); }} style={{ padding: '0.75rem 0', marginRight: '1.5rem' }}>
              <Users size={14} style={{ marginRight: '0.375rem', display: 'inline' }} />
              Parceiros Cadastrados
            </button>
            <button className={`tab-btn ${partnerSubTab === 'list_banners' ? 'active' : ''}`} onClick={() => { setPartnerSubTab('list_banners'); setEditingBannerId(null); }} style={{ padding: '0.75rem 0' }}>
              <Megaphone size={14} style={{ marginRight: '0.375rem', display: 'inline' }} />
              Banners & Anúncios
            </button>
          </div>

          {/* CONTEÚDO: PARCEIROS */}
          {partnerSubTab === 'list_partners' && (
            <div style={{ padding: '1.5rem' }}>
              {editingPartnerId ? (
                /* Formulário Parceiro */
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                    {editingPartnerId === 'new' ? 'Novo Parceiro Comercial' : 'Editar Parceiro'}
                  </h4>
                  <div className="settings-grid">
                    <div className="input-group">
                      <label className="input-label">Nome do Parceiro *</label>
                      <input className="input-field" value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} placeholder="Ex: Farmácia Preço Baixo" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Telefone</label>
                      <input className="input-field" value={partnerForm.phone} onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })} placeholder="Ex: (74) 99999-9999" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Logomarca do Parceiro</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {logoPreview ? (
                          <img src={logoPreview} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '4px', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.65rem', flexShrink: 0 }}>Sem logo</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <input className="input-field" type="file" accept="image/*" onChange={handleLogoFileChange} style={{ width: '100%', padding: '0.4rem', fontSize: '0.875rem' }} />
                        </div>
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Website / Rede Social</label>
                      <input className="input-field" value={partnerForm.website} onChange={(e) => setPartnerForm({ ...partnerForm, website: e.target.value })} placeholder="Ex: https://instagram.com/parceiro" />
                    </div>
                    <div className="input-group col-span-2">
                      <label className="input-label">Endereço</label>
                      <input className="input-field" value={partnerForm.address} onChange={(e) => setPartnerForm({ ...partnerForm, address: e.target.value })} placeholder="Ex: Av. Adolfo Viana, 150 - Centro" />
                    </div>
                    <div className="input-group col-span-2">
                      <label className="input-label">Descrição das Ofertas / Apresentação</label>
                      <textarea className="input-field" style={{ minHeight: '80px', fontFamily: 'inherit', paddingTop: '0.5rem' }} value={partnerForm.description} onChange={(e) => setPartnerForm({ ...partnerForm, description: e.target.value })} placeholder="Ex: Desconto exclusivo de 10% em medicamentos para clientes ChamApp Gás." />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn" onClick={() => setEditingPartnerId(null)}>Cancelar</button>
                    <button className="btn btn-primary" onClick={savePartner} disabled={isSaving}>
                      <Save size={16} />
                      {isSaving ? 'Salvando...' : 'Salvar Parceiro'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Lista de Parceiros */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Parceiros comerciais cadastrados que podem ter propagandas veiculadas no app.
                    </p>
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => {
                      setEditingPartnerId('new');
                      setPartnerForm({ name: '', logo_url: '', description: '', phone: '', address: '', website: '' });
                      setSelectedLogoFile(null);
                      setLogoPreview(null);
                    }}>
                      <Plus size={16} /> Novo Parceiro
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="erp-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          <th style={{ padding: '0.75rem' }}>Parceiro</th>
                          <th style={{ padding: '0.75rem' }}>Telefone</th>
                          <th style={{ padding: '0.75rem' }}>Rede/Site</th>
                          <th style={{ padding: '0.75rem' }}>Status</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partners.map(partner => (
                          <tr key={partner.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {partner.logo_url ? (
                                <img src={partner.logo_url} alt={partner.name} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Users size={16} color="#94a3b8" />
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{partner.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '250px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{partner.description || 'Sem descrição.'}</div>
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{partner.phone || '-'}</td>
                            <td style={{ padding: '0.75rem' }}>
                              {partner.website ? (
                                <a href={partner.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Acessar</a>
                              ) : '-'}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: partner.is_active ? '#ecfdf5' : '#fef2f2', color: partner.is_active ? '#047857' : '#b91c1c' }}>
                                {partner.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                              <button className="btn-icon" style={{ marginRight: '0.25rem' }} onClick={() => {
                                setEditingPartnerId(partner.id);
                                setPartnerForm({
                                  name: partner.name,
                                  logo_url: partner.logo_url || '',
                                  description: partner.description || '',
                                  phone: partner.phone || '',
                                  address: partner.address || '',
                                  website: partner.website || ''
                                });
                                setSelectedLogoFile(null);
                                setLogoPreview(partner.logo_url || null);
                              }}>
                                <Edit2 size={14} />
                              </button>
                              <button className="btn-icon" style={{ color: 'var(--accent-danger)' }} onClick={() => deletePartner(partner.id)}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {partners.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                              Nenhum parceiro comercial cadastrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONTEÚDO: BANNERS */}
          {partnerSubTab === 'list_banners' && (
            <div style={{ padding: '1.5rem' }}>
              {editingBannerId ? (
                /* Formulário Banner */
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                    {editingBannerId === 'new' ? 'Novo Banner de Anúncio' : 'Editar Banner'}
                  </h4>
                  <div className="settings-grid">
                    <div className="input-group">
                      <label className="input-label">Parceiro Anunciante *</label>
                      <select className="input-field" value={bannerForm.partnerId} onChange={(e) => setBannerForm({ ...bannerForm, partnerId: e.target.value })}>
                        <option value="">Selecione um parceiro</option>
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Imagem do Banner</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {bannerPreview ? (
                          <img src={bannerPreview} alt="Preview" style={{ width: '100px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '100px', height: '40px', borderRadius: '4px', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.65rem', flexShrink: 0 }}>Sem imagem</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <input className="input-field" type="file" accept="image/*" onChange={handleBannerFileChange} style={{ width: '100%', padding: '0.4rem', fontSize: '0.875rem' }} />
                        </div>
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Tipo de Ação ao Clicar</label>
                      <select className="input-field" value={bannerForm.target_type} onChange={(e) => setBannerForm({ ...bannerForm, target_type: e.target.value as any })}>
                        <option value="EXTERNAL_LINK">Link Externo (Website/Instagram)</option>
                        <option value="PARTNER_PROFILE">Abrir Perfil do Parceiro no App</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Link ou Destino da Ação</label>
                      <input className="input-field" value={bannerForm.target_url} onChange={(e) => setBannerForm({ ...bannerForm, target_url: e.target.value })} placeholder={bannerForm.target_type === 'EXTERNAL_LINK' ? "Ex: https://link-destino.com" : "Opcional (Usa os dados do Parceiro)"} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Prioridade de Exibição (Ordenação)</label>
                      <input className="input-field" type="number" value={bannerForm.priority} onChange={(e) => setBannerForm({ ...bannerForm, priority: parseInt(e.target.value) || 0 })} placeholder="Ex: 0" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Data de Expiração (Opcional)</label>
                      <input className="input-field" type="date" value={bannerForm.expires_at ? bannerForm.expires_at.split('T')[0] : ''} onChange={(e) => setBannerForm({ ...bannerForm, expires_at: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn" onClick={() => setEditingBannerId(null)}>Cancelar</button>
                    <button className="btn btn-primary" onClick={saveBanner} disabled={isSaving}>
                      <Save size={16} />
                      {isSaving ? 'Salvando...' : 'Salvar Banner'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Lista de Banners */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Propagandas exibidas no carrossel do aplicativo móvel do cliente com contagem de cliques.
                    </p>
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => {
                      setEditingBannerId('new');
                      setBannerForm({ partnerId: '', image_url: '', target_type: 'EXTERNAL_LINK', target_url: '', priority: 0, expires_at: '' });
                      setSelectedBannerFile(null);
                      setBannerPreview(null);
                    }} disabled={partners.length === 0}>
                      <Plus size={16} /> Novo Banner
                    </button>
                  </div>

                  {partners.length === 0 && (
                    <div style={{ padding: '1rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px', color: '#b45309', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      Aviso: Você precisa cadastrar pelo menos um **Parceiro** antes de criar um banner.
                    </div>
                  )}

                  <div style={{ overflowX: 'auto' }}>
                    <table className="erp-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          <th style={{ padding: '0.75rem' }}>Visualização Banner</th>
                          <th style={{ padding: '0.75rem' }}>Parceiro</th>
                          <th style={{ padding: '0.75rem' }}>Métricas (Exposições / Cliques)</th>
                          <th style={{ padding: '0.75rem' }}>Ordenação</th>
                          <th style={{ padding: '0.75rem' }}>Status</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {banners.map(banner => (
                          <tr key={banner.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <img src={banner.image_url} alt="Banner" style={{ width: '120px', height: '45px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                            </td>
                            <td style={{ padding: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {banner.partner?.name || 'Carregando...'}
                            </td>
                            <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Eye size={14} color="#64748b" /> {banner.views_count}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <MousePointerClick size={14} color="#64748b" /> {banner.clicks_count}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Fila #{banner.priority}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: banner.is_active ? '#ecfdf5' : '#fef2f2', color: banner.is_active ? '#047857' : '#b91c1c' }}>
                                {banner.is_active ? 'Ativo' : 'Pausado'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                              <button className="btn-icon" style={{ marginRight: '0.25rem' }} onClick={() => {
                                setEditingBannerId(banner.id);
                                setBannerForm({
                                  partnerId: banner.partnerId,
                                  image_url: banner.image_url,
                                  target_type: banner.target_type,
                                  target_url: banner.target_url || '',
                                  priority: banner.priority,
                                  expires_at: banner.expires_at || ''
                                });
                                setSelectedBannerFile(null);
                                setBannerPreview(banner.image_url || null);
                              }}>
                                <Edit2 size={14} />
                              </button>
                              <button className="btn-icon" style={{ color: 'var(--accent-danger)' }} onClick={() => deleteBanner(banner.id)}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {banners.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                              Nenhum banner comercial veiculado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
