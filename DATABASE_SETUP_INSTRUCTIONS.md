# 🚀 IMMEDIATE SUPABASE DATABASE SETUP

## Step 1: Access Supabase SQL Editor

1. **Go to your Supabase project dashboard** (opened in browser)
2. **Click on "SQL Editor"** in the left sidebar
3. **Click "New query"** button

## Step 2: Execute Database Setup Script

**Copy and paste this entire SQL script into the SQL Editor:**

```sql
-- PDF Usage Tracking Database Setup for Supabase
-- Run this script in your Supabase SQL Editor

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pdf_usage_created_at ON pdf_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_pdf_usage_action_type ON pdf_usage_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_pdf_usage_ip_address ON pdf_usage_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_pdf_usage_action_date ON pdf_usage_logs(action_type, created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE pdf_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access
-- Policy to allow anyone to insert new usage logs
CREATE POLICY "Allow anonymous inserts" ON pdf_usage_logs
  FOR INSERT TO anon
  WITH CHECK (true);

-- Policy to allow anyone to read usage logs (for statistics)
CREATE POLICY "Allow anonymous reads" ON pdf_usage_logs
  FOR SELECT TO anon
  USING (true);

-- Grant necessary permissions to anonymous users
GRANT INSERT, SELECT ON pdf_usage_logs TO anon;
GRANT USAGE ON SEQUENCE pdf_usage_logs_id_seq TO anon;

-- Insert some sample data to test the setup
INSERT INTO pdf_usage_logs (ip_address, pdf_name, action_type, file_size) VALUES
('127.0.0.1', 'sample-document.pdf', 'compress', 1024000),
('127.0.0.1', 'test-file.pdf', 'merge', 2048000),
('127.0.0.1', 'example.pdf', 'convert-to-jpg', 512000);

-- Verify the table was created successfully
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT ip_address) as unique_users,
  COUNT(DISTINCT action_type) as action_types
FROM pdf_usage_logs;

-- Test analytics queries
SELECT 
  action_type,
  COUNT(*) as usage_count,
  AVG(file_size) as avg_file_size
FROM pdf_usage_logs 
GROUP BY action_type 
ORDER BY usage_count DESC;
```

## Step 3: Execute the Script

1. **Click the "Run" button** (or press Ctrl+Enter / Cmd+Enter)
2. **Wait for execution to complete** (should see success messages)
3. **Verify you see the test results** at the bottom showing 3 records

## Step 4: Verify Table Creation

After running the script, you should see:
- ✅ Table `pdf_usage_logs` created
- ✅ Indexes created for performance
- ✅ RLS policies enabled
- ✅ Anonymous permissions granted
- ✅ 3 sample records inserted
- ✅ Analytics query results displayed

## Step 5: Test Your Application

After the database setup:
1. **Restart your Next.js development server**
2. **Visit your application**
3. **Try using a PDF tool** (compress, merge, etc.)
4. **Check if tracking works** without errors

## 🎯 Expected Results

Once completed:
- ✅ No more "table not found" errors
- ✅ PDF usage tracking works automatically
- ✅ Statistics display correctly
- ✅ Anonymous tracking enabled

## 🚨 If You See Errors

If you encounter permission errors:
1. Make sure you're logged into the correct Supabase project
2. Verify you have admin access to the project
3. Try running each section of the SQL script separately

## 📊 Database Schema

Your `pdf_usage_logs` table will have:
- `id` - Auto-incrementing primary key
- `ip_address` - User's IP (for unique user counting)
- `pdf_name` - Name of the PDF file processed
- `action_type` - Type of action (compress, merge, etc.)
- `created_at` - Timestamp of the action
- `user_agent` - Browser/client information (optional)
- `file_size` - Size of the processed file (optional)

**Execute this script now and your PDF tracking will be fully operational!** 🚀