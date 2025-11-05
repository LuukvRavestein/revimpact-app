"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useLanguage } from "@/contexts/LanguageContext"
import { createSupabaseBrowserClient } from "@/lib/supabaseClient"
// import { Input } from "@/components/ui/input" // Will be used later
import Link from "next/link"

interface ColumnMapping {
  [key: string]: string
}

interface ParsedData {
  headers: string[]
  rows: string[][]
  columnMapping: ColumnMapping
}

export default function DataPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useLanguage()
  const supabase = createSupabaseBrowserClient()

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<Array<{originalColumn: string; suggestedField: string; confidence: number; reasoning: string}>>([])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setIsUploading(true)
    setIsAnalyzing(true)

    try {
      // Parse CSV file
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const rows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      ).filter(row => row.some(cell => cell)) // Filter empty rows

      // Get workspace ID
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        alert('Please sign in to upload data')
        setIsUploading(false)
        setIsAnalyzing(false)
        return
      }

      // Get user's workspace
      const { data: workspaceData } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', session.user.id)
        .limit(1)
        .single()

      const workspaceId = workspaceData?.workspace_id || ''

      // Call AI to analyze columns and suggest mappings
      const response = await fetch('/api/ai/map-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers,
          sampleRows: rows.slice(0, 20), // Send first 20 rows for analysis
          workspaceId
        })
      })

      const initialMapping: ColumnMapping = {}

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.suggestions) {
          // Initialize mapping with AI suggestions (only high confidence)
          headers.forEach(header => {
            const suggestion = result.suggestions.find((s: {originalColumn: string; suggestedField: string; confidence: number}) => s.originalColumn === header)
            if (suggestion && suggestion.confidence > 0.6) {
              initialMapping[header] = suggestion.suggestedField
            } else {
              initialMapping[header] = 'unmapped'
            }
          })
          setAiSuggestions(result.suggestions)
        } else {
          // Fallback: initialize with unmapped
          headers.forEach(header => {
            initialMapping[header] = 'unmapped'
          })
        }
      } else {
        // Fallback if AI fails
        headers.forEach(header => {
          initialMapping[header] = 'unmapped'
        })
      }

      setParsedData({
        headers,
        rows: rows.slice(0, 10), // Show first 10 rows for preview
        columnMapping: initialMapping
      })
    } catch (error) {
      console.error('File upload error:', error)
      alert('Error processing file. Please try again.')
    } finally {
      setIsUploading(false)
      setIsAnalyzing(false)
    }
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
    alert(t.dataUpload.saveMapping + ' - ' + t.dataUpload.nextSteps)
  }

  const columnMappingOptions = [
    { value: 'unmapped', label: t.dataUpload.columnMapping },
    { value: 'customer_name', label: t.qbrGenerator.customerName },
    { value: 'customer_email', label: t.qbrGenerator.email },
    { value: 'company', label: t.qbrGenerator.company },
    { value: 'mrr', label: t.qbrGenerator.mrr },
    { value: 'churn_risk', label: t.qbrGenerator.churnRisk },
    { value: 'last_activity', label: t.qbrGenerator.lastActivity },
    { value: 'support_tickets', label: t.qbrGenerator.supportTickets },
    { value: 'feature_usage', label: t.qbrGenerator.featureUsage },
    { value: 'industry', label: 'Industry' },
    { value: 'company_size', label: 'Company Size' },
    { value: 'contract_value', label: 'Contract Value' },
    { value: 'renewal_date', label: 'Renewal Date' }
  ]

  return (
    <main className="max-w-6xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t.dataUpload.title}</h1>
          <p className="text-gray-600 mt-2">{t.dataUpload.subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <Link href="/dashboard">
            <Button variant="secondary">← {t.back} {t.navDashboard}</Button>
          </Link>
        </div>
      </div>

      {!parsedData ? (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">{t.dataUpload.uploadTitle}</h2>
            <p className="text-gray-600">{t.dataUpload.uploadSubtitle}</p>
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
                      {isUploading ? t.loading : t.dataUpload.dragDrop}
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      {t.dataUpload.fileTypes}
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
                    {t.dataUpload.selectedFile}: {uploadedFile.name}
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
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{t.dataUpload.columnMapping}</h2>
                  <p className="text-gray-600">{t.dataUpload.columnMappingSubtitle}</p>
                </div>
                {isAnalyzing && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>AI analyseert kolommen...</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiSuggestions.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-blue-900">AI Suggesties Geladen</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          AI heeft de kolommen geanalyseerd en automatische mapping voorstellen gedaan. 
                          Je kunt deze aanpassen indien nodig.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {parsedData.headers.map((header, index) => {
                    const suggestion = aiSuggestions.find(s => s.originalColumn === header)
                    const confidence = suggestion?.confidence || 0
                    const isHighConfidence = confidence > 0.7
                    const isMediumConfidence = confidence > 0.5 && confidence <= 0.7
                    
                    return (
                      <div key={index} className="space-y-2">
                        <label className="block text-sm font-medium">
                          Column: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{header}</span>
                          {suggestion && (
                            <span className={`ml-2 text-xs px-2 py-1 rounded ${
                              isHighConfidence 
                                ? 'bg-green-100 text-green-800' 
                                : isMediumConfidence
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {isHighConfidence ? '✓ Hoog' : isMediumConfidence ? '~ Gemiddeld' : '? Laag'} ({Math.round(confidence * 100)}%)
                            </span>
                          )}
                        </label>
                        {suggestion && suggestion.reasoning && (
                          <p className="text-xs text-gray-500 italic">{suggestion.reasoning}</p>
                        )}
                        <select
                          value={parsedData.columnMapping[header]}
                          onChange={(e) => handleColumnMapping(header, e.target.value)}
                          className={`w-full p-2 border rounded-md text-sm ${
                            isHighConfidence && parsedData.columnMapping[header] === suggestion?.suggestedField
                              ? 'border-green-300 bg-green-50'
                              : ''
                          }`}
                        >
                          {columnMappingOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-3">{t.dataUpload.dataPreview}</h3>
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
                    {isProcessing ? t.loading : t.dataUpload.saveMapping}
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
                    {t.dataUpload.uploadNew}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">{t.dataUpload.nextSteps}</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/qbr">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h3 className="font-medium">{t.dataUpload.generateQbr}</h3>
                    <p className="text-sm text-gray-600">{t.dataUpload.qbrDescription}</p>
                  </div>
                </Link>
                <Link href="/dashboard">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h3 className="font-medium">{t.dataUpload.viewDashboard}</h3>
                    <p className="text-sm text-gray-600">{t.dataUpload.dashboardDescription}</p>
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
