"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import * as XLSX from 'xlsx';

// Helper function to get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

interface ChatbotData {
  conversation_id: string;
  usr_id: string;
  Cli_Id: string;
  Content: string;
  Type: string;
  Username: string;
  Timestamp: string;
  // Legacy fields for compatibility
  user_id?: string;
  cu_id?: string;
  label?: string;
  content?: string;
  type?: string;
  username?: string;
  timestamp?: string;
}

interface ProcessedData {
  totalQuestions: number;
  uniqueConversations: number;
  uniqueCustomers: number;
  selfResolvedPercentage: number;
  forwardedPercentage: number;
  weeklyTrends: Array<{ week: string; questions: number }>;
  topCustomers: Array<{
    customer: string;
    questions: number;
    selfResolved: number;
    forwarded: number;
  }>;
  topTopics: Array<{ topic: string; count: number }>;
  weeklyCustomerData: Map<string, Array<{
    customer: string;
    questions: number;
    selfResolved: number;
    forwarded: number;
  }>>;
}

// Utility function for detecting support ticket forwarding
const isSupportTicketForwarding = (content: string): boolean => {
  const normalizedContent = content.toLowerCase();
  
  // Comprehensive list of forwarding indicators
  const forwardingKeywords = [
    // English
    'support ticket',
    'created a support ticket',
    'i\'ve created a support ticket',
    'support ticket created',
    'ticket has been created',
    'escalated to support',
    'forwarded to support',
    'support team will',
    'support will contact',
    'escalating your request',
    'escalated your request',
    'support specialist',
    'support agent',
    'human support',
    'live support',
    'support representative',
    
    // Dutch
    'ticket voor je aangemaakt',
    'ticket aangemaakt',
    'er is een support ticket',
    'support ticket aangemaakt',
    'doorgestuurd naar support',
    'escaleren naar support',
    'support team zal',
    'support neemt contact op',
    'support specialist',
    'support medewerker',
    'menselijke support',
    'live support',
    
    // German
    'ticket hinzugefügt',
    'ich habe einen support ticket',
    'ticket erstellt',
    'support ticket erstellt',
    'an support weitergeleitet',
    'escaliert an support',
    'support team wird',
    'support wird sich melden',
    'support spezialist',
    'support mitarbeiter',
    'menschliche unterstützung',
    'live support',
    'zum bestehenden ticket',
    'bestehenden ticket hinzugefügt',
    
    // French
    'ticket de support créé',
    'j\'ai créé un ticket',
    'ticket créé',
    'transféré au support',
    'escaladé au support',
    'équipe support',
    'support vous contactera',
    'spécialiste support',
    'agent support',
    'support humain',
    'support en direct',
    
    // Spanish
    'ticket de soporte creado',
    'he creado un ticket',
    'ticket creado',
    'derivado a soporte',
    'escalado a soporte',
    'equipo de soporte',
    'soporte se pondrá en contacto',
    'especialista en soporte',
    'agente de soporte',
    'soporte humano',
    'soporte en vivo'
  ];
  
  // Check for any forwarding keywords
  const hasForwardingKeyword = forwardingKeywords.some(keyword => 
    normalizedContent.includes(keyword)
  );
  
  // Additional patterns that indicate forwarding
  const forwardingPatterns = [
    /ticket.*(?:created|aangemaakt|erstellt|créé)/i,
    /support.*(?:ticket|team|agent|specialist)/i,
    /(?:escalat|forward|transfer).*support/i,
    /human.*support/i,
    /live.*support/i,
    /support.*(?:will|zal|wird|va).*(?:contact|contact|kontakt|contacter)/i
  ];
  
  const hasForwardingPattern = forwardingPatterns.some(pattern => 
    pattern.test(normalizedContent)
  );
  
  return hasForwardingKeyword || hasForwardingPattern;
};

