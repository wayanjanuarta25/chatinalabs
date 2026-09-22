import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnkbknbrnatodvkfekyt.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function inspect() {
  console.log('--- Inspecting Tables ---')
  // We can query pg_tables via Supabase CLI or rpc or direct query
  // Let's test select from the tables
  const tables = ['workspaces', 'workspace_members', 'knowledge_bases', 'documents', 'document_chunks', 'embeddings', 'processing_jobs']
  for (const table of tables) {
    const { data, error } = await supabase.from(table as any).select('*').limit(1)
    if (error) {
      console.log(`Table ${table}: ERROR / NOT FOUND (${error.message})`)
    } else {
      console.log(`Table ${table}: EXISTS (${data?.length} rows checked)`)
    }
  }

  console.log('\n--- Inspecting Storage Buckets ---')
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets()
  if (bucketErr) {
    console.error('Bucket Error:', bucketErr.message)
  } else {
    console.log('Buckets:', buckets.map(b => ({ id: b.id, name: b.name, public: b.public })))
  }
}

inspect()
