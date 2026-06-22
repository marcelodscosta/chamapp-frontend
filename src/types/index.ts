// ============================================================
// Tipos globais do ChamApp Admin Panel
// Espelha exatamente os modelos do backend (Prisma)
// ============================================================

// --- Enums ---
export type Role = 'ADMIN' | 'OPERATOR' | 'DELIVERY' | 'CUSTOMER'
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
export type PaymentMethod = 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD'
export type LoyaltyMode = 'POINTS' | 'CASHBACK'

// --- Auth ---
export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

// --- Category ---
export interface Category {
  id: string
  name: string
  description?: string
  imageUrl?: string
  isActive: boolean
  createdAt: string
}

// --- Product ---
export interface Product {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  isAvailable: boolean
  isActive: boolean
  requiresEmptyReturn: boolean
  earnsPoints: boolean
  pointsMultiplier?: number
  categoryId?: string
  category?: Category
  createdAt: string
}

// --- Address ---
export interface Address {
  id: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  latitude?: number
  longitude?: number
}

// --- Order Item ---
export interface OrderItem {
  id: string
  productId: string
  product: Product
  quantity: number
  unitPrice: number
  notes?: string
}

// --- Order ---
export interface Order {
  id: string
  customerId: string
  customer: AuthUser & { phone?: string }
  address: Address
  items: OrderItem[]
  status: OrderStatus
  paymentMethod: PaymentMethod
  subtotal: number
  deliveryFee: number
  total: number
  notes?: string
  hasEmptyCylinder: boolean
  changeFor?: number
  cancellationReason?: string
  is_scheduled: boolean
  scheduled_date?: string
  scheduled_time_slot?: string
  createdAt: string
  updatedAt: string
}

// --- User ---
export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: Role
  isActive: boolean
  createdAt: string
}

// --- Store Settings ---
export interface StoreSettings {
  id: string
  name: string
  phone?: string
  logo_url?: string
  address?: string
  delivery_fee: number
  free_delivery_above?: number
  min_order_value: number
  store_open: boolean
  opening_time?: string
  closing_time?: string
  operating_days?: { day: number; open: boolean; start?: string; end?: string }[]
  holidays?: string[]
}

// --- Loyalty ---
export interface LoyaltyConfig {
  id: string
  program_enabled: boolean
  program_mode: LoyaltyMode
  points_per_real: number
  conversion_rate: number
  min_points_to_redeem: number
  max_redeem_percent: number
  expiry_days?: number
  inactivity_days?: number
}

export interface LoyaltyTier {
  id: string
  name: string
  min_points: number
  multiplier: number
  color_hex?: string
  benefits?: string[]
  order: number
}

// --- Dashboard ---
export interface DashboardMetrics {
  totalRevenue: number
  totalOrders: number
  newCustomers: number
  averageTicket: number
  revenueByDay: { date: string; revenue: number }[]
  ordersByStatus: Record<string, number>  // ex: { PENDING: 3, DELIVERED: 10 }
}

// --- Pagination ---
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