// Test function to validate forwarding detection accuracy
const testForwardingDetection = () => {
  console.log('🧪 Testing forwarding detection accuracy...');
  
  const testCases = [
    // Should be detected as forwarding
    { message: "I've created a support ticket for you", expected: true },
    { message: "Er is een support ticket aangemaakt", expected: true },
    { message: "Ich habe einen support ticket erstellt", expected: true },
    { message: "J'ai créé un ticket de support", expected: true },
    { message: "He creado un ticket de soporte", expected: true },
    { message: "Your request has been escalated to support", expected: true },
    { message: "Support team will contact you shortly", expected: true },
    { message: "I'm forwarding this to our support specialist", expected: true },
    { message: "Human support will assist you", expected: true },
    { message: "Live support is available", expected: true },
    { message: "Support ticket created successfully", expected: true },
    { message: "Doorgestuurd naar support", expected: true },
    { message: "Escalated to support team", expected: true },
    { message: "Er is een support ticket voor je aangemaakt / I've created a support ticket / Ich habe Ihren Vorschlag zum bestehenden Ticket hinzugefügt", expected: true },
    
    // Should NOT be detected as forwarding
    { message: "How can I help you today?", expected: false },
    { message: "I understand your question", expected: false },
    { message: "Here's the information you requested", expected: false },
    { message: "Thank you for contacting us", expected: false },
    { message: "I can assist you with that", expected: false },
    { message: "Let me check that for you", expected: false },
    { message: "Based on your question", expected: false },
    { message: "Here are the steps to resolve this", expected: false },
    { message: "I found the answer in our knowledge base", expected: false },
    { message: "This is a common issue", expected: false },
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const result = isSupportTicketForwarding(testCase.message);
    const success = result === testCase.expected;
    
    if (success) {
      passed++;
      console.log(`✅ Test ${index + 1}: PASSED - "${testCase.message.substring(0, 50)}..."`);
    } else {
      failed++;
      console.log(`❌ Test ${index + 1}: FAILED - "${testCase.message.substring(0, 50)}..." (Expected: ${testCase.expected}, Got: ${result})`);
    }
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
  console.log(`🎯 Accuracy: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  
  return { passed, failed, total: testCases.length, accuracy: (passed / testCases.length) * 100 };
};

interface ChatbotUpload {
  id: string;
  filename: string;
  upload_date: string;
  status: string;
}

export default function ChatbotPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<ChatbotUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadHistory, setShowUploadHistory] = useState(false);
  
  // Load chatbot data from Supabase
  const loadChatbotData = useCallback(async (workspaceId: string) => {
    try {
      setLoading(true);
      
      // Fetch all conversations for this workspace
      const { data: conversations, error: convError } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('timestamp', { ascending: true });
      
      if (convError) {
        console.error('Error loading conversations:', convError);
        setLoading(false);
        return;
      }
      
      if (!conversations || conversations.length === 0) {
        setLoading(false);
        return;
      }
      
      // Convert stored conversations back to ChatbotData format
      const chatbotData: ChatbotData[] = conversations.map((conv: any) => ({
        conversation_id: conv.conversation_id,
        usr_id: conv.usr_id || '',
        Cli_Id: conv.cli_id || '',
        Content: conv.content,
        Type: conv.message_type,
        Username: conv.username || '',
        Timestamp: conv.timestamp ? new Date(conv.timestamp).toISOString() : '',
        // Legacy fields
        user_id: conv.usr_id || '',
        cu_id: conv.cli_id || '',
        content: conv.content,
        type: conv.message_type,
        username: conv.username || '',
        timestamp: conv.timestamp ? new Date(conv.timestamp).toISOString() : ''
      }));
      
      // Process the data
      const processed = processChatbotData(chatbotData);
      setProcessedData(processed);
      setLoading(false);
    } catch (err) {
      console.error('Error loading chatbot data:', err);
      setLoading(false);
    }
  }, [supabase]);
  
  // Load upload history
  const loadUploadHistory = useCallback(async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('chatbot_data_uploads')
        .select('id, filename, upload_date, status')
        .eq('workspace_id', workspaceId)
        .order('upload_date', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error loading upload history:', error);
        return;
      }
      
      setUploads(data || []);
    } catch (err) {
      console.error('Error loading upload history:', err);
    }
  }, [supabase]);

  // Run forwarding detection test on component mount
  useEffect(() => {
    if (isAuthenticated) {
      testForwardingDetection();
    }
  }, [isAuthenticated]);
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
    if (!workspaceId) {
      setError('Workspace niet gevonden');
      return;
    }

    setIsUploading(true);
    setIsProcessing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('Geen actieve sessie');
        setIsUploading(false);
        setIsProcessing(false);
        return;
      }

      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ChatbotData[];

      if (jsonData.length === 0) {
        setError('Het Excel bestand bevat geen data');
        setIsUploading(false);
        setIsProcessing(false);
        return;
      }

      // Create upload record
      const { data: uploadRecord, error: uploadError } = await supabase
        .from('chatbot_data_uploads')
        .insert({
          workspace_id: workspaceId,
          filename: file.name,
          file_type: 'xlsx',
          file_size: file.size,
          status: 'processing',
          created_by: session.user.id
        })
        .select()
        .single();

      if (uploadError || !uploadRecord) {
        setError('Fout bij uploaden: ' + (uploadError?.message || 'Onbekende fout'));
        setIsUploading(false);
        setIsProcessing(false);
        return;
      }

      // Delete old conversations for this workspace
      const { error: deleteError } = await supabase
        .from('chatbot_conversations')
        .delete()
        .eq('workspace_id', workspaceId);

      if (deleteError) {
        console.error('Error deleting old conversations:', deleteError);
      }

      // Process and save data
      const processed = processChatbotData(jsonData);
      
      // Extract customer names from username JSON
      const customerMap = new Map<string, string>();
      jsonData.forEach(row => {
        try {
          const username = row.Username || row.username;
          const userId = row.usr_id || row.user_id;
          
          if (username && username !== '[username]' && userId) {
            const userInfo = JSON.parse(username);
            if (userInfo.clientName) {
              customerMap.set(userId, userInfo.clientName);
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      });

      // Analyze conversations to determine if forwarded
      const conversationMap = new Map<string, ChatbotData[]>();
      jsonData.forEach(row => {
        if (!conversationMap.has(row.conversation_id)) {
          conversationMap.set(row.conversation_id, []);
        }
        conversationMap.get(row.conversation_id)!.push(row);
      });

      const forwardedConversations = new Set<string>();
      conversationMap.forEach((messages, conversationId) => {
        const assistantMessages = messages.filter(m => 
          (m.Type === 'ASSISTANT' || m.type === 'ASSISTANT') && 
          (m.Content || m.content)
        );
        
        assistantMessages.forEach(msg => {
          const content = (msg.Content || msg.content || '').toLowerCase();
          if (isSupportTicketForwarding(content)) {
            forwardedConversations.add(conversationId);
          }
        });
      });

      // Insert conversations in batches
      const batchSize = 100;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < jsonData.length; i += batchSize) {
        const batch = jsonData.slice(i, i + batchSize);
        const conversationRecords = batch.map(row => {
          const userId = row.usr_id || row.user_id || '';
          const customerName = customerMap.get(userId) || null;
          const isForwarded = forwardedConversations.has(row.conversation_id);
          
          // Determine if self-resolved (user messages in conversations that were NOT forwarded)
          const isSelfResolved = !isForwarded && (row.Type === 'USER' || row.type === 'USER');

          return {
            workspace_id: workspaceId,
            upload_id: uploadRecord.id,
            conversation_id: row.conversation_id,
            usr_id: userId,
            cli_id: row.Cli_Id || row.cu_id || null,
            customer_name: customerName,
            content: row.Content || row.content || '',
            message_type: row.Type || row.type || 'UNKNOWN',
            username: row.Username || row.username || null,
            timestamp: (row.Timestamp || row.timestamp) ? new Date(row.Timestamp || row.timestamp || '') : null,
            is_forwarded: isForwarded,
            is_self_resolved: isSelfResolved,
            topic: null, // Could be extracted later if needed
            raw_data: row
          };
        });

        const { error: insertError } = await supabase
          .from('chatbot_conversations')
          .insert(conversationRecords);

        if (insertError) {
          console.error('Error inserting batch:', insertError);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }

      // Update upload status
      const finalStatus = successCount > 0 ? 'processed' : 'error';
      await supabase
        .from('chatbot_data_uploads')
        .update({ status: finalStatus })
        .eq('id', uploadRecord.id);

      // Reload data and upload history
      await loadChatbotData(workspaceId);
      await loadUploadHistory(workspaceId);

      setProcessedData(processed);
      setUploadedFile(file);
      setIsUploading(false);
      setIsProcessing(false);
    } catch (err) {
      setError(t.chatbot.errorProcessing || 'Fout bij verwerken van bestand');
      console.error("Error processing file:", err);
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const processChatbotData = (data: ChatbotData[]): ProcessedData => {
    console.log('Processing data:', data.length, 'rows');
    console.log('Sample data structure:', data.slice(0, 3));
    
    // Filter user questions (messages from users)
    const userQuestions = data.filter(row => {
      return row.Type === 'USER';
    });
    console.log('User questions found:', userQuestions.length);

    // Extract customer names from username JSON
    const customerMap = new Map<string, string>();
    data.forEach(row => {
      try {
        const username = row.Username || row.username;
        const userId = row.usr_id || row.user_id;
        
        if (username && username !== '[username]' && userId) {
          const userInfo = JSON.parse(username);
          if (userInfo.clientName) {
            customerMap.set(userId, userInfo.clientName);
            console.log('Found customer:', userInfo.clientName, 'for user:', userId);
          }
        }
      } catch (e) {
        console.log('Failed to parse username:', row.Username || row.username, 'Error:', e);
      }
    });
    console.log('Customers found:', customerMap.size);

    // Calculate basic metrics
    const totalQuestions = userQuestions.length;
    const uniqueCustomers = new Set(customerMap.values()).size;
    
    // Group user questions by conversation_id to get unique conversations
    const conversationUserQuestions = new Map<string, ChatbotData[]>();
    userQuestions.forEach(q => {
      const convId = q.conversation_id;
      if (!conversationUserQuestions.has(convId)) {
        conversationUserQuestions.set(convId, []);
      }
      conversationUserQuestions.get(convId)!.push(q);
    });
    
    const uniqueConversations = conversationUserQuestions.size;
    console.log('Unique conversations found:', uniqueConversations);

    // If no user questions found, try alternative approach
    if (totalQuestions === 0) {
      console.log('No user questions found with standard filtering, trying alternative approach...');
      
      // Try to find any rows that might be user questions by looking at content patterns
      const alternativeUserQuestions = data.filter(row => {
        const content = (row.Content || row.content || '').toLowerCase();
        const hasQuestionWords = content.includes('?') || 
                                content.includes('hoe') || 
                                content.includes('wat') || 
                                content.includes('waar') ||
                                content.includes('wanneer') ||
                                content.includes('why') ||
                                content.includes('how') ||
                                content.includes('what') ||
                                content.includes('where') ||
                                content.includes('when');
        
        // Exclude obvious assistant responses
        const isNotAssistant = !content.includes('as an ai') && 
                              !content.includes('ik ben een ai') &&
                              !content.includes('i can help') &&
                              !content.includes('ik kan helpen');
        
        return hasQuestionWords && isNotAssistant && content.length > 10;
      });
      
      console.log('Alternative user questions found:', alternativeUserQuestions.length);
      if (alternativeUserQuestions.length > 0) {
        // Use alternative questions for analysis
        userQuestions.push(...alternativeUserQuestions);
      }
    }

    // Analyze conversation flows to determine resolution
    const conversationMap = new Map<string, ChatbotData[]>();
    data.forEach(row => {
      if (!conversationMap.has(row.conversation_id)) {
        conversationMap.set(row.conversation_id, []);
      }
      conversationMap.get(row.conversation_id)!.push(row);
    });

    // Analyze each conversation to determine if it was self-resolved or forwarded
    let selfResolvedCount = 0;
    let forwardedCount = 0;

    let totalMessages = 0;
    let totalUserMessages = 0;
    let totalAssistantMessages = 0;
    
    conversationMap.forEach((messages, conversationId) => {
        totalMessages += messages.length;
        
        const sortedMessages = messages.sort((a, b) => {
          const timestampA = a.Timestamp || a.timestamp || '';
          const timestampB = b.Timestamp || b.timestamp || '';
          return new Date(timestampA).getTime() - new Date(timestampB).getTime();
        });
        
        const userMessages = sortedMessages.filter(m => 
          m.Type === 'USER' || m.label === 'USER' || m.type === 'USER' || 
          m.Type?.toLowerCase() === 'user' || m.label?.toLowerCase() === 'user' || m.type?.toLowerCase() === 'user'
        );
        const assistantMessages = sortedMessages.filter(m => 
          m.Type === 'ASSISTANT' || m.label === 'ASSISTANT' || m.type === 'ASSISTANT' || 
          m.Type?.toLowerCase() === 'assistant' || m.label?.toLowerCase() === 'assistant' || m.type?.toLowerCase() === 'assistant'
        );
        
        totalUserMessages += userMessages.length;
        totalAssistantMessages += assistantMessages.length;
        
        // Debug: log some assistant messages to see what we're working with
        if (assistantMessages.length > 0) {
          console.log('Conversation', conversationId, 'has', assistantMessages.length, 'assistant messages');
          console.log('Sample assistant message:', {
            type: assistantMessages[0].Type || assistantMessages[0].type,
            label: assistantMessages[0].label,
            content: (assistantMessages[0].Content || assistantMessages[0].content || '').substring(0, 100)
          });
        } else if (conversationId === Array.from(conversationMap.keys())[0]) {
          // Only log for first conversation to avoid spam
          console.log('First conversation has NO assistant messages');
          console.log('Sample message from first conversation:', {
            type: sortedMessages[0]?.Type || sortedMessages[0]?.type,
            label: sortedMessages[0]?.label,
            content: (sortedMessages[0]?.Content || sortedMessages[0]?.content || '').substring(0, 100)
          });
          console.log('All message types in first conversation:');
          sortedMessages.forEach((m, index) => {
            console.log(`Message ${index + 1}:`);
            console.log('  Type:', m.Type);
            console.log('  type:', m.type);
            console.log('  label:', m.label);
            console.log('  Content:', (m.Content || '').substring(0, 50));
            console.log('  All properties:', Object.keys(m));
          });
        }

        // Debug: Log all unique message types across all conversations
        const allTypes = new Set<string>();
        conversationMap.forEach((messages) => {
          messages.forEach((m) => {
            if (m.Type) allTypes.add(m.Type);
            if (m.type) allTypes.add(m.type);
            if (m.label) allTypes.add(m.label);
          });
        });
        console.log('All unique message types found:', Array.from(allTypes).join(', '));

        if (userMessages.length > 0) {
          // Check if any assistant message contains support ticket creation text
          const hasSupportTicket = assistantMessages.some(msg => {
            const content = (msg.Content || msg.content || '');
            const isSupportTicket = isSupportTicketForwarding(content);
            
            if (isSupportTicket) {
              console.log('Found support ticket message:', content.substring(0, 100));
            }
            
            return isSupportTicket;
          });
          
          if (hasSupportTicket) {
            forwardedCount++;
            console.log('Conversation marked as forwarded');
          } else {
            selfResolvedCount++;
            console.log('Conversation marked as self-resolved');
          }
        }
      });

    const selfResolvedPercentage = uniqueConversations > 0 ? Math.round((selfResolvedCount / uniqueConversations) * 100) : 0;
    const forwardedPercentage = uniqueConversations > 0 ? Math.round((forwardedCount / uniqueConversations) * 100) : 0;
    
    console.log('=== FORWARDING ANALYSIS RESULTS ===');
    console.log('Total conversations analyzed:', uniqueConversations);
    console.log('Total messages in all conversations:', totalMessages);
    console.log('Total user messages found:', totalUserMessages);
    console.log('Total assistant messages found:', totalAssistantMessages);
    console.log('Self-resolved conversations:', selfResolvedCount);
    console.log('Forwarded conversations:', forwardedCount);
    console.log('Self-resolved percentage:', selfResolvedPercentage + '%');
    console.log('Forwarded percentage:', forwardedPercentage + '%');
    console.log('=====================================');

    // Weekly trends - group by conversation_id to get unique conversations per week
    const weeklyData = new Map<string, Set<string>>();
    userQuestions.forEach(q => {
      const timestamp = q.Timestamp || q.timestamp || '';
      if (timestamp) {
        const date = new Date(timestamp);
        // Get the week number using ISO week
        const year = date.getFullYear();
        const weekNumber = getWeekNumber(date);
        const week = `${year}-W${weekNumber}`;
        
        if (!weeklyData.has(week)) {
          weeklyData.set(week, new Set());
        }
        // Add conversation_id to the set (this ensures unique conversations)
        weeklyData.get(week)!.add(q.conversation_id);
      }
    });

    const weeklyTrends = Array.from(weeklyData.entries())
      .map(([week, conversationSet]) => ({ week, questions: conversationSet.size }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // Top customers with real data
    const customerStats = new Map<string, { 
      questions: number; 
      customers: Set<string>;
      conversations: string[];
      selfResolved: number;
      forwarded: number;
    }>();
    
    userQuestions.forEach(q => {
      const userId = q.usr_id || q.user_id;
      const customer = userId ? customerMap.get(userId) || 'Unknown' : 'Unknown';
      if (!customerStats.has(customer)) {
        customerStats.set(customer, { 
          questions: 0, 
          customers: new Set(),
          conversations: [],
          selfResolved: 0,
          forwarded: 0,
        });
      }
      const stats = customerStats.get(customer)!;
      stats.questions++;
      if (userId) {
        stats.customers.add(userId);
      }
      if (!stats.conversations.includes(q.conversation_id)) {
        stats.conversations.push(q.conversation_id);
      }
    });

    // Calculate real stats per customer
    customerStats.forEach((stats) => {
      stats.conversations.forEach(convId => {
        const convMessages = conversationMap.get(convId) || [];
        const sortedMessages = convMessages.sort((a, b) => 
          new Date(a.Timestamp || a.timestamp || '').getTime() - new Date(b.Timestamp || b.timestamp || '').getTime()
        );
        
        const userMessages = sortedMessages.filter(m => 
          m.Type === 'USER' || m.label === 'USER' || m.type === 'USER' || 
          m.Type?.toLowerCase() === 'user' || m.label?.toLowerCase() === 'user' || m.type?.toLowerCase() === 'user'
        );
        const assistantMessages = sortedMessages.filter(m => 
          m.Type === 'ASSISTANT' || m.label === 'ASSISTANT' || m.type === 'ASSISTANT' ||
          m.Type?.toLowerCase() === 'assistant' || m.label?.toLowerCase() === 'assistant' || m.type?.toLowerCase() === 'assistant'
        );
        
        if (userMessages.length > 0) {
          // Check if any assistant message contains support ticket creation text
          const hasSupportTicket = assistantMessages.some(msg => {
            const content = (msg.Content || msg.content || '');
            const isSupportTicket = isSupportTicketForwarding(content);
            
            // Debug logging for main customer stats
            if (isSupportTicket) {
              console.log('🔍 MAIN FORWARDING DETECTED:');
              console.log('  Customer:', Array.from(customerStats.keys()).find(c => customerStats.get(c) === stats));
              console.log('  Conversation ID:', convId);
              console.log('  Assistant Message:', content.substring(0, 200));
            }
            
            return isSupportTicket;
          });
          
          if (hasSupportTicket) {
            stats.forwarded++;
          } else {
            stats.selfResolved++;
          }
        }
      });
    });

    // Debug: Show customer forwarding details
    console.log('=== CUSTOMER FORWARDING DETAILS ===');
    customerStats.forEach((stats, customer) => {
      console.log(`📊 ${customer}: ${stats.forwarded} forwarded, ${stats.selfResolved} self-resolved (${stats.questions} total questions, ${stats.conversations.length} conversations)`);
    });
    console.log('===================================');

    const topCustomers = Array.from(customerStats.entries())
      .map(([customer, stats]) => ({
        customer,
        questions: stats.questions,
        selfResolved: stats.selfResolved,
        forwarded: stats.forwarded,
      }))
      .sort((a, b) => b.questions - a.questions)
      .slice(0, 10);

    // Extract topics from actual content using multi-language keyword analysis
    // Enhanced with Timewax-specific terminology and knowledge base categories
    const topicKeywords = {
      'Planning & Scheduling': [
        // Dutch - Timewax specific
        'planning', 'schedule', 'agenda', 'tijd', 'rooster', 'afspraak', 'afspraken', 'kalender',
        'tijdschema', 'planning maken', 'inplannen', 'reserveren', 'boeken', 'booking',
        'resource planning', 'resourceplanning', 'capaciteit', 'capaciteitsplanning', 'projectplanning',
        'project planning', 'tijdregistratie', 'time tracking', 'uren registreren', 'urenregistratie',
        'roostering', 'shift planning', 'shiftplanning', 'werkrooster', 'diensten', 'dienstrooster',
        // English - Timewax specific
        'scheduling', 'appointment', 'appointments', 'calendar', 'time', 'book', 'reserve',
        'schedule', 'timetable', 'planning', 'booking', 'reservation', 'resource planning',
        'capacity planning', 'project planning', 'time tracking', 'time registration', 'hours',
        'shift planning', 'work schedule', 'roster', 'duty roster', 'resource allocation',
        // German - Timewax specific
        'planung', 'termin', 'termine', 'kalender', 'zeit', 'buchung', 'reservierung',
        'zeitplan', 'planen', 'buchen', 'reservieren', 'terminplanung', 'ressourcenplanung',
        'kapazitätsplanung', 'projektplanung', 'zeiterfassung', 'stundenerfassung', 'schichtplanung',
        'arbeitsplan', 'dienstplan', 'ressourcenzuweisung',
        // French - Timewax specific
        'planification', 'rendez-vous', 'calendrier', 'temps', 'réservation', 'planifier',
        'programmer', 'agenda', 'horaire', 'planning', 'planification des ressources',
        'planification de capacité', 'planification de projet', 'suivi du temps', 'enregistrement du temps',
        'planification des équipes', 'plan de travail', 'plan de service'
      ],
      'Facturatie & Projecten': [
        // Dutch - Timewax specific
        'factuur', 'facturen', 'billing', 'betaling', 'payment', 'rekening', 'rekeningen',
        'facturatie', 'betalen', 'kosten', 'prijs', 'tarief', 'tarieven', 'geld',
        'project', 'projecten', 'project management', 'projectbeheer', 'projectoverzicht',
        'project status', 'projectstatus', 'project voortgang', 'projectvoortgang',
        'project budget', 'projectbudget', 'project kosten', 'projectkosten',
        'project rapport', 'projectrapport', 'project rapportage', 'projectrapportage',
        // English - Timewax specific
        'invoice', 'invoices', 'billing', 'payment', 'pay', 'cost', 'costs', 'price',
        'pricing', 'money', 'charge', 'charges', 'fee', 'fees', 'project', 'projects',
        'project management', 'project overview', 'project status', 'project progress',
        'project budget', 'project costs', 'project report', 'project reporting',
        'project profitability', 'project revenue', 'project expenses',
        // German - Timewax specific
        'rechnung', 'rechnungen', 'abrechnung', 'zahlung', 'bezahlung', 'kosten', 'preis',
        'preise', 'geld', 'gebühr', 'gebühren', 'tarif', 'tarife', 'projekt', 'projekte',
        'projektmanagement', 'projektübersicht', 'projektstatus', 'projektfortschritt',
        'projektbudget', 'projektkosten', 'projektbericht', 'projektberichterstattung',
        // French - Timewax specific
        'facture', 'factures', 'facturation', 'paiement', 'payer', 'coût', 'coûts',
        'prix', 'argent', 'frais', 'tarif', 'tarifs', 'projet', 'projets',
        'gestion de projet', 'aperçu du projet', 'statut du projet', 'progrès du projet',
        'budget du projet', 'coûts du projet', 'rapport de projet', 'rapportage de projet'
      ],
      'Integratie & API': [
        // Dutch - Timewax specific
        'integratie', 'integration', 'api', 'connect', 'koppeling', 'verbinding', 'link',
        'samenwerking', 'koppelen', 'verbinden', 'aansluiten', 'integratie', 'webhook',
        'excel export', 'excelexport', 'csv export', 'csvexport', 'data export', 'dataexport',
        'import', 'data import', 'dataimport', 'synchronisatie', 'synchronization',
        'single sign on', 'sso', 'active directory', 'ldap', 'oauth', 'authentication',
        'authenticatie', 'login integratie', 'loginintegratie', 'third party', 'thirdparty',
        // English - Timewax specific
        'integration', 'integrate', 'api', 'connect', 'connection', 'link', 'linking',
        'webhook', 'sync', 'synchronization', 'connectivity', 'interface', 'excel export',
        'csv export', 'data export', 'import', 'data import', 'single sign on', 'sso',
        'active directory', 'ldap', 'oauth', 'authentication', 'third party integration',
        'external system', 'system integration', 'data sync', 'data synchronization',
        // German - Timewax specific
        'integration', 'integrieren', 'api', 'verbindung', 'verknüpfung', 'anbindung',
        'verbinden', 'verknüpfen', 'webhook', 'synchronisation', 'schnittstelle',
        'excel export', 'csv export', 'datenexport', 'import', 'datenimport',
        'single sign on', 'sso', 'active directory', 'ldap', 'oauth', 'authentifizierung',
        'drittanbieter', 'systemintegration', 'datensynchronisation',
        // French - Timewax specific
        'intégration', 'intégrer', 'api', 'connexion', 'lien', 'connecter', 'webhook',
        'synchronisation', 'interface', 'export excel', 'export csv', 'export de données',
        'import', 'import de données', 'single sign on', 'sso', 'active directory',
        'ldap', 'oauth', 'authentification', 'intégration tierce partie', 'système externe'
      ],
      'Rapportage': [
        // Dutch
        'rapport', 'rapporten', 'report', 'reports', 'overzicht', 'overzichten', 'dashboard',
        'statistiek', 'statistieken', 'cijfers', 'data', 'analyse', 'analyses', 'metrics',
        'kpi', 'kpi\'s', 'prestatie', 'prestaties', 'resultaten', 'resultaat',
        // English
        'report', 'reports', 'reporting', 'dashboard', 'overview', 'statistics', 'stats',
        'data', 'analysis', 'analytics', 'metrics', 'kpi', 'performance', 'results',
        // German
        'bericht', 'berichte', 'reporting', 'dashboard', 'übersicht', 'statistik',
        'daten', 'analyse', 'analysen', 'metriken', 'kpi', 'leistung', 'ergebnisse',
        // French
        'rapport', 'rapports', 'reporting', 'tableau de bord', 'aperçu', 'statistiques',
        'données', 'analyse', 'analyses', 'métriques', 'kpi', 'performance', 'résultats'
      ],
      'Gebruikersbeheer': [
        // Dutch
        'user', 'users', 'gebruiker', 'gebruikers', 'account', 'accounts', 'login',
        'permissie', 'permissies', 'rechten', 'rol', 'rollen', 'beheer', 'beheren',
        'toegang', 'access', 'profiel', 'profielen', 'instellingen', 'settings',
        // English
        'user', 'users', 'account', 'accounts', 'login', 'permission', 'permissions',
        'rights', 'role', 'roles', 'management', 'manage', 'access', 'profile',
        'profiles', 'settings', 'configuration', 'config',
        // German
        'benutzer', 'benutzer', 'konto', 'konten', 'anmeldung', 'berechtigung',
        'berechtigungen', 'rechte', 'rolle', 'rollen', 'verwaltung', 'verwalten',
        'zugang', 'profil', 'profile', 'einstellungen',
        // French
        'utilisateur', 'utilisateurs', 'compte', 'comptes', 'connexion', 'permission',
        'permissions', 'droits', 'rôle', 'rôles', 'gestion', 'gérer', 'accès',
        'profil', 'profils', 'paramètres'
      ],
      'Technische Support': [
        // Dutch
        'error', 'errors', 'fout', 'fouten', 'bug', 'bugs', 'probleem', 'problemen',
        'issue', 'issues', 'technisch', 'technische', 'support', 'hulp', 'help',
        'niet werkend', 'werkt niet', 'kapot', 'defect', 'mislukt', 'failed',
        // English
        'error', 'errors', 'bug', 'bugs', 'problem', 'problems', 'issue', 'issues',
        'technical', 'support', 'help', 'not working', 'broken', 'failed', 'failure',
        'troubleshoot', 'troubleshooting',
        // German
        'fehler', 'bug', 'bugs', 'problem', 'probleme', 'issue', 'issues', 'technisch',
        'support', 'hilfe', 'funktioniert nicht', 'kaputt', 'defekt', 'fehlgeschlagen',
        // French
        'erreur', 'erreurs', 'bug', 'bugs', 'problème', 'problèmes', 'issue', 'issues',
        'technique', 'support', 'aide', 'ne fonctionne pas', 'cassé', 'défaillant'
      ],
      'Training & Documentatie': [
        // Dutch - Timewax specific
        'training', 'trainings', 'uitleg', 'uitleg', 'help', 'tutorial', 'tutorials',
        'gids', 'gidsen', 'handleiding', 'handleidingen', 'instructie', 'instructies',
        'leren', 'hoe werkt', 'hoe gebruik', 'hoe doe ik', 'stappen', 'stap voor stap',
        'documentatie', 'documentation', 'knowledge base', 'kennisbank', 'help center',
        'support center', 'supportcentrum', 'faq', 'veelgestelde vragen', 'vraag en antwoord',
        'user guide', 'gebruikersgids', 'user manual', 'gebruikershandleiding',
        // English - Timewax specific
        'training', 'tutorial', 'tutorials', 'guide', 'guides', 'manual', 'manuals',
        'instruction', 'instructions', 'learn', 'learning', 'how to', 'how does',
        'how do i', 'steps', 'step by step', 'help', 'documentation', 'knowledge base',
        'help center', 'support center', 'faq', 'frequently asked questions', 'q&a',
        'user guide', 'user manual', 'getting started', 'quick start', 'onboarding',
        // German - Timewax specific
        'schulung', 'schulungen', 'tutorial', 'tutorials', 'anleitung', 'anleitungen',
        'handbuch', 'handbücher', 'anweisung', 'anweisungen', 'lernen', 'wie funktioniert',
        'wie verwende ich', 'schritte', 'schritt für schritt', 'hilfe', 'dokumentation',
        'wissensdatenbank', 'hilfezentrum', 'support-zentrum', 'faq', 'häufig gestellte fragen',
        'benutzerhandbuch', 'benutzeranleitung', 'einstieg', 'schnellstart',
        // French - Timewax specific
        'formation', 'formations', 'tutoriel', 'tutoriels', 'guide', 'guides',
        'manuel', 'manuels', 'instruction', 'instructions', 'apprendre', 'comment',
        'comment utiliser', 'étapes', 'étape par étape', 'aide', 'documentation',
        'base de connaissances', 'centre d\'aide', 'centre de support', 'faq',
        'questions fréquemment posées', 'guide utilisateur', 'manuel utilisateur',
        'démarrage rapide', 'intégration'
      ],
      'Timewax Specifiek': [
        // Dutch - Timewax product specific
        'timewax', 'time wax', 'timewax software', 'timewax systeem', 'timewax platform',
        'resource planning', 'resourceplanning', 'project planning', 'projectplanning',
        'time tracking', 'timetracking', 'tijdregistratie', 'urenregistratie',
        'capacity planning', 'capaciteitsplanning', 'shift planning', 'shiftplanning',
        'roostering', 'werkrooster', 'dienstrooster', 'projectbeheer', 'project management',
        'projectoverzicht', 'project status', 'projectstatus', 'project voortgang',
        'project budget', 'projectbudget', 'project kosten', 'projectkosten',
        'project rapport', 'projectrapport', 'project rapportage', 'projectrapportage',
        'excel export', 'excelexport', 'csv export', 'csvexport', 'data export',
        'data import', 'dataimport', 'synchronisatie', 'synchronization',
        'single sign on', 'sso', 'active directory', 'ldap', 'oauth', 'authentication',
        'authenticatie', 'login integratie', 'loginintegratie', 'third party',
        'thirdparty', 'integratie', 'integration', 'api', 'webhook', 'connect',
        'koppeling', 'verbinding', 'link', 'samenwerking', 'koppelen', 'verbinden',
        'aansluiten', 'rapport', 'rapporten', 'report', 'reports', 'overzicht',
        'overzichten', 'dashboard', 'statistiek', 'statistieken', 'cijfers', 'data',
        'analyse', 'analyses', 'metrics', 'kpi', 'kpi\'s', 'prestatie', 'prestaties',
        'resultaten', 'resultaat', 'factuur', 'facturen', 'billing', 'betaling',
        'payment', 'rekening', 'rekeningen', 'facturatie', 'betalen', 'kosten',
        'prijs', 'tarief', 'tarieven', 'geld', 'project', 'projecten',
        'user', 'users', 'gebruiker', 'gebruikers', 'account', 'accounts', 'login',
        'permissie', 'permissies', 'rechten', 'rol', 'rollen', 'beheer', 'beheren',
        'toegang', 'access', 'profiel', 'profielen', 'instellingen', 'settings',
        'error', 'errors', 'fout', 'fouten', 'bug', 'bugs', 'probleem', 'problemen',
        'issue', 'issues', 'technisch', 'technische', 'support', 'hulp', 'help',
        'niet werkend', 'werkt niet', 'kapot', 'defect', 'mislukt', 'failed',
        'training', 'trainings', 'uitleg', 'tutorial', 'tutorials', 'gids', 'gidsen',
        'handleiding', 'handleidingen', 'instructie', 'instructies', 'leren',
        'hoe werkt', 'hoe gebruik', 'hoe doe ik', 'stappen', 'stap voor stap',
        'documentatie', 'documentation', 'knowledge base', 'kennisbank', 'help center',
        'support center', 'supportcentrum', 'faq', 'veelgestelde vragen',
        'vraag en antwoord', 'user guide', 'gebruikersgids', 'user manual',
        'gebruikershandleiding'
      ]
    };

    const topicCounts = new Map<string, number>();
    const topicMatches = new Map<string, string[]>(); // For debugging
    
    userQuestions.forEach(q => {
      const content = (q.Content || q.content || '').toLowerCase();
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        const foundKeywords = keywords.filter(keyword => content.includes(keyword));
        if (foundKeywords.length > 0) {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
          
          // Store matches for debugging
          if (!topicMatches.has(topic)) {
            topicMatches.set(topic, []);
          }
          topicMatches.get(topic)!.push(...foundKeywords);
        }
      });
    });
    
    // Debug: Log topic analysis results
    console.log('=== TOPIC ANALYSIS RESULTS ===');
    topicMatches.forEach((matches, topic) => {
      const uniqueMatches = [...new Set(matches)];
      console.log(`📊 ${topic}: ${topicCounts.get(topic)} matches`);
      console.log(`   Keywords found: ${uniqueMatches.slice(0, 5).join(', ')}${uniqueMatches.length > 5 ? '...' : ''}`);
    });
    console.log('==============================');

    const topTopics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);


    console.log('Processed data:', {
      totalQuestions,
      uniqueCustomers,
      selfResolvedPercentage,
      forwardedPercentage,
      topCustomers: topCustomers.length,
      topTopics: topTopics.length
    });

    // Calculate weekly customer data
    const weeklyCustomerData = new Map<string, Array<{
      customer: string;
      questions: number;
      selfResolved: number;
      forwarded: number;
    }>>();

    // Group customer data by week
    userQuestions.forEach(q => {
      const timestamp = q.Timestamp || q.timestamp || '';
      if (timestamp) {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const weekNumber = getWeekNumber(date);
        const week = `${year}-W${weekNumber}`;
        
        if (!weeklyCustomerData.has(week)) {
          weeklyCustomerData.set(week, []);
        }
      }
    });

    // Calculate customer stats for each week
    weeklyCustomerData.forEach((_, week) => {
      const weekCustomerStats = new Map<string, { 
        questions: number; 
        selfResolved: number;
        forwarded: number;
      }>();

      // Filter questions for this week
      const weekQuestions = userQuestions.filter(q => {
        const timestamp = q.Timestamp || q.timestamp || '';
        if (timestamp) {
          const date = new Date(timestamp);
          const year = date.getFullYear();
          const weekNumber = getWeekNumber(date);
          const questionWeek = `${year}-W${weekNumber}`;
          return questionWeek === week;
        }
        return false;
      });

      weekQuestions.forEach(q => {
        const userId = q.usr_id || q.user_id;
        const customer = userId ? customerMap.get(userId) || 'Unknown' : 'Unknown';
        
        if (!weekCustomerStats.has(customer)) {
          weekCustomerStats.set(customer, { 
            questions: 0, 
            selfResolved: 0,
            forwarded: 0,
          });
        }
        
        const stats = weekCustomerStats.get(customer)!;
        stats.questions++;

        // Check if this conversation was forwarded
        const convMessages = conversationMap.get(q.conversation_id) || [];
        const assistantMessages = convMessages.filter(m => 
          m.Type === 'ASSISTANT' || m.label === 'ASSISTANT' || m.type === 'ASSISTANT' || 
          m.Type?.toLowerCase() === 'assistant' || m.label?.toLowerCase() === 'assistant' || m.type?.toLowerCase() === 'assistant'
        );
        
        const hasSupportTicket = assistantMessages.some(msg => {
          const content = (msg.Content || msg.content || '');
          const isSupportTicket = isSupportTicketForwarding(content);
          
          // Debug logging for forwarding detection
          if (isSupportTicket) {
            console.log('🔍 FORWARDING DETECTED:');
            console.log('  Customer:', customer);
            console.log('  Conversation ID:', q.conversation_id);
            console.log('  Assistant Message:', content.substring(0, 200));
            console.log('  Full Content:', content);
          }
          
          return isSupportTicket;
        });
        
        if (hasSupportTicket) {
          stats.forwarded++;
          console.log(`📤 Forwarded: ${customer} - Conversation ${q.conversation_id}`);
        } else {
          stats.selfResolved++;
          console.log(`✅ Self-resolved: ${customer} - Conversation ${q.conversation_id}`);
        }
      });

      // Convert to array and sort by questions
      const weekTopCustomers = Array.from(weekCustomerStats.entries())
        .map(([customer, stats]) => ({
          customer,
          questions: stats.questions,
          selfResolved: stats.selfResolved,
          forwarded: stats.forwarded,
        }))
        .sort((a, b) => b.questions - a.questions)
        .slice(0, 10);

      weeklyCustomerData.set(week, weekTopCustomers);
    });

    return {
      totalQuestions,
      uniqueConversations,
      uniqueCustomers,
      selfResolvedPercentage,
      forwardedPercentage,
      weeklyTrends,
      topCustomers,
      topTopics,
      weeklyCustomerData
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  // Show loading state while checking authentication or loading data
  if (isAuthenticated === null || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{isAuthenticated === null ? 'Controleren toegang...' : 'Data laden...'}</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated or not Timewax client
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Toegang Geweigerd</h2>
          <p className="text-gray-600 mb-6">
            Deze functie is alleen beschikbaar voor Timewax klanten.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Terug naar Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chatbot Analytics</h1>
              <p className="text-gray-600">Analyse van chatbot gesprekken voor {workspaceName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Terug naar Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Uitloggen
              </button>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Upload Section - Always visible */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <h2 className="text-lg font-semibold mb-3">Upload Chatbot Data</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-4">
              <div className="text-gray-500">
                <svg className="h-8 w-8" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <label htmlFor="chatbot-file-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-gray-900">
                    {isUploading || isProcessing 
                      ? (isProcessing ? 'Bestand verwerken...' : 'Bestand uploaden...')
                      : 'Klik om Excel bestand te uploaden'}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    (.xlsx, .xls, .csv)
                  </span>
                </label>
                <input
                  ref={fileInputRef}
                  id="chatbot-file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="sr-only"
                  disabled={isUploading || isProcessing}
                />
              </div>
            </div>
          </div>
          
          {/* Upload History - Collapsible */}
          {uploads.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowUploadHistory(!showUploadHistory)}
                className="flex items-center justify-between w-full text-left text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span>Upload Geschiedenis ({uploads.length})</span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${showUploadHistory ? 'transform rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showUploadHistory && (
                <div className="mt-2 space-y-1">
                  {uploads.map((upload: ChatbotUpload) => (
                    <div key={upload.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-xs font-medium text-gray-900">{upload.filename}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(upload.upload_date).toLocaleString('nl-NL')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        upload.status === 'processed' 
                          ? 'bg-green-100 text-green-800'
                          : upload.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {upload.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {!processedData ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Upload een Excel bestand om chatbot analytics te zien</p>
          </div>
        ) : (
          /* Dashboard Section */
          <div className="space-y-8">
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
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-lg">💬</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Unieke Gesprekken</p>
                    <p className="text-2xl font-semibold text-gray-900">{processedData.uniqueConversations}</p>
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

            </div>

            {/* Weekly Trends */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Unieke gesprekken per week</h3>
              <div className="h-64 flex items-end space-x-2">
                {processedData.weeklyTrends.map((week, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="bg-blue-500 rounded-t w-full relative flex items-center justify-center"
                      style={{ height: `${(week.questions / Math.max(...processedData.weeklyTrends.map(w => w.questions))) * 200}px` }}
                    >
                      <span className="text-white font-semibold text-sm">
                        {week.questions}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      {week.week}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t.chatbot.topCustomers}</h3>
                <div className="flex items-center space-x-2">
                  <label htmlFor="week-select" className="text-sm font-medium text-gray-700">
                    {t.chatbot.weekSelection}:
                  </label>
                  <select
                    id="week-select"
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">{t.chatbot.allWeeks}</option>
                    {processedData.weeklyTrends.map((week) => (
                      <option key={week.week} value={week.week}>
                        {week.week}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.chatbot.customer}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.chatbot.questions}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.chatbot.selfResolvedPct}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.chatbot.forwardedCount}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(selectedWeek === 'all' ? processedData.topCustomers : (processedData.weeklyCustomerData.get(selectedWeek) || [])).map((customer, index) => (
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
                          {customer.forwarded}
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
