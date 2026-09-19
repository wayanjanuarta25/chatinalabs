import { AIStreamChunk } from './types'

/**
 * Creates an asynchronous iterable stream from raw text, simulating streaming chunks.
 */
export async function* createStreamFromText(
  text: string,
  chunkSize: number = 2,
  delayMs: number = 15
): AsyncIterable<AIStreamChunk> {
  const streamId = `chunk-${Date.now()}`
  let currentIndex = 0

  while (currentIndex < text.length) {
    const nextIndex = Math.min(currentIndex + chunkSize, text.length)
    const delta = text.slice(currentIndex, nextIndex)
    currentIndex = nextIndex
    const isFinished = currentIndex >= text.length

    yield {
      id: streamId,
      delta,
      isFinished,
      finishReason: isFinished ? 'stop' : undefined,
    }

    if (!isFinished && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
}

/**
 * Collects all stream chunks into a single concatenated string.
 */
export async function collectStreamText(
  stream: AsyncIterable<AIStreamChunk>
): Promise<string> {
  let fullText = ''
  for await (const chunk of stream) {
    fullText += chunk.delta
  }
  return fullText
}

/**
 * Converts an AIStreamChunk async iterable into a Web ReadableStream of UTF-8 encoded text.
 */
export function createReadableStream(
  stream: AsyncIterable<AIStreamChunk>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const iterator = stream[Symbol.asyncIterator]()

  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next()
        if (done) {
          controller.close()
        } else if (value) {
          controller.enqueue(encoder.encode(value.delta))
        }
      } catch (err) {
        controller.error(err)
      }
    },
    async cancel() {
      if (iterator.return) {
        await iterator.return()
      }
    },
  })
}
