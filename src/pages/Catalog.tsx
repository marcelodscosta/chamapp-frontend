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
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (category) {
        await api.put(`/categories/${category.id}`, { name, description })
      } else {
        await api.post('/categories', { name, description })
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
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{category ? 'Editar Categoria' : 'Nova Categoria'}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-group">
            <label className="input-label">Nome</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Descrição (opcional)</label>
            <input className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="modal-footer">
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
  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price?.toString() ?? '',
    categoryId: product?.categoryId ?? '',
    imageUrl: product?.imageUrl ?? '',
    requiresEmptyReturn: product?.requiresEmptyReturn ?? false,
    earnsPoints: product?.earnsPoints ?? true,
    isAvailable: product?.isAvailable ?? true,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const body = {
        ...form,
        price: parseFloat(form.price),
        categoryId: form.categoryId || undefined,
        imageUrl: form.imageUrl || undefined,
      }
      if (product) {
        await api.put(`/products/${product.id}`, body)
      } else {
        await api.post('/products', body)
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
              <label className="input-label">URL da Imagem</label>
              <input className="input-field" type="url" value={form.imageUrl} onChange={(e) => handleChange('imageUrl', e.target.value)} placeholder="https://..." />
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
                        {product.imageUrl
                          ? <img src={product.imageUrl} alt={product.name} className="product-thumb" />
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
                    <td style={{ fontWeight: 500 }}>{cat.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{cat.description ?? '—'}</td>
                    <td>
                      <span className={`status-badge ${cat.isActive ? 'status-success' : 'status-danger'}`}>
                        {cat.isActive ? 'Ativa' : 'Inativa'}
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
