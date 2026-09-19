# chatINALabs AI — Production Deployment Guide

This guide details the complete audit, configuration, database provisioning, and deployment process for taking **chatINALabs AI** into production.

---

## 1. Production Architecture Overview

- **Framework**: Next.js 16.3.5 (App Router, Turbopack, React 19)
- **Database & Auth**: Supabase PostgreSQL with `pgvector` (cosine similarity 1536d) & Supabase Auth SSR
- **Storage**: Supabase Storage (`knowledge-files` private bucket with workspace RLS)
- **AI Streaming & Embeddings**: OpenAI API (`gpt-4o`, `gpt-4o-mini`, `text-embedding-3-small`) with graceful fallback
- **Security**: Strict Row Level Security (RLS) across all multi-tenant tables, anti-open-redirect auth callbacks, and HTTP security headers (`nosniff`, `DENY`, `strict-origin-when-cross-origin`).

---

## 2. Environment Variables Checklist

Set these variables in your production environment settings (Vercel Project Settings, Docker environment, or Cloud platform secrets):

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Your production Supabase project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Public publishable / anon client key | `eyJhbGciOi...` |
| `OPENAI_API_KEY` | **Yes** | Production OpenAI secret key (server-side only) | `sk-proj-...` |
| `NEXT_PUBLIC_APP_URL` | **Recommended** | Canonical domain for auth callback redirects | `https://chat.yourdomain.com` |
| `OPENAI_BASE_URL` | Optional | Custom proxy, Azure, or LiteLLM endpoint | `https://api.openai.com/v1` |
| `ANTHROPIC_API_KEY` | Optional | Anthropic Claude API key if enabled | `sk-ant-...` |

> [!CAUTION]
> Never commit `.env.local` or any production secret keys to version control. `OPENAI_API_KEY` must never be prefixed with `NEXT_PUBLIC_`.

---

## 3. Supabase Production Database Setup

Run the migrations located in [`supabase/migrations/`](file:///c:/xampp/htdocs/chatinalabs/supabase/migrations) sequentially on your production Supabase database via the **Supabase CLI** or the **Supabase SQL Editor**:

```bash
# Option A: Supabase CLI
supabase link --project-ref <your-project-id>
supabase db push
```

### Migration Execution Order:
1. [`001_initial_schema.sql`](file:///c:/xampp/htdocs/chatinalabs/supabase/migrations/001_initial_schema.sql)
   - Extensions: `uuid-ossp`, `pgcrypto`
   - Core tables: `profiles`, `workspaces`, `workspace_members`, `conversations`, `messages`, `files`, `memories`, `usage_logs`
   - Comprehensive Row Level Security (RLS) policies and `update_updated_at` triggers.
2. [`002_auth_workspace_trigger.sql`](file:///c:/xampp/htdocs/chatinalabs/supabase/migrations/002_auth_workspace_trigger.sql)
   - `on_auth_user_created` trigger on `auth.users`
   - Automatically provisions a public profile and personal default workspace on user sign-up.
3. [`003_knowledge_base_rag_foundation.sql`](file:///c:/xampp/htdocs/chatinalabs/supabase/migrations/003_knowledge_base_rag_foundation.sql)
   - Tables: `knowledge_bases`, `documents`, `document_chunks`
   - Workspace isolation RLS policies and cascading foreign keys.
4. [`004_knowledge_files_storage_and_jobs.sql`](file:///c:/xampp/htdocs/chatinalabs/supabase/migrations/004_knowledge_files_storage_and_jobs.sql)
   - Creates private `knowledge-files` storage bucket (50 MB limit, PDF/DOCX/TXT/MD/CSV types).
   - Storage RLS policies for `storage.objects` enforcing workspace isolation.
   - Creates `processing_jobs` pipeline queue table with RLS.
5. [`005_embedding_foundation.sql`](file:///c:/xampp/htdocs/chatinalabs/supabase/migrations/005_embedding_foundation.sql)
   - Enables `vector` extension (`pgvector`).
   - Adds `embedding vector(1536)`, `embedding_model`, and `embedded_at` to `document_chunks`.
   - Creates high-performance HNSW index using cosine similarity (`vector_cosine_ops`).
6. [`006_vector_search.sql`](file:///c:/xampp/htdocs/chatinalabs/supabase/migrations/006_vector_search.sql)
   - Creates `match_document_chunks()` RPC function (`SECURITY DEFINER`).
   - Strict workspace member verification before vector distance calculation.

---

## 4. Supabase Auth Dashboard Configuration

In your Supabase project dashboard (**Authentication** > **URL Configuration**):

1. **Site URL**:
   - Set to your canonical production URL: `https://chat.yourdomain.com`
2. **Redirect URLs**:
   - Add: `https://chat.yourdomain.com/auth/callback`
   - Add: `https://chat.yourdomain.com/**`
   - If using staging/preview environments, add preview URL wildcards (e.g. `https://*-your-org.vercel.app/**`).

---

## 5. Build & Deployment Platforms

### A. Deploying to Vercel (Recommended)
1. Push repository to your Git provider (GitHub / GitLab).
2. Import project in Vercel.
3. In **Project Settings** > **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Deploy! Vercel automatically runs `npm run build`.

### B. Deploying with Node.js / Docker
1. Build the production package:
   ```bash
   npm ci
   npm run build
   ```
2. Start the production server:
   ```bash
   NODE_ENV=production npm run start
   ```

---

## 6. Pre-flight Verification Checklist

- [x] **TypeScript compilation**: Clean zero-error pass (`npx tsc --noEmit`).
- [x] **Next.js Production Build**: All 14 routes compiled and statically/dynamically optimized (`npm run build`).
- [x] **Automated Tests**: 89/89 automated tests passing across processing, embeddings, vector search, and RAG pipelines.
- [x] **Security Hardening**:
  - `poweredByHeader` disabled.
  - Security headers configured (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
  - Open redirect protection on `app/auth/callback/route.ts`.
  - Reverse proxy header awareness (`x-forwarded-host`, `x-forwarded-proto`).
  - Strict RLS and storage workspace isolation policies verified.
- [x] **Version Control Hygiene**:
  - `.gitignore` allows `.env.example` template while safely excluding live `.env*` files.
  - Zero hardcoded API keys or secrets detected in codebase.
