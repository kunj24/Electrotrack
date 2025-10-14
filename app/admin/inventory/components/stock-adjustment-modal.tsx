"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Product, isLowStock, isOutOfStock } from '@/lib/models/product'
import {
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  AlertCircle,
  Loader2,
  AlertTriangle
} from "lucide-react"

interface StockAdjustmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSave: (adjustmentData: any) => Promise<void>
  loading: boolean
}

const adjustmentReasons = [
  'Received new stock',
  'Inventory correction',
  'Damaged goods',
  'Theft/Loss',
  'Quality control rejection',
  'Return to supplier',
  'Sample/Demo usage',
  'Promotional giveaway',
  'Internal use',
  'Other'
]

export function StockAdjustmentModal({
  open,
  onOpenChange,
  product,
  onSave,
  loading
}: StockAdjustmentModalProps) {
  const { toast } = useToast()

  // Form state
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease' | 'set'>('increase')
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (open && product) {
      setAdjustmentType('increase')
      setQuantity(0)
      setReason('')
      setCustomReason('')
      setNotes('')
      setErrors({})
    }
  }, [open, product])

  // Calculate new stock level
  const calculateNewStock = () => {
    if (!product) return 0

    switch (adjustmentType) {
      case 'increase':
        return product.quantity + quantity
      case 'decrease':
        return Math.max(0, product.quantity - quantity)
      case 'set':
        return quantity
      default:
        return product.quantity
    }
  }

  // Calculate quantity change for API
  const calculateQuantityChange = () => {
    if (!product) return 0

    const newStock = calculateNewStock()
    return newStock - product.quantity
  }

  // Get stock level status
  const getStockStatus = (stockLevel: number) => {
    if (!product) return { status: 'normal', color: 'text-green-600', label: 'Normal' }

    if (stockLevel === 0) {
      return { status: 'out-of-stock', color: 'text-red-600', label: 'Out of Stock' }
    } else if (stockLevel <= product.minStockLevel) {
      return { status: 'low-stock', color: 'text-orange-600', label: 'Low Stock' }
    } else if (stockLevel >= product.maxStockLevel) {
      return { status: 'overstock', color: 'text-purple-600', label: 'Overstock' }
    } else {
      return { status: 'normal', color: 'text-green-600', label: 'Normal' }
    }
  }

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative'
    }

    if (adjustmentType === 'decrease' && quantity > (product?.quantity || 0)) {
      newErrors.quantity = 'Cannot reduce stock below zero'
    }

    if (!reason && !customReason) {
      newErrors.reason = 'Please select or enter a reason for adjustment'
    }

    const finalReason = reason === 'Other' ? customReason : reason
    if (!finalReason.trim()) {
      newErrors.reason = 'Reason is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product || !validateForm()) {
      return
    }

    const finalReason = reason === 'Other' ? customReason : reason
    const quantityChange = calculateQuantityChange()

    const adjustmentData = {
      productId: product.id,
      quantityChange,
      reason: finalReason,
      notes: notes.trim() || undefined
    }

    await onSave(adjustmentData)
  }

  // Quick adjustment buttons
  const handleQuickAdjustment = (type: 'increase' | 'decrease', amount: number) => {
    setAdjustmentType(type)
    setQuantity(amount)
  }

  if (!product) return null

  const newStock = calculateNewStock()
  const stockStatus = getStockStatus(newStock)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Adjust Stock: {product.name}
          </DialogTitle>
          <DialogDescription>
            Current stock: <span className="font-semibold">{product.quantity}</span> units
            {isLowStock(product) && (
              <span className="text-orange-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3" />
                Low stock alert
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">SKU:</span>
                <span className="ml-2 font-mono">{product.sku}</span>
              </div>
              <div>
                <span className="text-gray-600">Current Stock:</span>
                <span className="ml-2 font-semibold">{product.quantity}</span>
              </div>
              <div>
                <span className="text-gray-600">Min Level:</span>
                <span className="ml-2">{product.minStockLevel}</span>
              </div>
              <div>
                <span className="text-gray-600">Max Level:</span>
                <span className="ml-2">{product.maxStockLevel}</span>
              </div>
            </div>
          </div>

          {/* Quick Adjustment Buttons */}
          <div className="space-y-3">
            <Label>Quick Adjustments</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700">Increase Stock</p>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 5, 10].map(amount => (
                    <Button
                      key={`increase-${amount}`}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdjustment('increase', amount)}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-700">Decrease Stock</p>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 5, 10].map(amount => (
                    <Button
                      key={`decrease-${amount}`}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdjustment('decrease', amount)}
                      className="flex items-center gap-1"
                      disabled={amount > product.quantity}
                    >
                      <Minus className="h-3 w-3" />
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Manual Adjustment */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adjustmentType">Adjustment Type</Label>
                <Select
                  value={adjustmentType}
                  onValueChange={(value) => {
                    setAdjustmentType(value as any)
                    setQuantity(0)
                    setErrors(prev => ({ ...prev, quantity: '' }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        Increase Stock
                      </div>
                    </SelectItem>
                    <SelectItem value="decrease">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        Decrease Stock
                      </div>
                    </SelectItem>
                    <SelectItem value="set">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        Set Exact Amount
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">
                  {adjustmentType === 'set' ? 'New Stock Level' : 'Quantity'}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(parseInt(e.target.value) || 0)
                    setErrors(prev => ({ ...prev, quantity: '' }))
                  }}
                  placeholder="Enter quantity"
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.quantity}
                  </p>
                )}
              </div>
            </div>

            {/* Stock Preview */}
            {quantity > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Stock Change Preview</p>
                    <p className="text-lg font-semibold">
                      {product.quantity} → {newStock}
                      <span className={`ml-2 text-sm ${
                        calculateQuantityChange() > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ({calculateQuantityChange() > 0 ? '+' : ''}{calculateQuantityChange()})
                      </span>
                    </p>
                  </div>
                  <Badge
                    className={`${
                      stockStatus.status === 'out-of-stock' ? 'bg-red-100 text-red-800' :
                      stockStatus.status === 'low-stock' ? 'bg-orange-100 text-orange-800' :
                      stockStatus.status === 'overstock' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}
                  >
                    {stockStatus.label}
                  </Badge>
                </div>

                {stockStatus.status === 'overstock' && (
                  <p className="text-sm text-purple-700 mt-2">
                    ⚠️ Warning: New stock level exceeds maximum threshold ({product.maxStockLevel})
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-3">
            <Label htmlFor="reason">Reason for Adjustment *</Label>
            <Select
              value={reason}
              onValueChange={(value) => {
                setReason(value)
                setErrors(prev => ({ ...prev, reason: '' }))
              }}
            >
              <SelectTrigger className={errors.reason ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {adjustmentReasons.map(reasonOption => (
                  <SelectItem key={reasonOption} value={reasonOption}>
                    {reasonOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {reason === 'Other' && (
              <Input
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value)
                  setErrors(prev => ({ ...prev, reason: '' }))
                }}
                placeholder="Enter custom reason"
                className={errors.reason ? 'border-red-500' : ''}
              />
            )}

            {errors.reason && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.reason}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details about this adjustment"
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || quantity <= 0}
              className="flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {adjustmentType === 'increase' && <TrendingUp className="h-4 w-4" />}
              {adjustmentType === 'decrease' && <TrendingDown className="h-4 w-4" />}
              {adjustmentType === 'set' && <Package className="h-4 w-4" />}
              Apply Adjustment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
