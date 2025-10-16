# PDF Usage Tracking with Firebase - Setup Guide

This guide will help you set up Firebase-based PDF usage tracking for your Next.js application.

## 📋 Prerequisites

- A Firebase account (free tier works fine)
- Node.js and npm/pnpm installed
- Your Next.js application running

## 🚀 Step-by-Step Setup

### 1. Install Firebase

```bash
npm install firebase
# or
pnpm add firebase
```

### 2. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter your project name (e.g., "pdf-usage-tracker")
4. Disable Google Analytics (optional for this use case)
5. Click "Create project"

### 3. Setup Firestore Database

1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select a location closest to your users
5. Click "Done"

### 4. Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ → "Project settings"
2. Scroll down to "Your apps" section
3. Click the "</>" icon to add a web app
4. Register your app with a nickname
5. Copy the `firebaseConfig` object values

### 5. Setup Environment Variables

Create `.env.local` in your project root:

```bash
# Copy these values from your Firebase project settings
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MSG_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 6. Security Rules (Important!)

In Firestore Console, go to "Rules" and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to pdf_usage_logs collection
    match /pdf_usage_logs/{document} {
      allow read, write: if true;
    }
    
    // Deny access to all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 📂 Files Created

The setup has created these files:

- `utils/firebaseClient.ts` - Firebase configuration and setup
- `app/api/log-pdf-usage/route.ts` - API endpoint for logging usage
- `app/api/get-total-usage/route.ts` - API endpoint for fetching stats
- `lib/pdfTracking.ts` - Helper functions for easy usage tracking
- `components/UsageDashboard.tsx` - Dashboard component to view statistics
- `.env.example` - Environment variables template

## 🔧 How to Use

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

#### In a Compress Component:
```typescript
import { pdfTrackers } from '@/lib/pdfTracking';

const handleCompress = async (file: File) => {
  try {
    // Your compression logic here
    const compressedFile = await compressPdf(file);
    
    // Track the action
    await pdfTrackers.compress(file);
    
    return compressedFile;
  } catch (error) {
    console.error('Compression failed:', error);
  }
};
```

#### In a Merge Component:
```typescript
import { pdfTrackers } from '@/lib/pdfTracking';

const handleMerge = async (files: File[]) => {
  try {
    // Your merge logic here
    const mergedFile = await mergePdfs(files);
    
    // Track the action
    await pdfTrackers.merge(files);
    
    return mergedFile;
  } catch (error) {
    console.error('Merge failed:', error);
  }
};
```

### Viewing Usage Statistics

Add the dashboard to any page:

```typescript
import UsageDashboard from '@/components/UsageDashboard';

export default function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <UsageDashboard />
    </div>
  );
}
```

### Fetching Usage Data Programmatically

```typescript
import { getTotalUsage } from '@/lib/pdfTracking';

const stats = await getTotalUsage();
console.log('Total actions:', stats.totalActions);
console.log('Unique users:', stats.uniqueUsers);
console.log('Top actions:', stats.topActions);
```

## 📊 Firestore Data Structure

Each logged action creates a document in the `pdf_usage_logs` collection:

```javascript
{
  ip_address: "192.168.1.100",
  pdf_name: "document.pdf",
  action_type: "compress",
  created_at: Timestamp,
  user_agent: "Mozilla/5.0...",
  file_size: 1024000
}
```

## 🔍 Available Actions

The system tracks these PDF actions:

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
- `scan-to-pdf` - Scanning to PDF
- `html-to-pdf` - HTML to PDF conversion
- `jpg-to-pdf` - JPG to PDF conversion
- `word-to-pdf` - Word to PDF conversion
- `powerpoint-to-pdf` - PowerPoint to PDF conversion
- `excel-to-pdf` - Excel to PDF conversion
- `other` - Any other action

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Firestore Rules**: The provided rules allow anonymous read/write to the usage logs collection only
3. **Data Privacy**: IP addresses are stored for analytics but consider GDPR compliance if needed
4. **Rate Limiting**: Consider implementing rate limiting on your API endpoints for production

## 📈 Analytics & Insights

The system provides:

- **Total PDF Actions**: Count of all operations
- **Unique Users**: Based on IP addresses
- **Popular Actions**: Most frequently used features
- **Recent Activity**: Latest user actions
- **Time-based Analytics**: When users are most active

## 🚨 Troubleshooting

### Common Issues:

1. **Firebase imports failing**: Make sure you've installed the firebase package
2. **Environment variables not working**: Ensure they start with `NEXT_PUBLIC_`
3. **Firestore permission denied**: Check your Firestore security rules
4. **API routes not working**: Verify the file paths match the Next.js 13+ app router structure

### Debugging:

1. Check browser console for any Firebase errors
2. Verify environment variables are set correctly
3. Test API endpoints directly using tools like Postman
4. Check Firestore console to see if data is being written

## 🎯 Next Steps

1. **Enhanced Analytics**: Add more detailed tracking (session duration, user geography)
2. **Dashboard Improvements**: Add charts, filtering, and export functionality
3. **Notifications**: Set up alerts for usage thresholds
4. **Performance Monitoring**: Track operation success rates and performance
5. **User Feedback**: Implement feedback collection alongside usage tracking

## 📞 Support

If you encounter issues:

1. Check the Firebase Console for any error messages
2. Verify your Firestore rules are correctly set
3. Ensure all environment variables are properly configured
4. Check that your API routes are accessible

This tracking system is designed to be lightweight, anonymous, and easy to implement across your PDF tools. It provides valuable insights into user behavior without requiring authentication or complex setup.