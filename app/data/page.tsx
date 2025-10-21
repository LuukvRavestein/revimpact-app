"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface ColumnMapping {
  [key: string]: string
}

interface ParsedData {
  headers: string[]
  rows: any[][]
  columnMapping: ColumnMapping
}

export default function DataPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setIsUploading(true)

    // Simulate file processing
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock CSV parsing (in real app, use a CSV parser library)
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    )

    // Initialize column mapping with default values
    const columnMapping: ColumnMapping = {}
    headers.forEach(header => {
      columnMapping[header] = 'unmapped'
    })

    setParsedData({
      headers,
      rows: rows.slice(0, 10), // Show first 10 rows for preview
      columnMapping
    })
    
    setIsUploading(false)
  }

  const handleColumnMapping = (header: string, mapping: string) => {
    if (!parsedData) return
    
    setParsedData({
      ...parsedData,
      columnMapping: {
        ...parsedData.columnMapping,
        [header]: mapping
      }
    })
  }

  const saveDataMapping = async () => {
    if (!parsedData) return
    
    setIsProcessing(true)
    
    // Simulate saving to database
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // In real implementation, save to Supabase
    console.log('Saving data mapping:', parsedData.columnMapping)
    
    setIsProcessing(false)
    alert('Data mapping saved successfully! You can now use this data in QBR and Dashboard.')
  }

  const columnMappingOptions = [
    { value: 'unmapped', label: 'Not used' },
    { value: 'customer_name', label: 'Customer Name' },
    { value: 'customer_email', label: 'Customer Email' },
    { value: 'company', label: 'Company' },
    { value: 'mrr', label: 'Monthly Recurring Revenue' },
    { value: 'churn_risk', label: 'Churn Risk' },
    { value: 'last_activity', label: 'Last Activity' },
    { value: 'support_tickets', label: 'Support Tickets' },
    { value: 'feature_usage', label: 'Feature Usage' },
    { value: 'industry', label: 'Industry' },
    { value: 'company_size', label: 'Company Size' },
    { value: 'contract_value', label: 'Contract Value' },
    { value: 'renewal_date', label: 'Renewal Date' }
  ]

  return (
    <main className="max-w-6xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Customer Data Management</h1>
          <p className="text-gray-600 mt-2">Upload and map your customer data for QBR and Dashboard</p>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary">← Back to Dashboard</Button>
        </Link>
      </div>

      {!parsedData ? (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Upload Customer Data</h2>
            <p className="text-gray-600">Upload Excel (.xlsx) or CSV files with your customer data</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="space-y-4">
                <div className="text-gray-500">
                  <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      {isUploading ? 'Processing file...' : 'Click to upload or drag and drop'}
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      Excel (.xlsx) or CSV files up to 10MB
                    </span>
                  </label>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="sr-only"
                    disabled={isUploading}
                  />
                </div>
                {uploadedFile && (
                  <p className="text-sm text-gray-600">
                    Selected: {uploadedFile.name}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Data Preview & Column Mapping</h2>
              <p className="text-gray-600">Map your columns to RevImpact data fields</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {parsedData.headers.map((header, index) => (
                    <div key={index} className="space-y-2">
                      <label className="block text-sm font-medium">
                        Column: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{header}</span>
                      </label>
                      <select
                        value={parsedData.columnMapping[header]}
                        onChange={(e) => handleColumnMapping(header, e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                      >
                        {columnMappingOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-3">Data Preview (first 10 rows)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          {parsedData.headers.map((header, index) => (
                            <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {parsedData.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-3 py-2 text-sm text-gray-900">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={saveDataMapping}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? 'Saving...' : 'Save Data Mapping'}
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => {
                      setParsedData(null)
                      setUploadedFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                  >
                    Upload New File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Next Steps</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/qbr">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h3 className="font-medium">Generate QBR</h3>
                    <p className="text-sm text-gray-600">Create Quarterly Business Reviews using your mapped data</p>
                  </div>
                </Link>
                <Link href="/dashboard">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h3 className="font-medium">View Dashboard</h3>
                    <p className="text-sm text-gray-600">See analytics and insights from your customer data</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
