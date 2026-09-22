import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnkbknbrnatodvkfekyt.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function setup() {
  console.log('Creating/getting knowledge-files bucket...')
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.id === 'knowledge-files')
  
  if (exists) {
    console.log('Bucket knowledge-files already exists.')
  } else {
    const { data, error } = await supabase.storage.createBucket('knowledge-files', {
      public: false,
      fileSizeLimit: 52428800,
      allowedMimeTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/json'
      ]
    })
    if (error) {
      console.error('Failed to create bucket:', error)
    } else {
      console.log('Bucket knowledge-files created successfully:', data)
    }
  }

  // Ensure chat-attachments bucket exists
  const hasChatAttachments = buckets?.some(b => b.id === 'chat-attachments')
  if (hasChatAttachments) {
    console.log('Bucket chat-attachments already exists.')
  } else {
    const { data, error } = await supabase.storage.createBucket('chat-attachments', {
      public: false,
    })
    if (error) {
      console.error('Failed to create chat-attachments bucket:', error)
    } else {
      console.log('Bucket chat-attachments created successfully:', data)
    }
  }

  const { data: verifyList } = await supabase.storage.listBuckets()
  console.log('Current buckets:', verifyList?.map(b => ({ name: b.name, public: b.public })))
}

setup()
