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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ProductStatus } from '@/lib/models/product'
import { Product } from '@/lib/models/product'
import {
  Plus,
  X,
  Upload,
  Loader2,
  ImageIcon,
  AlertCircle
} from "lucide-react"

interface ProductFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSave: (productData: any) => Promise<void>
  loading: boolean
}

const categories = [
  'Electronics', 'Computers', 'Mobile', 'Home & Garden',
  'Sports', 'Fashion', 'Books', 'Health', 'Automotive', 'Beauty'
]

const subcategories: Record<string, string[]> = {
  'Electronics': ['Audio', 'Cameras', 'Gaming', 'Smart Home', 'Wearables'],
  'Computers': ['Laptops', 'Desktops', 'Components', 'Accessories', 'Software'],
  'Mobile': ['Smartphones', 'Tablets', 'Accessories', 'Cases', 'Chargers'],
  'Home & Garden': ['Furniture', 'Decor', 'Kitchen', 'Garden', 'Storage'],
  'Sports': ['Fitness', 'Outdoor', 'Team Sports', 'Water Sports', 'Winter Sports'],
  'Fashion': ['Men', 'Women', 'Kids', 'Shoes', 'Accessories'],
  'Books': ['Fiction', 'Non-Fiction', 'Educational', 'Children', 'Comics'],
  'Health': ['Supplements', 'Medical', 'Personal Care', 'Fitness', 'Wellness']
}

