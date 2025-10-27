// AI Service Architecture
// Privacy-first AI implementation

interface AIAnalysisRequest {
  workspaceId: string;
  uploadId: string;
  analysisType: 'customer_behavior' | 'revenue_trends' | 'churn_prediction' | 'custom';
  customPrompt?: string;
  dataSummary: DataSummary; // Only metadata, not actual customer data
}

interface DataSummary {
  totalRecords: number;
  columns: ColumnInfo[];
  dataTypes: Record<string, string>;
  sampleValues: Record<string, unknown[]>; // Only sample values, not full data
  businessContext: string; // Business description from user
}

interface ColumnInfo {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  description?: string;
  sampleValues: unknown[];
}

interface AIAnalysisResult {
  insights: Insight[];
  recommendations: Recommendation[];
  dashboardSuggestions: DashboardSuggestion[];
  confidenceScore: number;
}

interface Insight {
  type: 'trend' | 'pattern' | 'anomaly' | 'correlation';
  title: string;
  description: string;
  dataPoints: DataPoint[];
  significance: 'low' | 'medium' | 'high';
}

interface Recommendation {
  category: 'action' | 'optimization' | 'warning' | 'opportunity';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: string;
}

interface DashboardSuggestion {
  name: string;
  description: string;
  widgets: WidgetSuggestion[];
  layout: LayoutConfig;
}

interface WidgetSuggestion {
  type: 'chart' | 'metric' | 'table' | 'text';
  title: string;
  dataQuery: string;
  config: Record<string, unknown>;
}

interface DataPoint {
  label: string;
  value: number;
  timestamp?: string;
}

interface LayoutConfig {
  rows: number;
  cols: number;
  theme?: string;
}

// AI Agent per workspace
interface WorkspaceAIAgent {
  workspaceId: string;
  agentId: string;
  personality: string;
  trainingContext: string;
  customPrompts: string[];
  analysisHistory: string[];
}

// Privacy controls
interface PrivacyControls {
  dataRetentionDays: number;
  allowExternalAnalysis: boolean;
  dataAnonymizationLevel: 'none' | 'partial' | 'full';
  aiModelVersion: string;
}

export type {
  AIAnalysisRequest,
  DataSummary,
  ColumnInfo,
  AIAnalysisResult,
  Insight,
  Recommendation,
  DashboardSuggestion,
  WidgetSuggestion,
  DataPoint,
  LayoutConfig,
  WorkspaceAIAgent,
  PrivacyControls
};
