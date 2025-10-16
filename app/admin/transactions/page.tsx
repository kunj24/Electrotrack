"use client"

import { AdminRouteGuard } from "@/components/admin-route-guard"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, Filter, Download, MoreHorizontal, Edit, Trash2, TrendingUp, TrendingDown, Calendar, RefreshCw, Activity } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  type: "income" | "expense"
  date: string
  notes?: string
  source: "online" | "offline" | "expense"
  createdAt: string
  updatedAt: string
}

export default function AdminTransactions() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")
  const [filterSource, setFilterSource] = useState<"all" | "online" | "offline" | "expense">("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  // Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/all-transactions')
      const data = await response.json()

      if (data.success) {
        setTransactions(data.transactions)
      } else {
        setError('Failed to fetch transactions')
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.notes && transaction.notes.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = filterType === "all" || transaction.type === filterType
    const matchesSource = filterSource === "all" || transaction.source === filterSource

    // Date range filtering
    let matchesDateRange = true
    if (startDate || endDate) {
      const transactionDate = new Date(transaction.date)
      if (startDate && endDate) {
        matchesDateRange = transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate)
      } else if (startDate) {
        matchesDateRange = transactionDate >= new Date(startDate)
      } else if (endDate) {
        matchesDateRange = transactionDate <= new Date(endDate)
      }
    }

    return matchesSearch && matchesFilter && matchesSource && matchesDateRange
  })

  const handleExportCSV = async () => {
    if (filteredTransactions.length === 0) {
      toast({
        title: "No data to export",
        description: "No transactions match your current filters.",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch('/api/admin/export-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: filteredTransactions,
          startDate,
          endDate,
          filterType
        })
      })

      const data = await response.json()

      if (data.success) {
        // Create and download the CSV file
        const blob = new Blob([data.csvContent], { 
          type: 'text/csv;charset=utf-8;' 
        })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', data.filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up the URL object
        URL.revokeObjectURL(url)

        toast({
          title: "Export successful!",
          description: `Downloaded ${data.summary.totalTransactions} transactions to ${data.filename}`
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export transactions",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const setDateRange = (range: 'thisMonth' | 'lastMonth' | 'thisYear' | 'last30Days') => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    switch (range) {
      case 'thisMonth':
        setStartDate(new Date(currentYear, currentMonth, 1).toISOString().split('T')[0])
        setEndDate(new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0])
        break
      case 'lastMonth':
        setStartDate(new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0])
        setEndDate(new Date(currentYear, currentMonth, 0).toISOString().split('T')[0])
        break
      case 'thisYear':
        setStartDate(new Date(currentYear, 0, 1).toISOString().split('T')[0])
        setEndDate(new Date(currentYear, 11, 31).toISOString().split('T')[0])
        break
      case 'last30Days':
        setStartDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        setEndDate(now.toISOString().split('T')[0])
        break
    }
  }

  const handleDelete = (id: string) => {
    // Delete functionality not implemented for MongoDB data
    toast({
      title: "Delete not available",
      description: "Delete functionality is not available for MongoDB transactions.",
      variant: "destructive"
    })
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="text-gray-600 mt-2">Manage all financial transactions</p>
            </div>
            <Button asChild>
              <Link href="/admin/transactions/manage">
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Link>
            </Button>
          </div>

          {/* Summary Stats */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Online Sales</p>
                      <p className="text-2xl font-bold text-green-600">
                        {transactions.filter(t => t.source === 'online').length}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Offline Sales</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {transactions.filter(t => t.source === 'offline').length}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        {transactions.filter(t => t.source === 'expense').length}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                {/* Search and Type Filter Row */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-auto">
                        <Filter className="h-4 w-4 mr-2" />
                        Source: {filterSource === "all" ? "All" : filterSource === "online" ? "Online Sales" : filterSource === "offline" ? "Offline Sales" : "Expenses"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Filter by Source</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setFilterSource("all")}>All Sources</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterSource("online")}>Online Sales</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterSource("offline")}>Offline Sales</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterSource("expense")}>Expenses</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Date Range and Export Row */}
                <div className="flex flex-col space-y-4">
                  {/* Quick Date Range Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setDateRange('thisMonth')}
                      className="text-xs"
                    >
                      This Month
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setDateRange('lastMonth')}
                      className="text-xs"
                    >
                      Last Month
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setDateRange('last30Days')}
                      className="text-xs"
                    >
                      Last 30 Days
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setDateRange('thisYear')}
                      className="text-xs"
                    >
                      This Year
                    </Button>
                  </div>
                  
                  {/* Custom Date Range and Export */}
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                      <div className="flex-1">
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                          From Date
                        </label>
                        <Input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                          To Date
                        </label>
                        <Input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setStartDate("")
                          setEndDate("")
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Clear Dates
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={fetchTransactions}
                        disabled={loading}
                        className="flex-1 sm:flex-none"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleExportCSV}
                        disabled={isExporting || filteredTransactions.length === 0}
                        className="flex-1 sm:flex-none"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? "Exporting..." : "Export CSV"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>
                {loading ? "Loading transactions..." : `${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? "s" : ""} found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading transactions...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={fetchTransactions} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : filteredTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((transaction, index) => (
                        <TableRow key={`${transaction.id}-${index}`}>
                          <TableCell>
                            <div className="font-medium">
                              {new Date(transaction.date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit', 
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{transaction.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{transaction.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary"
                              className={
                                transaction.source === "online" ? "bg-blue-100 text-blue-800" :
                                transaction.source === "offline" ? "bg-green-100 text-green-800" :
                                "bg-orange-100 text-orange-800"
                              }
                            >
                              {transaction.source === "online" ? "Online" :
                               transaction.source === "offline" ? "Offline" : "Expense"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {transaction.type === "income" ? (
                                <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 mr-2" />
                              )}
                              <Badge
                                variant={transaction.type === "income" ? "default" : "destructive"}
                                className={transaction.type === "income" ? "bg-green-100 text-green-800" : ""}
                              >
                                {transaction.type === "income" ? "Income" : "Expense"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            <span className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
                              {transaction.type === "income" ? "+" : "-"}₹{transaction.amount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/transactions/manage?edit=${transaction.id}`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(transaction.id)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    <TrendingUp className="h-12 w-12 mx-auto opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || filterType !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Get started by adding your first transaction"}
                  </p>
                  <Button asChild>
                    <Link href="/admin/transactions/manage">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Transaction
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </AdminRouteGuard>
  )
}
