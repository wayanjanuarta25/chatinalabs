const apiKey = 'sk-kelontong-12oLejsOl2ddk-J0yQvLVSP1BTPcSuPwmicH40tb';

async function run() {
  const res = await fetch('https://api.kelontongai.id/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-5.6-sol',
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI prompt engineer for OpenAI DALL-E 3. Transform the user request into an ultra-detailed, photorealistic cinematic prompt with exact text typography, composition, lighting, camera settings, and cultural authenticity. Output only the prompt in English.'
        },
        {
          role: 'user',
          content: "buatkan saya gambar cover tiktok ukuran 9:16 untuk video saya berjudul 'TNI Bersama Rakyat'"
        }
      ]
    })
  });
  const data = await res.json();
  console.log('Result:', data.choices[0].message.content);
}
run();
