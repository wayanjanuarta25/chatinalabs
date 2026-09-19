import assert from 'node:assert/strict'
import test from 'node:test'
import { consumeTextStream } from '../lib/consume-text-stream.ts'

function streamChunks(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk)
      controller.close()
    },
  })
}

test('consumes raw text chunks without protocol framing', async () => {
  const encoder = new TextEncoder()
  const updates: string[] = []
  const result = await consumeTextStream(
    streamChunks([
      encoder.encode('first line\n'),
      encoder.encode('second line'),
    ]),
    text => updates.push(text),
  )

  assert.equal(result, 'first line\nsecond line')
  assert.deepEqual(updates, ['first line\n', 'first line\nsecond line'])
})

test('preserves UTF-8 characters split across byte boundaries', async () => {
  const encoded = new TextEncoder().encode('Halo 👋 dunia')
  const emojiStart = new TextEncoder().encode('Halo ').length
  const updates: string[] = []
  const result = await consumeTextStream(
    streamChunks([
      encoded.slice(0, emojiStart + 1),
      encoded.slice(emojiStart + 1, emojiStart + 3),
      encoded.slice(emojiStart + 3),
    ]),
    text => updates.push(text),
  )

  assert.equal(result, 'Halo 👋 dunia')
  assert.equal(updates.at(-1), 'Halo 👋 dunia')
})

test('keeps decoded partial text when the stream aborts', async () => {
  const encoder = new TextEncoder()
  const abortError = new DOMException('Stopped', 'AbortError')
  let latestText = ''
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (!latestText) {
        controller.enqueue(encoder.encode('partial response'))
      } else {
        controller.error(abortError)
      }
    },
  })

  await assert.rejects(
    consumeTextStream(stream, text => {
      latestText = text
    }),
    error => error === abortError,
  )
  assert.equal(latestText, 'partial response')
})
