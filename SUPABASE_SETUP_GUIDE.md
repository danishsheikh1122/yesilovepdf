# PDF Usage Tracking with Supabase - Complete Setup Guide

This guide will help you set up Supabase-based PDF usage tracking for your Next.js application. Supabase is more developer-friendly than Firebase and offers better SQL support.

## 📋 Prerequisites

- A Supabase account (free tier works perfectly)
- Node.js and npm/pnpm installed
- Your Next.js application running

## 🚀 Step-by-Step Setup

### 1. Install Supabase

```bash
npm install @supabase/supabase-js
# or
pnpm add @supabase/supabase-js
```

### 2. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New project"
3. Choose your organization
4. Enter project name (e.g., "pdf-usage-tracker")
5. Enter a strong database password
6. Select a region closest to your users
7. Click "Create new project"

### 3. Setup Database Table

1. In your Supabase project, go to the **SQL Editor**
2. Click "New query"
3. Copy and paste this SQL:

```sql
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

-- Enable Row Level Security (optional, for better security)
ALTER TABLE pdf_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to insert and read
CREATE POLICY "Anyone can insert pdf usage logs" ON pdf_usage_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read pdf usage logs" ON pdf_usage_logs
  FOR SELECT USING (true);
```

4. Click "Run" to execute the SQL

### 4. Get Supabase Configuration

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the **Project URL**
3. Copy the **anon public** key (under Project API keys)

### 5. Setup Environment Variables

Create `.env.local` in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Replace with your actual values from step 4!**

## 📂 Files Already Created

The setup has created/updated these files:

- `utils/supabaseClient.ts` - Supabase configuration and types
- `app/api/log-pdf-usage/route.ts` - API endpoint for logging usage (updated for Supabase)
- `app/api/get-total-usage/route.ts` - API endpoint for fetching stats (updated for Supabase)
- `lib/pdfTracking.ts` - Helper functions for easy usage tracking (updated)
- `components/TrustedByStats.tsx` - Dashboard component (works with both)
- `.env.example` - Environment variables template (updated for Supabase)

## 🔧 How to Use (Same as Before!)

### Basic Usage Tracking

```typescript
import { logPdfUsage, pdfTrackers } from '@/lib/pdfTracking';

// Method 1: Direct logging
await logPdfUsage({
  pdfName: 'document.pdf',
  actionType: 'compress',
  fileSize: 1024000
});

// Method 2: Using convenience functions
await pdfTrackers.compress(file);
await pdfTrackers.merge([file1, file2]);
await pdfTrackers.convertToJpg(file);
```

### Integration Examples

**All your existing tracking code will work without changes!**

```typescript
import { pdfTrackers } from '@/lib/pdfTracking';

const handleCompress = async (file: File) => {
  try {
    // Your compression logic here
    const compressedFile = await compressPdf(file);
    
    // Track the action (same as before)
    await pdfTrackers.compress(file);
    
    return compressedFile;
  } catch (error) {
    console.error('Compression failed:', error);
  }
};
```

## 📊 Supabase Data Structure

Each logged action creates a row in the `pdf_usage_logs` table:

```sql
id          | SERIAL PRIMARY KEY
ip_address  | VARCHAR(45)
pdf_name    | VARCHAR(255)
action_type | VARCHAR(50)
created_at  | TIMESTAMP WITH TIME ZONE
user_agent  | TEXT
file_size   | BIGINT
```

## 🔍 Available Actions (Same as Before)

- `compress` - PDF compression
- `merge` - Merging multiple PDFs
- `split` - Splitting PDF pages
- `crop` - Cropping PDF pages
- `rotate` - Rotating PDF pages
- `edit` - PDF editing
- `convert-to-jpg` - Convert PDF to JPG
- `convert-to-word` - Convert PDF to Word
- `convert-to-powerpoint` - Convert PDF to PowerPoint
- `convert-to-excel` - Convert PDF to Excel
- `add-watermark` - Adding watermarks
- `add-page-numbers` - Adding page numbers
- `organize` - Organizing PDF pages
- `remove-pages` - Removing pages
- `extract-pages` - Extracting pages
- And more...

## ✨ Why Supabase is Better

### Advantages over Firebase:
1. **Real SQL Database** - PostgreSQL with full SQL support
2. **Better Developer Experience** - More intuitive dashboard
3. **Built-in Analytics** - Native dashboard and monitoring
4. **Lower Cost** - More generous free tier
5. **Open Source** - Can self-host if needed
6. **Real-time** - Built-in real-time subscriptions
7. **Better TypeScript Support** - Auto-generated types

### Database Features:
- **Advanced Queries** - Use SQL joins, aggregations, etc.
- **Built-in Analytics** - Monitor usage directly in Supabase
- **Data Export** - Easy CSV/JSON export
- **Backup & Restore** - Automated backups
- **Scaling** - Easy horizontal scaling

## 📈 Advanced Analytics with SQL

You can run custom queries directly in Supabase:

```sql
-- Most popular PDF actions
SELECT action_type, COUNT(*) as usage_count 
FROM pdf_usage_logs 
GROUP BY action_type 
ORDER BY usage_count DESC;

-- Daily usage trends
SELECT DATE(created_at) as date, COUNT(*) as actions
FROM pdf_usage_logs 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Top user countries (if you track IP geolocation)
SELECT ip_address, COUNT(*) as actions
FROM pdf_usage_logs 
GROUP BY ip_address 
ORDER BY actions DESC 
LIMIT 10;
```

## 🔒 Security Features

1. **Row Level Security (RLS)** - Built-in data protection
2. **API Rate Limiting** - Automatic DDoS protection
3. **Environment Variables** - Secure key management
4. **HTTPS Only** - All connections encrypted
5. **GDPR Compliant** - Built-in compliance features

## 🚨 Troubleshooting

### Common Issues:

1. **Supabase connection failed**: Check your environment variables
2. **Table not found**: Make sure you ran the SQL setup script
3. **Permission denied**: Check your RLS policies
4. **API routes not working**: Verify the file paths match Next.js 13+ structure

### Debugging:

1. Check Supabase dashboard → **Logs** for any errors
2. Verify environment variables in `.env.local`
3. Test API endpoints directly using tools like Postman
4. Check the **SQL Editor** to see if data is being inserted

## 🎯 Next Steps

1. **Enhanced Analytics** - Use Supabase's built-in analytics
2. **Real-time Dashboard** - Add real-time subscriptions
3. **Geographic Analytics** - Add IP-to-location mapping
4. **Performance Monitoring** - Track operation success rates
5. **User Feedback** - Implement feedback collection

## 📞 Support

If you encounter issues:

1. Check the Supabase Dashboard logs
2. Verify your database table was created correctly
3. Ensure all environment variables are properly configured
4. Test that your API routes are accessible

**Supabase offers better performance, easier scaling, and more powerful analytics than Firebase while maintaining the same simple API!** 🚀