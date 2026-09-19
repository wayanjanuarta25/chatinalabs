export async function consumeTextStream(
  stream: ReadableStream<Uint8Array>,
  onText: (text: string) => void,
) {
  const reader = stream.getReader()
  const decoder = new TextDecoder('utf-8')
  let fullText = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      if (chunk) {
        fullText += chunk
        onText(fullText)
      }
    }

    const finalChunk = decoder.decode()
    if (finalChunk) {
      fullText += finalChunk
      onText(fullText)
    }

    return fullText
  } finally {
    reader.releaseLock()
  }
}
