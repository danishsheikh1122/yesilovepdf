# 🏗️ PDF Upload System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                               │
│  (components/PdfUploadWithQR.tsx)                                   │
│                                                                      │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐           │
│  │  Drag & Drop │   │   QR Code    │   │   Download   │           │
│  │    Upload    │   │   Display    │   │    Button    │           │
│  └──────┬───────┘   └──────▲───────┘   └──────▲───────┘           │
│         │                   │                   │                   │
└─────────┼───────────────────┼───────────────────┼───────────────────┘
          │                   │                   │
          ▼                   │                   │
┌─────────────────────────────┼───────────────────┼───────────────────┐
│                  API ROUTES (Next.js)           │                   │
│                                                 │                   │
│  ┌───────────────────────┐                     │                   │
│  │ POST /api/upload-pdf  │                     │                   │
│  │  1. Validate file     │                     │                   │
│  │  2. Check auth        │                     │                   │
│  │  3. Upload to Supabase│─────────────────────┘                   │
│  │  4. Generate signed URL                                         │
│  │  5. Create QR code    │─────────────────────────────────────────┘
│  └───────────┬───────────┘
│              │
│  ┌───────────▼───────────┐
│  │ GET /api/download-pdf │
│  │  1. Check auth        │
│  │  2. Verify ownership  │
│  │  3. Create signed URL │
│  │  4. Redirect to file  │─────┐
│  └───────────────────────┘     │
│                                 │
│  ┌───────────────────────┐     │
│  │ GET /api/cleanup-files│     │
│  │  (Cron Job - Hourly)  │     │
│  │  1. Verify secret     │     │
│  │  2. List all files    │     │
│  │  3. Find old files    │     │
│  │  4. Delete in batches │─────┤
│  └───────────────────────┘     │
│                                 │
└─────────────────────────────────┼─────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE STORAGE                                 │
│                                                                      │
│  Bucket: processed-files                                            │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │  User Folders (RLS Protected)                                  ││
│  │                                                                 ││
│  │  ├─ user-123/                                                   ││
│  │  │   ├─ 1730000000_document1.pdf                               ││
│  │  │   └─ 1730003600_document2.pdf                               ││
│  │  │                                                              ││
│  │  ├─ user-456/                                                   ││
│  │  │   ├─ 1730001234_report.pdf                                  ││
│  │  │   └─ 1730005678_invoice.pdf                                 ││
│  │  │                                                              ││
│  │  └─ user-789/                                                   ││
│  │      └─ 1730007890_contract.pdf                                ││
│  │                                                                 ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  RLS Policies:                                                      │
│  ✓ Users can upload to their own folder                            │
│  ✓ Users can read their own files                                  │
│  ✓ Users can delete their own files                                │
│  ✓ Service role bypasses all RLS (for cleanup)                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    VERCEL CRON JOB                                  │
│                                                                      │
│  Schedule: 0 * * * * (Every hour)                                   │
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │  Hour 1  │───▶│  Hour 2  │───▶│  Hour 3  │───▶│  Hour 4  │     │
│  │ Cleanup  │    │ Cleanup  │    │ Cleanup  │    │ Cleanup  │     │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘     │
│       │               │               │               │             │
│       └───────────────┴───────────────┴───────────────┘             │
│                       │                                             │
│                       ▼                                             │
│         Deletes files older than 1 hour                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                              │
│                                                                      │
│  User ──▶ Supabase Auth ──▶ JWT Token ──▶ API Routes               │
│             (Email/Password)     │                                  │
│                                  │                                  │
│                                  ▼                                  │
│                         RLS Policies Check                          │
│                          User ID Match                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    FILE LIFECYCLE                                   │
│                                                                      │
│  Upload ──▶ Generate QR ──▶ Download (1hr) ──▶ Auto-Delete (1-2hr) │
│    │            │              │                      │              │
│    │            │              │                      │              │
│    0min       instant       0-60min              60-120min          │
│                                                                      │
│  Status: [Created] ──▶ [Active] ──▶ [Expiring] ──▶ [Deleted]       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    DATA FLOW                                        │
│                                                                      │
│  1. User uploads PDF                                                │
│     ↓                                                               │
│  2. File stored in Supabase: {user_id}/{timestamp}_{name}.pdf      │
│     ↓                                                               │
│  3. Server generates signed URL (expires in 1 hour)                 │
│     ↓                                                               │
│  4. Server creates download URL: /api/download-pdf?path=...         │
│     ↓                                                               │
│  5. Server generates QR code from download URL                      │
│     ↓                                                               │
│  6. QR code + download link sent to user                            │
│     ↓                                                               │
│  7. User scans QR or clicks download                                │
│     ↓                                                               │
│  8. Server verifies auth & ownership                                │
│     ↓                                                               │
│  9. Server creates new signed URL & redirects                       │
│     ↓                                                               │
│  10. File downloads from Supabase                                   │
│     ↓                                                               │
│  11. After 1-2 hours, cron deletes file                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                                  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Layer 1: Supabase Authentication (JWT)                      │  │
│  └────────────────────────────▲─────────────────────────────────┘  │
│                               │                                     │
│  ┌────────────────────────────┴─────────────────────────────────┐  │
│  │  Layer 2: Row Level Security (RLS)                           │  │
│  │  - File path must start with user ID                         │  │
│  └────────────────────────────▲─────────────────────────────────┘  │
│                               │                                     │
│  ┌────────────────────────────┴─────────────────────────────────┐  │
│  │  Layer 3: Ownership Verification in API                      │  │
│  │  - Double-check file belongs to user                         │  │
│  └────────────────────────────▲─────────────────────────────────┘  │
│                               │                                     │
│  ┌────────────────────────────┴─────────────────────────────────┐  │
│  │  Layer 4: Signed URLs                                        │  │
│  │  - Temporary links with auth token                           │  │
│  └────────────────────────────▲─────────────────────────────────┘  │
│                               │                                     │
│  ┌────────────────────────────┴─────────────────────────────────┐  │
│  │  Layer 5: Cron Secret                                        │  │
│  │  - Cleanup endpoint requires secret header                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT VARIABLES                            │
│                                                                      │
│  Client-side (Public):                                              │
│  ├─ NEXT_PUBLIC_SUPABASE_URL                                        │
│  ├─ NEXT_PUBLIC_SUPABASE_ANON_KEY                                   │
│  └─ NEXT_PUBLIC_APP_URL (optional)                                  │
│                                                                      │
│  Server-side (Private):                                             │
│  ├─ SUPABASE_SERVICE_ROLE_KEY ⚠️ NEVER expose to client!           │
│  └─ CRON_SECRET                                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

