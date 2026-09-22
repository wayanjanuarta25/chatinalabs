const apiKey = 'sk-kelontong-12oLejsOl2ddk-J0yQvLVSP1BTPcSuPwmicH40tb';

async function run() {
  try {
    const res = await fetch('https://api.kelontongai.id/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5.6-terra',
        messages: [
          { role: 'user', content: "buatkan saya gambar cover tiktok ukuran 9:16 untuk video saya berjudul 'TNI Bersama Rakyat'" }
        ]
      })
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text.slice(0, 1000));
  } catch (err) {
    console.error('Fetch err:', err);
  }
}
run();
