"use client"

import { useState, useEffect } from "react"

export interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  type: "income" | "expense"
  date: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Mock data for demonstration
const initialTransactions: Transaction[] = [
  {
    id: "1",
    description: "Samsung TV Sale",
    amount: 32999,
    category: "Sales",
    type: "income",
    date: "2024-01-15",
    notes: "43 inch Smart TV",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    description: "Store Rent",
    amount: 25000,
    category: "Rent",
    type: "expense",
    date: "2024-01-01",
    notes: "Monthly store rent payment",
    createdAt: "2024-01-01T09:00:00Z",
    updatedAt: "2024-01-01T09:00:00Z",
  },
  {
    id: "3",
    description: "LG AC Sale",
    amount: 28999,
    category: "Sales",
    type: "income",
    date: "2024-01-14",
    notes: "1.5 Ton Split AC",
    createdAt: "2024-01-14T14:20:00Z",
    updatedAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "4",
    description: "Electricity Bill",
    amount: 8500,
    category: "Utilities",
    type: "expense",
    date: "2024-01-10",
    createdAt: "2024-01-10T11:15:00Z",
    updatedAt: "2024-01-10T11:15:00Z",
  },
]

// Transaction store class for direct access (non-hook)
class TransactionStore {
  private transactions: Transaction[] = []

  constructor() {
    if (typeof window !== "undefined") {
      this.loadTransactions()
    }
  }

  private loadTransactions() {
    const stored = localStorage.getItem("radhika_transactions")
    if (stored) {
      this.transactions = JSON.parse(stored)
      this.fixDuplicateIds() // Clean up any duplicate IDs
    } else {
      this.transactions = initialTransactions
      this.saveTransactions()
    }
  }

  private fixDuplicateIds() {
    const seenIds = new Set<string>()
    const fixedTransactions: Transaction[] = []
    
    this.transactions.forEach((transaction, index) => {
      if (seenIds.has(transaction.id)) {
        // Generate new unique ID for duplicate
        const timestamp = Date.now() + index // Add index to ensure uniqueness
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const newId = `${timestamp}-${randomSuffix}`
        
        fixedTransactions.push({
          ...transaction,
          id: newId
        })
        seenIds.add(newId)
      } else {
        fixedTransactions.push(transaction)
        seenIds.add(transaction.id)
      }
    })
    
    if (fixedTransactions.length !== this.transactions.length || 
        fixedTransactions.some((t, i) => t.id !== this.transactions[i].id)) {
      this.transactions = fixedTransactions
      this.saveTransactions() // Save the cleaned up data
      console.log('Fixed duplicate transaction IDs')
    }
  }

  private saveTransactions() {
    if (typeof window !== "undefined") {
      localStorage.setItem("radhika_transactions", JSON.stringify(this.transactions))
    }
  }

  addTransaction(data: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Transaction {
    // Generate a more unique ID using timestamp + random string
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const uniqueId = `${timestamp}-${randomSuffix}`
    
    const newTransaction: Transaction = {
      ...data,
      id: uniqueId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.transactions = [newTransaction, ...this.transactions]
    this.saveTransactions()
    return newTransaction
  }

  addOnlineSale(orderData: {
    description: string
    category: string
    amount: number
    paymentMethod: string
    customer: string
    orderId: string
  }): Transaction {
    const transaction = this.addTransaction({
      description: `${orderData.description} - ${orderData.customer}`,
      amount: orderData.amount,
      category: "Online Sales",
      type: "income",
      date: new Date().toISOString().split("T")[0],
      notes: `Order ID: ${orderData.orderId}, Payment: ${orderData.paymentMethod}, Customer: ${orderData.customer}`,
    })
    return transaction
  }

  getTransactions(): Transaction[] {
    return this.transactions
  }

  getStats() {
    const totalRevenue = this.transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = this.transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      totalTransactions: this.transactions.length,
    }
  }
}

// Create singleton instance
export const transactionStore = new TransactionStore()

// Helper function to fix duplicate IDs
function fixDuplicateIds(transactions: Transaction[]): Transaction[] {
  const seenIds = new Set<string>()
  const fixedTransactions: Transaction[] = []
  
  transactions.forEach((transaction, index) => {
    if (seenIds.has(transaction.id)) {
      // Generate new unique ID for duplicate
      const timestamp = Date.now() + index // Add index to ensure uniqueness
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const newId = `${timestamp}-${randomSuffix}`
      
      fixedTransactions.push({
        ...transaction,
        id: newId
      })
      seenIds.add(newId)
    } else {
      fixedTransactions.push(transaction)
      seenIds.add(transaction.id)
    }
  })
  
  return fixedTransactions
}

// React hook for components
export function useTransactionStore() {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    // Load from localStorage or use initial data
    const stored = localStorage.getItem("radhika_transactions")
    if (stored) {
      const loadedTransactions = JSON.parse(stored)
      // Fix any duplicate IDs
      const fixedTransactions = fixDuplicateIds(loadedTransactions)
      setTransactions(fixedTransactions)
      
      // Save back if we made changes
      if (fixedTransactions !== loadedTransactions) {
        localStorage.setItem("radhika_transactions", JSON.stringify(fixedTransactions))
      }
    } else {
      setTransactions(initialTransactions)
    }
  }, [])

  useEffect(() => {
    // Save to localStorage whenever transactions change
    if (transactions.length > 0) {
      localStorage.setItem("radhika_transactions", JSON.stringify(transactions))
    }
  }, [transactions])

  const addTransaction = (data: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => {
    // Generate a more unique ID using timestamp + random string
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const uniqueId = `${timestamp}-${randomSuffix}`
    
    const newTransaction: Transaction = {
      ...data,
      id: uniqueId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setTransactions((prev) => [newTransaction, ...prev])
    return newTransaction
  }

  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === id ? { ...transaction, ...data, updatedAt: new Date().toISOString() } : transaction,
      ),
    )
  }

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((transaction) => transaction.id !== id))
  }

  const getStats = () => {
    const totalRevenue = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      totalTransactions: transactions.length,
    }
  }

  return {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getStats,
  }
}
