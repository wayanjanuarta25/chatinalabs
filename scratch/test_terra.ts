import fs from 'fs'

if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  }
}

async function main() {
  const key = process.env.KELONTONGAI_API_KEY
  console.log('Sending request to KelontongAI gpt-5.6-terra...')

  const res = await fetch('https://api.kelontongai.id/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5.6-terra',
      messages: [
        {
          role: 'user',
          content: 'buatkan saya gambar cover tiktok ukuran 9:16 untuk video saya berjudul "TNI Bersama Rakyat"',
        },
      ],
      stream: false,
    }),
  })

  console.log('Status:', res.status)
  const data = await res.json()
  fs.writeFileSync('scratch/terra_response.json', JSON.stringify(data, null, 2))
  console.log('Saved response to scratch/terra_response.json')
  console.log('Choices message:', JSON.stringify(data.choices?.[0]?.message, null, 2).slice(0, 1500))
}

main().catch(console.error)
