import { EmbeddingBatchResult, EmbeddingProvider, EmbeddingResult } from './types'

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small'
export const DEFAULT_EMBEDDING_DIMENSIONS = 1536

/**
 * Real OpenAI Embedding Provider using OpenAI's REST API.
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly id = 'openai'
  readonly model: string
  readonly dimensions: number
  private apiKey: string

  constructor(model: string = DEFAULT_EMBEDDING_MODEL, dimensions: number = DEFAULT_EMBEDDING_DIMENSIONS) {
    this.model = model
    this.dimensions = dimensions
    this.apiKey = process.env.OPENAI_API_KEY || ''
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const batchResult = await this.embedBatch([text])
    return {
      vector: batchResult.embeddings[0],
      model: batchResult.model,
      tokens: batchResult.totalTokens,
    }
  }

  async embedBatch(texts: string[]): Promise<EmbeddingBatchResult> {
    if (!this.apiKey || this.apiKey === 'your_openai_api_key' || this.apiKey === 'placeholder-key') {
      throw new Error('Valid OPENAI_API_KEY is not configured.')
    }

    if (texts.length === 0) {
      return { embeddings: [], model: this.model, totalTokens: 0 }
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: this.model,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `OpenAI embedding request failed (${response.status}): ${
          errorData.error?.message || response.statusText
        }`
      )
    }

    const json = await response.json()
    const embeddings = json.data.map((item: { embedding: number[] }) => item.embedding)
    const totalTokens = json.usage?.total_tokens || Math.ceil(texts.join(' ').length / 4)

    return {
      embeddings,
      model: this.model,
      totalTokens,
    }
  }
}

/**
 * Simulated Embedding Provider for offline development, local tests, or when API key is unconfigured.
 * Generates deterministic, normalized 1536-dimensional unit vectors based on text token hashing.
 */
export class SimulatedEmbeddingProvider implements EmbeddingProvider {
  readonly id = 'simulated'
  readonly model = 'simulated-embedding-3-small'
  readonly dimensions = DEFAULT_EMBEDDING_DIMENSIONS

  async embed(text: string): Promise<EmbeddingResult> {
    const vector = this.generateDeterministicVector(text)
    const tokens = Math.max(1, Math.ceil(text.length / 4))
    return {
      vector,
      model: this.model,
      tokens,
    }
  }

  async embedBatch(texts: string[]): Promise<EmbeddingBatchResult> {
    const embeddings = texts.map(t => this.generateDeterministicVector(t))
    const totalTokens = texts.reduce((acc, t) => acc + Math.max(1, Math.ceil(t.length / 4)), 0)

    return {
      embeddings,
      model: this.model,
      totalTokens,
    }
  }

  /**
   * Generates a deterministic unit-length 1536-dimensional vector for a given text.
   * Cosine similarity between similar texts will yield higher scores than unrelated texts.
   */
  private generateDeterministicVector(text: string): number[] {
    const vector = new Array<number>(this.dimensions).fill(0)
    const clean = text.toLowerCase().trim()
    const words = clean.split(/\s+/).filter(Boolean)

    // Seed hash components
    for (let i = 0; i < clean.length; i++) {
      const code = clean.charCodeAt(i)
      const slot = (i * 31 + code * 17) % this.dimensions
      vector[slot] += Math.sin(code + i)
    }

    for (let w = 0; w < words.length; w++) {
      const word = words[w]
      let wordHash = 0
      for (let j = 0; j < word.length; j++) {
        wordHash = (wordHash * 33 + word.charCodeAt(j)) & 0x7fffffff
      }
      const slot = wordHash % this.dimensions
      vector[slot] += 2.0 * Math.cos(w + 1)
    }

    // L2 Normalization (ensures unit vector for valid cosine distance)
    let sumSquares = 0
    for (let i = 0; i < this.dimensions; i++) {
      sumSquares += vector[i] * vector[i]
    }

    const norm = Math.sqrt(sumSquares) || 1
    for (let i = 0; i < this.dimensions; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(6))
    }

    return vector
  }
}

/**
 * Resolve the appropriate embedding provider.
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey && apiKey !== 'your_openai_api_key' && apiKey !== 'placeholder-key' && apiKey.startsWith('sk-')) {
    return new OpenAIEmbeddingProvider()
  }
  return new SimulatedEmbeddingProvider()
}
