"use client"

import { useState, useEffect } from 'react'
import { AdminRouteGuard } from "@/components/admin-route-guard"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Archive,
  RotateCcw
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProductFormModal } from './components/product-form-modal'
import { StockAdjustmentModal } from './components/stock-adjustment-modal'
import { ProductStatus, Product, ProductStats, ProductFilters, isLowStock, isOutOfStock, calculateDiscountPercentage } from '@/lib/models/product'

interface LocalFilters {
  search: string
  category: string
  status: string
  lowStock: boolean
  page: number
  limit: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export default function AdminInventoryPage() {
  const { toast } = useToast()

  // State management
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<ProductStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  // Filters and pagination
  const [filters, setFilters] = useState<LocalFilters>({
    search: '',
    category: '',
    status: '',
    lowStock: false,
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [categories, setCategories] = useState<string[]>([])

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      setCategories(data.categories.map((cat: any) => cat.name))
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback to demo categories
      setCategories([
        'Electronics', 'Computers', 'Mobile', 'Home & Garden',
        'Sports', 'Fashion', 'Books', 'Health'
      ])
    }
  }

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.category) params.append('category', filters.category)
      if (filters.status) params.append('status', filters.status)
      if (filters.lowStock) params.append('lowStock', 'true')
      params.append('page', filters.page.toString())
      params.append('limit', filters.limit.toString())
      params.append('sortBy', filters.sortBy)
      params.append('sortOrder', filters.sortOrder)

