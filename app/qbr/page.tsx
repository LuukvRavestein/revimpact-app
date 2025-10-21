"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

interface CustomerData {
  name: string
  email: string
  company: string
  mrr: string
  churnRisk: string
  lastActivity: string
  supportTickets: string
  featureUsage: string
}

export default function QBRPage() {
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "",
    email: "",
    company: "",
    mrr: "",
    churnRisk: "",
    lastActivity: "",
    supportTickets: "",
    featureUsage: ""
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedQBR, setGeneratedQBR] = useState<string | null>(null)

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }))
  }

  const generateQBR = async () => {
    setIsGenerating(true)
    
    // Simulate AI generation (replace with actual AI call later)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const qbrContent = `
# Quarterly Business Review - ${customerData.company}

**Customer:** ${customerData.name} (${customerData.email})  
**Period:** Q${Math.ceil(new Date().getMonth() / 3)} ${new Date().getFullYear()}

## Executive Summary
Based on the customer data analysis, ${customerData.company} shows ${customerData.churnRisk === "Low" ? "strong engagement" : "areas for improvement"} with a monthly recurring revenue of $${customerData.mrr}.

## Key Metrics
- **MRR:** $${customerData.mrr}
- **Churn Risk:** ${customerData.churnRisk}
- **Last Activity:** ${customerData.lastActivity}
- **Support Tickets:** ${customerData.supportTickets}
- **Feature Usage:** ${customerData.featureUsage}

## Recommendations
${customerData.churnRisk === "High" ? 
  "- Schedule immediate check-in call\n- Review onboarding process\n- Identify feature adoption blockers" :
  "- Continue current engagement strategy\n- Explore expansion opportunities\n- Maintain regular touchpoints"
}

## Next Steps
1. Schedule follow-up meeting
2. Review feature adoption metrics
3. Identify growth opportunities
    `
    
    setGeneratedQBR(qbrContent)
    setIsGenerating(false)
  }

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">QBR Generator</h1>
          <p className="text-gray-600 mt-2">Generate AI-powered Quarterly Business Reviews</p>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary">← Back to Dashboard</Button>
        </Link>
      </div>

      {!generatedQBR ? (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Customer Information</h2>
            <p className="text-gray-600">Enter customer data to generate a comprehensive QBR</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name</label>
                <Input
                  value={customerData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={customerData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <Input
                  value={customerData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Monthly Recurring Revenue</label>
                <Input
                  value={customerData.mrr}
                  onChange={(e) => handleInputChange("mrr", e.target.value)}
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Churn Risk</label>
                <select
                  value={customerData.churnRisk}
                  onChange={(e) => handleInputChange("churnRisk", e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select risk level</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Activity</label>
                <Input
                  value={customerData.lastActivity}
                  onChange={(e) => handleInputChange("lastActivity", e.target.value)}
                  placeholder="2 days ago"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Support Tickets (Last Quarter)</label>
              <Input
                value={customerData.supportTickets}
                onChange={(e) => handleInputChange("supportTickets", e.target.value)}
                placeholder="3 tickets, 2 resolved"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Feature Usage Notes</label>
              <Textarea
                value={customerData.featureUsage}
                onChange={(e) => handleInputChange("featureUsage", e.target.value)}
                placeholder="High usage of analytics features, low adoption of automation tools..."
                rows={3}
              />
            </div>

            <div className="pt-4">
              <Button 
                onClick={generateQBR}
                disabled={isGenerating || !customerData.name || !customerData.company}
                className="w-full"
              >
                {isGenerating ? "Generating QBR..." : "Generate QBR"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Generated QBR Report</h2>
              <div className="space-x-2">
                <Button 
                  variant="secondary" 
                  onClick={() => setGeneratedQBR(null)}
                >
                  Generate New
                </Button>
                <Button onClick={() => {
                  const blob = new Blob([generatedQBR], { type: 'text/markdown' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `QBR-${customerData.company}-${new Date().toISOString().split('T')[0]}.md`
                  a.click()
                }}>
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg">
                {generatedQBR}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
