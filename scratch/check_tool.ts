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
      tools: [
        {
          type: 'function',
          function: {
            name: 'generate_image',
            description: 'Generate a photorealistic high-quality image, poster, or cover',
            parameters: {
              type: 'object',
              properties: {
                prompt: { type: 'string', description: 'Detailed English prompt for image generation' },
                aspect_ratio: { type: 'string', enum: ['9:16', '16:9', '1:1', '4:3', '3:4'] },
              },
              required: ['prompt'],
            },
          },
        },
      ],
    }),
  })

  const data = await res.json()
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]
  if (toolCall) {
    console.log('Tool name:', toolCall.function.name)
    console.log('Arguments:\n', toolCall.function.arguments)
  } else {
    console.log('No tool call:', JSON.stringify(data.choices?.[0]?.message, null, 2))
  }
}

main().catch(console.error)
