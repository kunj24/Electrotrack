import { z } from 'zod'
import { ObjectId } from 'mongodb'

// Product status enum
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  ARCHIVED = 'archived'
}

// Base product schema for validation
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  price: z.number().positive('Price must be positive').max(999999.99, 'Price too high'),
  originalPrice: z.number().positive().optional(),
  quantity: z.number().int().min(0, 'Quantity cannot be negative').max(999999, 'Quantity too high'),
  category: z.string().min(1, 'Category is required').max(100, 'Category too long'),
  subcategory: z.string().max(100, 'Subcategory too long').optional(),
  brand: z.string().max(100, 'Brand too long').optional(),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.ACTIVE),
  images: z.array(z.string().url('Invalid image URL')).max(10, 'Too many images').default([]),
  specifications: z.record(z.string()).optional(),
  features: z.array(z.string()).max(20, 'Too many features').optional(),
  minStockLevel: z.number().int().min(0, 'Min stock level cannot be negative').default(10),
  maxStockLevel: z.number().int().min(1, 'Max stock level must be positive').default(1000),
  isFeatured: z.boolean().default(false),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive()
  }).optional(),
  tags: z.array(z.string()).max(20, 'Too many tags').default([]),
  seoTitle: z.string().max(60, 'SEO title too long').optional(),
  seoDescription: z.string().max(160, 'SEO description too long').optional()
})

// Product creation schema (excludes auto-generated fields)
export const createProductSchema = productSchema.omit({})

// Product update schema (all fields optional except id)
export const updateProductSchema = productSchema.partial().extend({
  id: z.string().min(1, 'Product ID is required')
})

// Stock adjustment schema
export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantityChange: z.number().int('Quantity change must be an integer'),
  reason: z.string().min(1, 'Reason is required').max(200, 'Reason too long'),
  notes: z.string().max(500, 'Notes too long').optional(),
  adjustedBy: z.string().min(1, 'Adjusted by is required')
})

// Product interface for TypeScript
export interface Product {
  _id?: ObjectId
  id?: string
  name: string
  description: string
  price: number
  originalPrice?: number
  quantity: number
  category: string
  subcategory?: string
  brand?: string
  status: ProductStatus
  images: string[]
  specifications?: Record<string, string>
  features?: string[]
  minStockLevel: number
  maxStockLevel: number
  isFeatured: boolean
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  tags: string[]
  seoTitle?: string
  seoDescription?: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  createdBy: string
  updatedBy: string
}

// Stock movement interface for audit trail
export interface StockMovement {
  _id?: ObjectId
  id?: string
  productId: string
  type: 'in' | 'out' | 'adjustment' | 'sale' | 'return'
  quantity: number
  previousQuantity: number
  newQuantity: number
  reason: string
  notes?: string
  adjustedBy: string
  createdAt: Date
  orderId?: string
  reference?: string
}

// Product filters interface
export interface ProductFilters {
  search?: string
  category?: string
  subcategory?: string
  brand?: string
  status?: ProductStatus
  minPrice?: number
  maxPrice?: number
  lowStock?: boolean
  featured?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Product statistics interface
export interface ProductStats {
  total: number
  active: number
  inactive: number
  draft: number
  archived: number
  lowStock: number
  outOfStock: number
  totalValue: number
  averagePrice: number
}

// Validation helper functions
export function isLowStock(product: Product): boolean {
  return product.quantity <= product.minStockLevel
}

export function isOutOfStock(product: Product): boolean {
  return product.quantity === 0
}

export function calculateDiscountPercentage(product: Product): number {
  if (!product.originalPrice || product.originalPrice <= product.price) {
    return 0
  }
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
}

// Database indexes for MongoDB
export const productIndexes = [
  { key: { name: 1 } },
  { key: { category: 1, subcategory: 1 } },
  { key: { status: 1 } },
  { key: { createdAt: -1 } },
  { key: { quantity: 1 } },
  { key: { price: 1 } },
  { key: { deletedAt: 1 }, sparse: true },
  { key: { name: 'text', description: 'text' } }
]

export const stockMovementIndexes = [
  { key: { productId: 1, createdAt: -1 } },
  { key: { type: 1 } },
  { key: { adjustedBy: 1 } },
  { key: { createdAt: -1 } }
]
