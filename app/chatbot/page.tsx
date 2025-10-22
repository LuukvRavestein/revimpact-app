"use client";
import { useState, useRef } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import * as XLSX from 'xlsx';

interface ChatbotData {
  conversation_id: string;
  user_id: string;
  cu_id: string;
  label: string;
  content: string;
  type: string;
  username: string;
  timestamp: string;
}

interface ProcessedData {
  totalQuestions: number;
  uniqueCustomers: number;
  selfResolvedPercentage: number;
  forwardedPercentage: number;
  averageSatisfaction: number;
  weeklyTrends: Array<{ week: string; questions: number }>;
  topCustomers: Array<{
    customer: string;
    questions: number;
    selfResolved: number;
    forwarded: number;
    satisfaction: number;
  }>;
  topTopics: Array<{ topic: string; count: number }>;
  forwardedTickets: Array<{
    customer: string;
    content: string;
    timestamp: string;
  }>;
}

export default function ChatbotPage() {
  const { t } = useLanguage();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setError(null);
      processExcelFile(file);
    }
  };

  const processExcelFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ChatbotData[];

      const processed = processChatbotData(jsonData);
      setProcessedData(processed);
    } catch (err) {
      setError(t.chatbot.errorProcessing);
      console.error("Error processing file:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const processChatbotData = (data: ChatbotData[]): ProcessedData => {
    console.log('Processing data:', data.length, 'rows');
    
    // Filter user questions
    const userQuestions = data.filter(row => 
      row.label === 'USER' || row.type === 'USER'
    );
    console.log('User questions found:', userQuestions.length);

    // Extract customer names from username JSON
    const customerMap = new Map<string, string>();
    data.forEach(row => {
      try {
        const userInfo = JSON.parse(row.username);
        if (userInfo.clientName) {
          customerMap.set(row.user_id, userInfo.clientName);
        }
      } catch {
        // Skip invalid JSON
      }
    });
    console.log('Customers found:', customerMap.size);

    // Calculate basic metrics
    const totalQuestions = userQuestions.length;
    const uniqueCustomers = new Set(customerMap.values()).size;

    // Analyze conversation flows to determine resolution
    const conversationMap = new Map<string, ChatbotData[]>();
    data.forEach(row => {
      if (!conversationMap.has(row.conversation_id)) {
        conversationMap.set(row.conversation_id, []);
      }
      conversationMap.get(row.conversation_id)!.push(row);
    });

    // Analyze each conversation to determine if it was self-resolved
    let selfResolvedCount = 0;
    let forwardedCount = 0;
    let totalSatisfaction = 0;
    let satisfactionCount = 0;

    conversationMap.forEach((messages, conversationId) => {
      const sortedMessages = messages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const userMessages = sortedMessages.filter(m => m.label === 'USER' || m.type === 'USER');
      const assistantMessages = sortedMessages.filter(m => m.label === 'ASSISTANT' || m.type === 'ASSISTANT');
      
      if (userMessages.length > 0) {
        // Check if conversation seems resolved by looking at patterns
        const lastUserMessage = userMessages[userMessages.length - 1];
        const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
        
        // Simple heuristic: if assistant responded after user's last message, consider it resolved
        if (lastAssistantMessage && 
            new Date(lastAssistantMessage.timestamp) > new Date(lastUserMessage.timestamp)) {
          selfResolvedCount++;
        } else {
          forwardedCount++;
        }
        
        // Look for satisfaction indicators in content (simple keyword matching)
        const allContent = messages.map(m => m.content.toLowerCase()).join(' ');
        if (allContent.includes('thank') || allContent.includes('bedankt') || 
            allContent.includes('perfect') || allContent.includes('great') ||
            allContent.includes('helpful') || allContent.includes('nuttig')) {
          totalSatisfaction += 4.5;
          satisfactionCount++;
        } else if (allContent.includes('not helpful') || allContent.includes('niet nuttig') ||
                   allContent.includes('wrong') || allContent.includes('fout')) {
          totalSatisfaction += 2.0;
          satisfactionCount++;
        } else {
          totalSatisfaction += 3.5; // Default neutral satisfaction
          satisfactionCount++;
        }
      }
    });

    const selfResolvedPercentage = totalQuestions > 0 ? Math.round((selfResolvedCount / totalQuestions) * 100) : 0;
    const forwardedPercentage = totalQuestions > 0 ? Math.round((forwardedCount / totalQuestions) * 100) : 0;
    const averageSatisfaction = satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 3.5;

    // Weekly trends
    const weeklyData = new Map<string, number>();
    userQuestions.forEach(q => {
      const date = new Date(q.timestamp);
      const week = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
      weeklyData.set(week, (weeklyData.get(week) || 0) + 1);
    });

    const weeklyTrends = Array.from(weeklyData.entries())
      .map(([week, questions]) => ({ week, questions }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // Top customers with real data
    const customerStats = new Map<string, { 
      questions: number; 
      customers: Set<string>;
      conversations: string[];
      selfResolved: number;
      forwarded: number;
      satisfaction: number[];
    }>();
    
    userQuestions.forEach(q => {
      const customer = customerMap.get(q.user_id) || 'Unknown';
      if (!customerStats.has(customer)) {
        customerStats.set(customer, { 
          questions: 0, 
          customers: new Set(),
          conversations: [],
          selfResolved: 0,
          forwarded: 0,
          satisfaction: []
        });
      }
      const stats = customerStats.get(customer)!;
      stats.questions++;
      stats.customers.add(q.user_id);
      if (!stats.conversations.includes(q.conversation_id)) {
        stats.conversations.push(q.conversation_id);
      }
    });

    // Calculate real stats per customer
    customerStats.forEach((stats, customer) => {
      stats.conversations.forEach(convId => {
        const convMessages = conversationMap.get(convId) || [];
        const sortedMessages = convMessages.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        const userMessages = sortedMessages.filter(m => m.label === 'USER' || m.type === 'USER');
        const assistantMessages = sortedMessages.filter(m => m.label === 'ASSISTANT' || m.type === 'ASSISTANT');
        
        if (userMessages.length > 0) {
          const lastUserMessage = userMessages[userMessages.length - 1];
          const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
          
          if (lastAssistantMessage && 
              new Date(lastAssistantMessage.timestamp) > new Date(lastUserMessage.timestamp)) {
            stats.selfResolved++;
          } else {
            stats.forwarded++;
          }
          
          // Calculate satisfaction for this conversation
          const allContent = convMessages.map(m => m.content.toLowerCase()).join(' ');
          if (allContent.includes('thank') || allContent.includes('bedankt') || 
              allContent.includes('perfect') || allContent.includes('great') ||
              allContent.includes('helpful') || allContent.includes('nuttig')) {
            stats.satisfaction.push(4.5);
          } else if (allContent.includes('not helpful') || allContent.includes('niet nuttig') ||
                     allContent.includes('wrong') || allContent.includes('fout')) {
            stats.satisfaction.push(2.0);
          } else {
            stats.satisfaction.push(3.5);
          }
        }
      });
    });

    const topCustomers = Array.from(customerStats.entries())
      .map(([customer, stats]) => ({
        customer,
        questions: stats.questions,
        selfResolved: stats.selfResolved,
        forwarded: stats.forwarded,
        satisfaction: stats.satisfaction.length > 0 
          ? stats.satisfaction.reduce((a, b) => a + b, 0) / stats.satisfaction.length 
          : 3.5
      }))
      .sort((a, b) => b.questions - a.questions)
      .slice(0, 10);

    // Extract topics from actual content using keyword analysis
    const topicKeywords = {
      'Planning & Scheduling': ['planning', 'schedule', 'agenda', 'tijd', 'rooster'],
      'Facturatie': ['factuur', 'invoice', 'billing', 'betaling', 'payment'],
      'Integratie': ['integratie', 'integration', 'api', 'connect', 'koppeling'],
      'Rapportage': ['rapport', 'report', 'overzicht', 'dashboard', 'statistiek'],
      'Gebruikersbeheer': ['user', 'gebruiker', 'account', 'login', 'permissie'],
      'Technische Support': ['error', 'fout', 'bug', 'probleem', 'issue'],
      'Training': ['training', 'uitleg', 'help', 'tutorial', 'gids']
    };

    const topicCounts = new Map<string, number>();
    userQuestions.forEach(q => {
      const content = q.content.toLowerCase();
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => content.includes(keyword))) {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        }
      });
    });

    const topTopics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Real forwarded tickets from conversations that weren't resolved
    const forwardedTickets: Array<{
      customer: string;
      content: string;
      timestamp: string;
    }> = [];

    conversationMap.forEach((messages, conversationId) => {
      const sortedMessages = messages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const userMessages = sortedMessages.filter(m => m.label === 'USER' || m.type === 'USER');
      const assistantMessages = sortedMessages.filter(m => m.label === 'ASSISTANT' || m.type === 'ASSISTANT');
      
      if (userMessages.length > 0) {
        const lastUserMessage = userMessages[userMessages.length - 1];
        const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
        
        // If no assistant response after last user message, consider it forwarded
        if (!lastAssistantMessage || 
            new Date(lastAssistantMessage.timestamp) <= new Date(lastUserMessage.timestamp)) {
          const customer = customerMap.get(lastUserMessage.user_id) || 'Unknown';
          forwardedTickets.push({
            customer,
            content: lastUserMessage.content.length > 100 
              ? lastUserMessage.content.substring(0, 100) + '...' 
              : lastUserMessage.content,
            timestamp: lastUserMessage.timestamp
          });
        }
      }
    });

    console.log('Processed data:', {
      totalQuestions,
      uniqueCustomers,
      selfResolvedPercentage,
      forwardedPercentage,
      averageSatisfaction,
      topCustomers: topCustomers.length,
      topTopics: topTopics.length,
      forwardedTickets: forwardedTickets.length
    });

    return {
      totalQuestions,
      uniqueCustomers,
      selfResolvedPercentage,
      forwardedPercentage,
      averageSatisfaction,
      weeklyTrends,
      topCustomers,
      topTopics,
      forwardedTickets
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadedFile(files[0]);
      setError(null);
      processExcelFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t.chatbot.title}</h1>
              <p className="text-gray-600">{t.chatbot.subtitle}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!processedData ? (
          /* Upload Section */
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t.chatbot.uploadTitle}
              </h2>
              <p className="text-gray-600 mb-6">
                {t.chatbot.uploadSubtitle}
              </p>

              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {isProcessing ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t.chatbot.processing}</p>
                  </div>
                ) : (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {t.chatbot.dragDrop}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t.chatbot.fileTypes}
                    </p>
                  </div>
                )}
              </div>

              {uploadedFile && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    <strong>{t.chatbot.fileSelected}</strong> {uploadedFile.name}
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Dashboard Section */
          <div className="space-y-8">
            {/* Debug Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">📊 Data Processing Info</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>File:</strong> {uploadedFile?.name}</p>
                <p><strong>Total Rows:</strong> {processedData.totalQuestions + (processedData.totalQuestions * 2)} (estimated)</p>
                <p><strong>User Questions:</strong> {processedData.totalQuestions}</p>
                <p><strong>Unique Customers:</strong> {processedData.uniqueCustomers}</p>
                <p><strong>Conversations Analyzed:</strong> {Math.round(processedData.totalQuestions / 3)} (estimated)</p>
                <p className="text-xs text-blue-600 mt-2">
                  💡 Open browser console (F12) to see detailed processing logs
                </p>
              </div>
            </div>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{t.chatbot.totalQuestions}</p>
                    <p className="text-2xl font-semibold text-gray-900">{processedData.totalQuestions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{t.chatbot.uniqueCustomers}</p>
                    <p className="text-2xl font-semibold text-gray-900">{processedData.uniqueCustomers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{t.chatbot.selfResolved}</p>
                    <p className="text-2xl font-semibold text-gray-900">{processedData.selfResolvedPercentage}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{t.chatbot.forwarded}</p>
                    <p className="text-2xl font-semibold text-gray-900">{processedData.forwardedPercentage}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{t.chatbot.satisfaction}</p>
                    <p className="text-2xl font-semibold text-gray-900">{processedData.averageSatisfaction.toFixed(1)}/5</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Trends */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.chatbot.weeklyTrends}</h3>
              <div className="h-64 flex items-end space-x-2">
                {processedData.weeklyTrends.map((week, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="bg-blue-500 rounded-t w-full"
                      style={{ height: `${(week.questions / Math.max(...processedData.weeklyTrends.map(w => w.questions))) * 200}px` }}
                    ></div>
                    <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                      {week.week}
                    </div>
                    <div className="text-xs text-gray-700 mt-1">{week.questions}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.chatbot.topCustomers}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.chatbot.customer}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.chatbot.questions}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.chatbot.selfResolvedPct}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.chatbot.forwardedPct}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.chatbot.satisfactionScore}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedData.topCustomers.map((customer, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {customer.customer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.questions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.selfResolved} ({Math.round((customer.selfResolved / customer.questions) * 100)}%)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.forwarded} ({Math.round((customer.forwarded / customer.questions) * 100)}%)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.satisfaction.toFixed(1)}/5
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Topics */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.chatbot.topTopics}</h3>
              <div className="space-y-3">
                {processedData.topTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{topic.topic}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(topic.count / Math.max(...processedData.topTopics.map(t => t.count))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-8">{topic.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Forwarded Tickets */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.chatbot.forwardedTickets}</h3>
              <div className="space-y-4">
                {processedData.forwardedTickets.map((ticket, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{ticket.customer}</p>
                        <p className="text-sm text-gray-600 mt-1">{ticket.content}</p>
                      </div>
                      <span className="text-xs text-gray-500 ml-4">
                        {new Date(ticket.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload New File Button */}
            <div className="text-center">
              <button
                onClick={() => {
                  setProcessedData(null);
                  setUploadedFile(null);
                  setError(null);
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t.chatbot.uploadNew}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
