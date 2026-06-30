import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Search, Package } from 'lucide-react'
import { api } from '../services/api'
import type { Product, Category } from '../types'
import './Catalog.css'

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

// ──────────────────────────────────────────────────────────
// Modal de Categoria
// ──────────────────────────────────────────────────────────
function CategoryModal({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null
  onClose: () => void
  onSaved: () => void
}) {
  const existingImage = category?.image_url || (category as any)?.imageUrl
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [isActive, setIsActive] = useState(category?.is_active ?? true)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(existingImage ?? null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
    if (file) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(existingImage ?? null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      let categoryId = category?.id

      if (category) {
        await api.put(`/categories/${category.id}`, { name, description, isActive })
      } else {
        const res = await api.post('/categories', { name, description, isActive })
        categoryId = res.data.category.id
      }

      if (selectedFile && categoryId) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        await api.patch(`/categories/${categoryId}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      onSaved()
      onClose()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao salvar categoria.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h3>{category ? 'Editar Categoria' : 'Nova Categoria'}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Ícone da Categoria</label>
              <div className="image-upload-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {preview ? (
                  <img src={preview} alt="Preview" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 12, backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: '#f3f4f6', border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package color="#9ca3af" size={32} />
                  </div>
                )}
                <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} style={{ fontSize: '0.8rem', width: '100%' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.2 }}>
                  Sugerido: 512x512px. Máximo: 2MB (PNG/JPG).
                </span>
              </div>
            </div>
            
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Nome</label>
                <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Descrição (opcional)</label>
                <input className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="isActiveCat" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <label htmlFor="isActiveCat" className="input-label" style={{ marginBottom: 0 }}>Ativo</label>
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
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

// ──────────────────────────────────────────────────────────
// Modal de Produto
// ──────────────────────────────────────────────────────────
function ProductModal({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}) {
  const existingImage = product?.imageUrl || (product as any)?.image_url
  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price?.toString() ?? '',
    categoryId: product?.categoryId ?? '',
    requiresEmptyReturn: product?.requiresEmptyReturn ?? false,
    earnsPoints: product?.earnsPoints ?? true,
    isAvailable: product?.isAvailable ?? true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(existingImage ?? null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
    if (file) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(existingImage ?? null)
    }
  }

  const handleChange = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const body = {
        ...form,
        price: parseFloat(form.price),
        categoryId: form.categoryId || undefined,
      }
      
      let productId = product?.id

      if (product) {
        await api.put(`/products/${product.id}`, body)
      } else {
        const res = await api.post('/products', body)
        productId = res.data.product.id
      }

      if (selectedFile && productId) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        await api.patch(`/products/${productId}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      onSaved()
      onClose()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao salvar produto.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product ? 'Editar Produto' : 'Novo Produto'}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-grid">
            <div className="input-group">
              <label className="input-label">Nome do Produto *</label>
              <input className="input-field" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Categoria</label>
              <select className="input-field" value={form.categoryId} onChange={(e) => handleChange('categoryId', e.target.value)}>
                <option value="">Sem categoria</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Preço (R$) *</label>
              <input className="input-field" type="number" step="0.01" min="0" value={form.price} onChange={(e) => handleChange('price', e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Imagem do Produto</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {preview ? (
                  <img src={preview} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>Sem foto</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input className="input-field" type="file" accept="image/*" onChange={handleFileChange} style={{ width: '100%', padding: '0.4rem', fontSize: '0.875rem' }} />
                  {existingImage && !selectedFile && <p style={{ fontSize: '0.7rem', marginTop: '4px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Já possui imagem salva. Envie outra p/ substituir.</p>}
                </div>
              </div>
            </div>
            <div className="input-group col-span-2">
              <label className="input-label">Descrição</label>
              <textarea className="input-field" rows={2} value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
            </div>
          </div>

          <div className="modal-checkboxes">
            {[
              { key: 'isAvailable', label: 'Disponível para venda' },
              { key: 'earnsPoints', label: 'Acumula pontos de fidelidade' },
              { key: 'requiresEmptyReturn', label: 'Exige vasilhame vazio' },
            ].map(({ key, label }) => (
              <label key={key} className="checkbox-label">
                <input type="checkbox" checked={(form as any)[key]} onChange={(e) => handleChange(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Página principal: Catalog
// ──────────────────────────────────────────────────────────
export function Catalog() {
  const [tab, setTab] = useState<'products' | 'categories'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [productModal, setProductModal] = useState<{ open: boolean; item: Product | null }>({ open: false, item: null })
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; item: Category | null }>({ open: false, item: null })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products?limit=200'),
        api.get('/categories'),
      ])
      setProducts(prodRes.data.products ?? prodRes.data.data ?? [])
      setCategories(catRes.data.categories ?? catRes.data.data ?? [])
    } catch {
      setProducts([])
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleToggleAvailability = async (productId: string) => {
    try {
      const res = await api.patch(`/products/${productId}/availability`)
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, isAvailable: res.data.product.isAvailable } : p))
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao alterar disponibilidade.')
    }
  }

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  const filteredCategories = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="catalog-page">
      <header className="page-header">
        <div>
          <h1>Catálogo</h1>
          <p>Gerencie produtos e categorias da loja.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => tab === 'products'
            ? setProductModal({ open: true, item: null })
            : setCategoryModal({ open: true, item: null })}
        >
          <Plus size={16} />
          {tab === 'products' ? 'Novo Produto' : 'Nova Categoria'}
        </button>
      </header>

      {/* Tabs */}
      <div className="tabs-bar">
        <button className={`tab-btn ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>
          Produtos ({products.length})
        </button>
        <button className={`tab-btn ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>
          Categorias ({categories.length})
        </button>
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="input-field search-input"
          placeholder={tab === 'products' ? 'Buscar produto...' : 'Buscar categoria...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="loading-state card"><p>Carregando...</p></div>
      ) : tab === 'products' ? (
        <div className="card">
          <div className="table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Disponível</th>
                  <th>Fidelidade</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-name-cell">
                        {(product.imageUrl || (product as any).image_url)
                          ? <img src={product.imageUrl || (product as any).image_url} alt={product.name} className="product-thumb" />
                          : <div className="product-thumb-placeholder"><Package size={16} /></div>
                        }
                        <div>
                          <p style={{ fontWeight: 500 }}>{product.name}</p>
                          {product.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{product.description.slice(0, 50)}{product.description.length > 50 ? '…' : ''}</p>}
                        </div>
                      </div>
                    </td>
                    <td>{product.category?.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>
                      <button
                        className={`availability-toggle ${product.isAvailable ? 'available' : 'unavailable'}`}
                        onClick={() => handleToggleAvailability(product.id)}
                        title="Clique para alternar"
                      >
                        {product.isAvailable ? 'Sim' : 'Não'}
                      </button>
                    </td>
                    <td>
                      <span className={`status-badge ${product.earnsPoints ? 'status-success' : 'status-muted'}`}>
                        {product.earnsPoints ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon" onClick={() => setProductModal({ open: true, item: product })} title="Editar">
                        <Edit2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Nenhum produto encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div className="product-name-cell">
                        {(cat.image_url || (cat as any).imageUrl)
                          ? <img src={cat.image_url || (cat as any).imageUrl} alt={cat.name} className="product-thumb" />
                          : <div className="product-thumb-placeholder"><Package size={16} /></div>
                        }
                        <span style={{ fontWeight: 500 }}>{cat.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{cat.description ?? '—'}</td>
                    <td>
                      <span className={`status-badge ${(cat.is_active ?? (cat as any).isActive) !== false ? 'status-success' : 'status-danger'}`}>
                        {(cat.is_active ?? (cat as any).isActive) !== false ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon" onClick={() => setCategoryModal({ open: true, item: cat })} title="Editar">
                        <Edit2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Nenhuma categoria encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modais */}
      {productModal.open && (
        <ProductModal
          product={productModal.item}
          categories={categories}
          onClose={() => setProductModal({ open: false, item: null })}
          onSaved={loadData}
        />
      )}
      {categoryModal.open && (
        <CategoryModal
          category={categoryModal.item}
          onClose={() => setCategoryModal({ open: false, item: null })}
          onSaved={loadData}
        />
      )}
    </div>
  )
}
