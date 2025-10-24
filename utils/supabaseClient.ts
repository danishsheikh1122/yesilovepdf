import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface PdfUsageLog {
  id?: number
  ip_address: string
  pdf_name: string
  action_type: string
  created_at?: string
  user_agent?: string
  file_size?: number
}

export interface UsageStats {
  totalActions: number
  uniqueUsers: number
  topActions: { action: string; count: number }[]
  recentActivity: PdfUsageLog[]
}

// SQL for creating the table (run this in Supabase SQL editor)
export const CREATE_TABLE_SQL = `
-- Create pdf_usage_logs table
CREATE TABLE IF NOT EXISTS pdf_usage_logs (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  pdf_name VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  file_size BIGINT
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_pdf_usage_created_at ON pdf_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_pdf_usage_action_type ON pdf_usage_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_pdf_usage_ip_address ON pdf_usage_logs(ip_address);

-- Enable Row Level Security (optional, for better security)
ALTER TABLE pdf_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to insert and read (adjust as needed)
CREATE POLICY "Anyone can insert pdf usage logs" ON pdf_usage_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read pdf usage logs" ON pdf_usage_logs
  FOR SELECT USING (true);
`;