// NPS Automation Types
// Type definitions voor NPS Detractor Automation systeem

export interface NPSResponse {
  id: string;
  cli_name: string;
  response_date: string;
  week: string | null;
  user_email: string;
  user_first_name: string | null;
  user_last_name: string | null;
  feedback: string | null;
  score: number;
  imported_at: string;
  imported_by: string | null;
  is_detractor: boolean;
  is_passive: boolean;
  is_promoter: boolean;
}

export interface NPSOutreach {
  id: string;
  nps_response_id: string;
  sent_at: string | null;
  sent_from: string;
  sent_to: string;
  email_subject: string | null;
  email_body: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  resend_email_id: string | null;
  error_message: string | null;
  response_received_at: string | null;
  response_text: string | null;
  response_sentiment: 'positive' | 'neutral' | 'negative' | null;
  response_summary: string | null;
  response_category: string | null;
  response_urgency: 'low' | 'medium' | 'high' | 'critical' | null;
  response_action_items: string[] | null;
  ai_analysis: AIAnalysis | null;
  created_at: string;
  updated_at: string;
}

export interface CSMTask {
  id: string;
  nps_outreach_id: string | null;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DetractorOverview {
  id: string;
  cli_name: string;
  user_email: string;
  user_first_name: string | null;
  user_last_name: string | null;
  score: number;
  feedback: string | null;
  response_date: string;
  imported_at: string;
  outreach_status: 'not_sent' | 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at: string | null;
  response_received_at: string | null;
  response_sentiment: 'positive' | 'neutral' | 'negative' | null;
  response_urgency: 'low' | 'medium' | 'high' | 'critical' | null;
  response_summary: string | null;
  open_tasks: number;
}

export interface DashboardStats {
  total_detractors: number;
  detractors_emailed: number;
  detractors_responded: number;
  detractors_resolved: number;
  response_rate_percent: number | null;
  avg_detractor_score: number | null;
}

// CSV Import Types
export interface BeamerCSVRow {
  cli_name: string;
  date: string;
  week: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  feedback: string;
  score: string | number;
}

export interface ImportPreview {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  detractors_count: number;
  new_responses: number;
  duplicate_responses: number;
  rows: BeamerCSVRow[];
}

// AI Analysis Types
export interface AIAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
  main_issue: string;
  category: string;
  action_items: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  suggested_response: string;
}

export interface AIAnalysisRequest {
  cli_name: string;
  score: number;
  feedback: string | null;
  response_text: string;
}

// Email Types
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from: string;
}

export interface SendEmailResponse {
  success: boolean;
  email_id?: string;
  error?: string;
}

// Filter and Sort Types
export type DetractorStatus = 'all' | 'not_sent' | 'sent' | 'responded' | 'resolved';
export type DetractorSortField = 'date' | 'score' | 'cli_name' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface DetractorFilters {
  status: DetractorStatus;
  search: string;
  date_from: string | null;
  date_to: string | null;
  score_min: number | null;
  score_max: number | null;
}

export interface DetractorSort {
  field: DetractorSortField;
  direction: SortDirection;
}
