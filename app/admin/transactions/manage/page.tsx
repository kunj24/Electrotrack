"use client"

import type React from "react"

import { AdminRouteGuard } from "@/components/admin-route-guard"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Plus, Edit } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function ManageTransaction() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    type: "expense" as "income" | "expense",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    source: "offline" as "offline" | "expense",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [transactionId, setTransactionId] = useState<string | null>(null)

  // Load transaction data for editing
  useEffect(() => {
    const editId = searchParams.get('edit')
    const editType = searchParams.get('type')
    const editSource = searchParams.get('source')

    if (editId && editType) {
      setIsEditing(true)
      setTransactionId(editId)
      loadTransactionForEdit(editId, editType)
    }

    // Set initial source based on URL parameter
    if (editSource) {
      setFormData(prev => ({ ...prev, source: editSource as "offline" | "expense" }))
    }
  }, [searchParams])

  const loadTransactionForEdit = async (id: string, type: string) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/all-transactions')
      const data = await response.json()

      if (data.success) {
        const transaction = data.transactions.find((t: any) => t.id === id)
        if (transaction) {
          setFormData({
            description: transaction.description || '',
            amount: transaction.amount.toString() || '',
            category: transaction.category || '',
            type: transaction.type || 'expense',
            date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            notes: transaction.notes || '',
            source: transaction.source === 'online' ? 'offline' : (transaction.source || 'offline')
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transaction for editing",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCategories = () => {
    if (formData.type === 'income') {
      return [
        "Offline Sales",
        "Repairs",
        "Services",
        "Consultation",
        "Installation",
        "Warranty Claims",
        "Other Income"
      ]
    } else {
      return [
        "Inventory Purchase",
        "Rent",
        "Utilities",
        "Marketing",
        "Staff Salary",
        "Equipment",
        "Maintenance",
        "Insurance",
        "Transportation",
        "Office Supplies",
        "Professional Services",
        "Taxes",
        "Bank Charges",
        "Other Expenses"
      ]
    }
  }

  const categories = getCategories()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0"
    }

    if (!formData.category) {
      newErrors.category = "Category is required"
    }

    if (!formData.date) {
      newErrors.date = "Date is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const transactionData = {
        description: formData.description.trim(),
        amount: Number.parseFloat(formData.amount),
        category: formData.category,
        type: formData.type,
        date: formData.date,
        notes: formData.notes.trim(),
        source: formData.source,
      }

      let response
      if (isEditing && transactionId) {
        // Update existing transaction
        response = await fetch('/api/admin/analytics', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: transactionId,
            ...transactionData
          }),
        })
      } else {
        // Create new transaction
        response = await fetch('/api/admin/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData),
        })
      }

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'save'} transaction`)
      }

      const result = await response.json()

      toast({
        title: isEditing ? "Transaction updated!" : "Transaction added!",
        description: `The transaction has been successfully ${isEditing ? 'updated' : 'saved'} in the database.`,
      })

      router.push("/admin/transactions")
    } catch (error) {
      console.error('Transaction save error:', error)
      toast({
        title: "Error",
        description: "Failed to save transaction to database. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button variant="ghost" asChild className="mr-4">
              <Link href="/admin/transactions">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Transactions
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
              </h1>
              <p className="text-gray-600 mt-2">
                {isEditing ? 'Update transaction information' : 'Enter transaction information'}
              </p>
            </div>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {isEditing ? <Edit className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                Transaction Details
              </CardTitle>
              <CardDescription>
                {isEditing ? 'Update the transaction information below' : 'Fill in the information below to add the transaction'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Transaction Type and Source */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="type">Transaction Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "income" | "expense") => {
                        handleInputChange("type", value)
                        // Reset category when type changes
                        handleInputChange("category", "")
                        // Auto-set source based on type
                        if (value === "income") {
                          handleInputChange("source", "offline")
                        } else {
                          handleInputChange("source", "expense")
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value: "offline" | "expense") => handleInputChange("source", value)}
                      disabled={formData.type === "expense"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.type === "income" ? (
                          <SelectItem value="offline">Offline Sale</SelectItem>
                        ) : (
                          <SelectItem value="expense">Expense</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => handleInputChange("amount", e.target.value)}
                      className={errors.amount ? "border-red-500" : ""}
                    />
                    {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount}</p>}
                  </div>
                </div>

                {/* Description and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Enter transaction description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className={errors.description ? "border-red-500" : ""}
                    />
                    {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className={errors.date ? "border-red-500" : ""}
                  />
                  {errors.date && <p className="text-sm text-red-600 mt-1">{errors.date}</p>}
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/admin/transactions">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isEditing ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        {isEditing ? 'Update Transaction' : 'Add Transaction'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        </main>
      </div>
    </AdminRouteGuard>
  )
}