export function ProductFormModal({
  open,
  onOpenChange,
  product,
  onSave,
  loading
}: ProductFormModalProps) {
  const { toast } = useToast()
  const isEdit = !!product

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    quantity: 0,
    category: '',
    subcategory: '',
    brand: '',
    status: ProductStatus.ACTIVE,
    images: [] as string[],
    specifications: {} as Record<string, string>,
    features: [] as string[],
    minStockLevel: 10,
    maxStockLevel: 1000,
    isFeatured: false,
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0
    },
    tags: [] as string[],
    seoTitle: '',
    seoDescription: ''
  })

  // Form section state
  const [activeSection, setActiveSection] = useState<'basic' | 'inventory' | 'seo' | 'media'>('basic')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newFeature, setNewFeature] = useState('')
  const [newTag, setNewTag] = useState('')
  const [newSpecKey, setNewSpecKey] = useState('')
  const [newSpecValue, setNewSpecValue] = useState('')

  // Load product data when editing
  useEffect(() => {
    if (product && open) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        originalPrice: product.originalPrice || 0,
        quantity: product.quantity || 0,
        category: product.category || '',
        subcategory: product.subcategory || '',
        brand: product.brand || '',
        status: product.status || ProductStatus.ACTIVE,
        images: product.images || [],
        specifications: product.specifications || {},
        features: product.features || [],
        minStockLevel: product.minStockLevel || 10,
        maxStockLevel: product.maxStockLevel || 1000,
        isFeatured: product.isFeatured || false,
        weight: product.weight || 0,
        dimensions: product.dimensions || { length: 0, width: 0, height: 0 },
        tags: product.tags || [],
        seoTitle: product.seoTitle || '',
        seoDescription: product.seoDescription || ''
      })
    } else if (!product && open) {
      // Reset form for new product
      setFormData({
        name: '',
        description: '',
        price: 0,
        originalPrice: 0,
        quantity: 0,
        category: '',
        subcategory: '',
        brand: '',
        status: ProductStatus.ACTIVE,
        images: [],
        specifications: {},
        features: [],
        minStockLevel: 10,
        maxStockLevel: 1000,
        isFeatured: false,
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        tags: [],
        seoTitle: '',
        seoDescription: ''
      })
    }
    setErrors({})
    setActiveSection('basic')
  }, [product, open])

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0'
    if (formData.quantity < 0) newErrors.quantity = 'Quantity cannot be negative'
    if (!formData.category) newErrors.category = 'Category is required'
    if (formData.minStockLevel < 0) newErrors.minStockLevel = 'Min stock level cannot be negative'
    if (formData.maxStockLevel <= formData.minStockLevel) {
      newErrors.maxStockLevel = 'Max stock level must be greater than min stock level'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      })
      return
    }

    // Clean up data before submission
    const submitData = {
      ...formData,
      price: Number(formData.price),
      originalPrice: formData.originalPrice > 0 ? Number(formData.originalPrice) : undefined,
      quantity: Number(formData.quantity),
      minStockLevel: Number(formData.minStockLevel),
      maxStockLevel: Number(formData.maxStockLevel),
      weight: formData.weight > 0 ? Number(formData.weight) : undefined,
      dimensions: (formData.dimensions.length > 0 && formData.dimensions.width > 0 && formData.dimensions.height > 0)
        ? formData.dimensions
        : undefined
    }

    await onSave(submitData)
  }

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  // Add image URL
  const addImageUrl = () => {
    if (newImageUrl.trim() && !formData.images.includes(newImageUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }))
      setNewImageUrl('')
    }
  }

  // Remove image
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  // Add feature
  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature('')
    }
  }

  // Remove feature
  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  // Remove tag
  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }))
  }

  // Add specification
  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [newSpecKey.trim()]: newSpecValue.trim()
        }
      }))
      setNewSpecKey('')
      setNewSpecValue('')
    }
  }

  // Remove specification
  const removeSpecification = (key: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: Object.fromEntries(
        Object.entries(prev.specifications).filter(([k]) => k !== key)
      )
    }))
  }

  const sections = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'media', label: 'Media' },
    { id: 'seo', label: 'SEO' }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit Product: ${product?.name}` : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the product information below.'
              : 'Fill in the details to create a new product.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6 overflow-hidden">
          {/* Section Navigation */}
          <div className="w-40 flex-shrink-0">
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id as any)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              {activeSection === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter product name"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter detailed product description"
                      rows={4}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => {
                          handleInputChange('category', value)
                          handleInputChange('subcategory', '') // Reset subcategory
                        }}
                      >
                        <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.category}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="subcategory">Subcategory</Label>
                      <Select
                        value={formData.subcategory}
                        onValueChange={(value) => handleInputChange('subcategory', value)}
                        disabled={!formData.category}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.category && subcategories[formData.category]?.map(subcategory => (
                            <SelectItem key={subcategory} value={subcategory}>
                              {subcategory}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        placeholder="Enter brand name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price">Price (₹) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className={errors.price ? 'border-red-500' : ''}
                      />
                      {errors.price && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.price}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="originalPrice">Original Price (₹)</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.originalPrice}
                        onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleInputChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ProductStatus.ACTIVE}>Active</SelectItem>
                          <SelectItem value={ProductStatus.INACTIVE}>Inactive</SelectItem>
                          <SelectItem value={ProductStatus.DRAFT}>Draft</SelectItem>
                          <SelectItem value={ProductStatus.ARCHIVED}>Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <Label>Features</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="Add a feature"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      />
                      <Button type="button" onClick={addFeature} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {feature}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeFeature(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Specifications */}
                  <div>
                    <Label>Specifications</Label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Input
                        value={newSpecKey}
                        onChange={(e) => setNewSpecKey(e.target.value)}
                        placeholder="Specification name"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={newSpecValue}
                          onChange={(e) => setNewSpecValue(e.target.value)}
                          placeholder="Value"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecification())}
                        />
                        <Button type="button" onClick={addSpecification} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(formData.specifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm">
                            <strong>{key}:</strong> {value}
                          </span>
                          <X
                            className="h-4 w-4 cursor-pointer text-gray-400 hover:text-red-500"
                            onClick={() => removeSpecification(key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Management */}
              {activeSection === 'inventory' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="quantity">Current Stock *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                        className={errors.quantity ? 'border-red-500' : ''}
                      />
                      {errors.quantity && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.quantity}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="minStockLevel">Min Stock Level *</Label>
                      <Input
                        id="minStockLevel"
                        type="number"
                        min="0"
                        value={formData.minStockLevel}
                        onChange={(e) => handleInputChange('minStockLevel', parseInt(e.target.value) || 0)}
                        className={errors.minStockLevel ? 'border-red-500' : ''}
                      />
                      {errors.minStockLevel && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.minStockLevel}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="maxStockLevel">Max Stock Level *</Label>
                      <Input
                        id="maxStockLevel"
                        type="number"
                        min="1"
                        value={formData.maxStockLevel}
                        onChange={(e) => handleInputChange('maxStockLevel', parseInt(e.target.value) || 0)}
                        className={errors.maxStockLevel ? 'border-red-500' : ''}
                      />
                      {errors.maxStockLevel && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.maxStockLevel}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFeatured"
                        checked={formData.isFeatured}
                        onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                      />
                      <Label htmlFor="isFeatured">Featured Product</Label>
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div>
                    <Label>Dimensions (cm)</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.dimensions.length}
                          onChange={(e) => handleInputChange('dimensions', {
                            ...formData.dimensions,
                            length: parseFloat(e.target.value) || 0
                          })}
                          placeholder="Length"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.dimensions.width}
                          onChange={(e) => handleInputChange('dimensions', {
                            ...formData.dimensions,
                            width: parseFloat(e.target.value) || 0
                          })}
                          placeholder="Width"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.dimensions.height}
                          onChange={(e) => handleInputChange('dimensions', {
                            ...formData.dimensions,
                            height: parseFloat(e.target.value) || 0
                          })}
                          placeholder="Height"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <Label>Tags</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeTag(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Media */}
              {activeSection === 'media' && (
                <div className="space-y-4">
                  <div>
                    <Label>Product Images</Label>
                    <div className="flex gap-2 mb-4">
                      <Input
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Enter image URL"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                      />
                      <Button type="button" onClick={addImageUrl} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {formData.images.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-32 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-image.png'
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            {index === 0 && (
                              <Badge className="absolute bottom-2 left-2">Primary</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No images added yet</p>
                        <p className="text-sm text-gray-500">Add image URLs to display product photos</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SEO */}
              {activeSection === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="seoTitle">SEO Title</Label>
                    <Input
                      id="seoTitle"
                      value={formData.seoTitle}
                      onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                      placeholder="SEO optimized title (60 characters max)"
                      maxLength={60}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.seoTitle.length}/60 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="seoDescription">SEO Description</Label>
                    <Textarea
                      id="seoDescription"
                      value={formData.seoDescription}
                      onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                      placeholder="SEO meta description (160 characters max)"
                      maxLength={160}
                      rows={3}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.seoDescription.length}/160 characters
                    </p>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEdit ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