```

## 🔄 Request Flow Examples

### Upload Request
```
User Browser
    │
    ├─▶ POST /api/upload-pdf (FormData)
    │       │
    │       ├─▶ Check authentication
    │       ├─▶ Validate PDF file
    │       ├─▶ Upload to Supabase Storage
    │       ├─▶ Create signed URL (1h expiry)
    │       ├─▶ Generate QR code
    │       │
    │       └─▶ Response: { qrCode, downloadUrl, signedUrl }
    │
    └─▶ Display QR code & download button
```

### Download Request
```
Mobile Device (QR Scan) or Browser (Click)
    │
    ├─▶ GET /api/download-pdf?path=user-123/file.pdf
    │       │
    │       ├─▶ Check authentication
    │       ├─▶ Verify user owns file (path starts with user ID)
    │       ├─▶ Create fresh signed URL
    │       │
    │       └─▶ Redirect to signed URL
    │
    └─▶ Supabase returns file
```

### Cleanup Job
```
Vercel Cron (Every Hour)
    │
    ├─▶ GET /api/cleanup-files
    │       │   (Header: Authorization: Bearer SECRET)
    │       │
    │       ├─▶ Verify CRON_SECRET
    │       ├─▶ Use service role key (bypasses RLS)
    │       ├─▶ List all files in bucket
    │       ├─▶ Filter files older than 1 hour
    │       ├─▶ Delete in batches of 100
    │       │
    │       └─▶ Response: { deletedCount, executionTime }
    │
    └─▶ Log results
```

---

## 📊 Performance Characteristics

- **Upload Time:** ~1-5 seconds (depends on file size)
- **QR Generation:** ~100-500ms
- **Download Redirect:** <100ms
- **Cleanup Job:** ~1-10 seconds (depends on file count)
- **Max File Size:** 50MB (configurable)
- **Concurrent Uploads:** Unlimited (scales with Supabase)

---

## 🎯 Scalability

- **Storage:** Unlimited (Supabase scales automatically)
- **Bandwidth:** Scales with Supabase plan
- **Cleanup:** Batch processing (100 files at a time)
- **Cron Job:** Vercel handles scheduling
- **Authentication:** JWT-based, stateless

---

This architecture is **production-ready** and designed for:
- ✅ High availability
- ✅ Automatic scaling
- ✅ Security
- ✅ Cost efficiency (auto-cleanup)
- ✅ Easy maintenance
