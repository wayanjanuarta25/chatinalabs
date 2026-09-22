import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnkbknbrnatodvkfekyt.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  const { data, error } = await supabase
    .from('messages')
    .select('role, content, metadata')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Query result (role, content, metadata):')
  console.table(data?.map(m => ({
    role: m.role,
    content: m.content.length > 40 ? m.content.slice(0, 40) + '...' : m.content,
    status: (m.metadata as any)?.status,
    model: (m.metadata as any)?.model
  })))
}

main()