      const response = await fetch(`/api/admin/inventory?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer mock-admin-token`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      setProducts(data.products.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) })))
      setStats(data.stats)
      setTotalPages(data.pagination.pages)
      setTotalProducts(data.pagination.total)

    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  // Refetch when filters change
  useEffect(() => {
    fetchProducts()
  }, [filters])

  // Handle filter changes
  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 for new filters
    }))
  }

  // Handle sort change
  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }))
  }

  // Handle product creation/edit
  const handleProductSave = async (productData: any) => {
    try {
      setActionLoading('save')

      const isEdit = !!selectedProduct
      const url = isEdit
        ? `/api/admin/inventory/${selectedProduct.id}`
        : '/api/admin/inventory'

      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock-admin-token`
        },
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save product')
      }

      toast({
        title: "Success",
        description: `Product ${isEdit ? 'updated' : 'created'} successfully`
      })

      setShowProductModal(false)
      setSelectedProduct(null)
      await fetchProducts()

    } catch (error: any) {
      console.error('Error saving product:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Handle stock adjustment
  const handleStockAdjustment = async (adjustmentData: any) => {
    try {
      setActionLoading('stock')

      const response = await fetch('/api/admin/inventory/adjust-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock-admin-token`
        },
        body: JSON.stringify({
          ...adjustmentData,
          adjustedBy: 'admin'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to adjust stock')
      }

      toast({
        title: "Success",
        description: "Stock adjusted successfully"
      })

      setShowStockModal(false)
      setSelectedProduct(null)
      await fetchProducts()

    } catch (error: any) {
      console.error('Error adjusting stock:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to adjust stock",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      setActionLoading('delete')

      const response = await fetch(`/api/admin/inventory/${productToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer mock-admin-token`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete product')
      }

      toast({
        title: "Success",
        description: "Product deleted successfully"
      })

      setShowDeleteDialog(false)
      setProductToDelete(null)
      await fetchProducts()

    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Get status badge color
  const getStatusBadge = (status: ProductStatus) => {
    const colors = {
      [ProductStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [ProductStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
      [ProductStatus.DRAFT]: 'bg-yellow-100 text-yellow-800',
      [ProductStatus.ARCHIVED]: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50/30">
        <AdminHeader />

        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600 mt-1">Manage your product catalog and stock levels</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSelectedProduct(null)
                  setShowProductModal(true)
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.active} active, {stats.inactive} inactive
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
                  <p className="text-xs text-muted-foreground">
                    Avg: {formatCurrency(stats.averagePrice)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.outOfStock} out of stock
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Draft Products</CardTitle>
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.draft}</div>
                  <p className="text-xs text-muted-foreground">
                    Need review
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select
                  value={filters.category || 'all'}
                  onValueChange={(value) => handleFilterChange('category', value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value={ProductStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={ProductStatus.INACTIVE}>Inactive</SelectItem>
                    <SelectItem value={ProductStatus.DRAFT}>Draft</SelectItem>
                    <SelectItem value={ProductStatus.ARCHIVED}>Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.lowStock ? 'true' : 'false'}
                  onValueChange={(value) => handleFilterChange('lowStock', value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Stock Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">All Stock Levels</SelectItem>
                    <SelectItem value="true">Low Stock Only</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => setFilters({
                    search: '',
                    category: '',
                    status: '',
                    lowStock: false,
                    page: 1,
                    limit: 20,
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                  })}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Products ({totalProducts})</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">
                    {filters.search || filters.category || filters.status
                      ? 'Try adjusting your filters or search terms.'
                      : 'Get started by adding your first product.'
                    }
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedProduct(null)
                      setShowProductModal(true)
                    }}
                  >
                    Add Product
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('name')}
                        >
                          Product {filters.sortBy === 'name' && (
                            filters.sortOrder === 'asc' ? '↑' : '↓'
                          )}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('sku')}
                        >
                          SKU {filters.sortBy === 'sku' && (
                            filters.sortOrder === 'asc' ? '↑' : '↓'
                          )}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('category')}
                        >
                          Category {filters.sortBy === 'category' && (
                            filters.sortOrder === 'asc' ? '↑' : '↓'
                          )}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('price')}
                        >
                          Price {filters.sortBy === 'price' && (
                            filters.sortOrder === 'asc' ? '↑' : '↓'
                          )}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('quantity')}
                        >
                          Stock {filters.sortBy === 'quantity' && (
                            filters.sortOrder === 'asc' ? '↑' : '↓'
                          )}
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('updatedAt')}
                        >
                          Updated {filters.sortBy === 'updatedAt' && (
                            filters.sortOrder === 'asc' ? '↑' : '↓'
                          )}
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              {product.images[0] && (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-500 truncate max-w-[200px]">
                                  {product.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {product.sku}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.category}</div>
                              {product.subcategory && (
                                <div className="text-sm text-gray-500">
                                  {product.subcategory}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(product.price)}</div>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <div className="text-sm text-gray-500 line-through">
                                  {formatCurrency(product.originalPrice)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                isOutOfStock(product) ? 'text-red-600' :
                                isLowStock(product) ? 'text-orange-600' :
                                'text-green-600'
                              }`}>
                                {product.quantity}
                              </span>
                              {isLowStock(product) && (
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(product.status)}>
                              {product.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(product.updatedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedProduct(product)
                                    setShowProductModal(true)
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedProduct(product)
                                    setShowStockModal(true)
                                  }}
                                >
                                  <TrendingUp className="mr-2 h-4 w-4" />
                                  Adjust Stock
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setProductToDelete(product)
                                    setShowDeleteDialog(true)
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-2 py-4">
                      <div className="text-sm text-gray-700">
                        Showing {((filters.page - 1) * filters.limit) + 1} to{' '}
                        {Math.min(filters.page * filters.limit, totalProducts)} of{' '}
                        {totalProducts} products
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFilterChange('page', filters.page - 1)}
                          disabled={filters.page === 1}
                        >
                          Previous
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const pageNum = filters.page <= 3
                              ? i + 1
                              : filters.page + i - 2

                            if (pageNum > totalPages) return null

                            return (
                              <Button
                                key={pageNum}
                                variant={pageNum === filters.page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleFilterChange('page', pageNum)}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFilterChange('page', filters.page + 1)}
                          disabled={filters.page === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ProductFormModal
        open={showProductModal}
        onOpenChange={setShowProductModal}
        product={selectedProduct}
        onSave={handleProductSave}
        loading={actionLoading === 'save'}
      />

      <StockAdjustmentModal
        open={showStockModal}
        onOpenChange={setShowStockModal}
        product={selectedProduct}
        onSave={handleStockAdjustment}
        loading={actionLoading === 'stock'}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{productToDelete?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading === 'delete'}
            >
              {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminRouteGuard>
  )
}
