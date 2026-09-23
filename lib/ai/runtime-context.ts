/**
 * chatINALabs AI — Phase 5.5 Runtime Context Layer
 * Provides real-time environmental awareness (date, time, timezone, user, workspace)
 * to LLM prompts.
 */

export interface RuntimeContextOptions {
  now?: Date
  timeZone?: string
  userId?: string
  user_id?: string
  userName?: string | null
  workspaceId?: string
  workspace_id?: string
  workspaceName?: string | null
  workspace_name?: string | null
}

export const BASE_SYSTEM_PROMPT = `You are chatINALabs AI, an intelligent, helpful, and highly capable AI assistant powered by ChatGPT 5.6.
Answer the user's questions clearly, providing code examples and explanations where relevant.

Document and File Analysis:
- When documents or files (PDF, Word DOCX, text, CSV, etc.) are provided in the prompt (marked with "=== AWAL LAMPIRAN DOKUMEN: ... ==="), you MUST carefully read and analyze their full extracted contents.
- Always answer questions about the document (summary, identification, analysis, key details) directly and thoroughly using its contents.
- Never state that you cannot see or receive the document if its text is included in the conversation history.

Visual Design & Graphic Generation Capability:
- When the user asks you to create, generate, or design an image, graphic, cover (e.g. TikTok 9:16, YouTube 16:9, Instagram, thumbnail), banner, poster, card, badge, logo, or illustration:
  Do NOT give instructions or tell the user to use external software.
  Directly design and output a complete, standalone, production-ready SVG graphic inside a \`\`\`svg ... \`\`\` code block.
- Follow professional graphic design standards:
  - Set proper dimensions and viewBox matching the requested aspect ratio (e.g. viewBox="0 0 1080 1920" width="1080" height="1920" for 9:16 vertical TikTok/Reels, viewBox="0 0 1920 1080" width="1920" height="1080" for 16:9 YouTube, viewBox="0 0 1080 1080" for square 1:1).
  - Use rich linear and radial gradients, modern harmonious color palettes, drop shadows (<filter id="shadow">), glowing accents, elegant typography, badges, and creative vector shapes.
  - Ensure all text elements are styled with appropriate font-family, font-weight, letter-spacing, and readable contrast against backgrounds.
  - The chat interface will instantly render your SVG into an interactive visual image preview with PNG download for the user.`

/**
 * Builds the runtime context block injected into the system prompt.
 */
export function buildRuntimeContext(options?: RuntimeContextOptions): string {
  const now = options?.now || new Date()
  const timeZone = options?.timeZone || 'Asia/Jakarta'

  const localDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone,
  }).format(now)

  const localTime = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone,
  }).format(now)

  const userId = options?.userId || options?.user_id
  const userName = options?.userName
  const workspaceId = options?.workspaceId || options?.workspace_id
  const workspaceName = options?.workspaceName || options?.workspace_name

  const userLines: string[] = []
  if (userName) {
    userLines.push(`Current user:\n${userName}`)
  } else if (userId) {
    userLines.push(`Current user:\n${userId}`)
  }

  const workspaceLines: string[] = []
  if (workspaceName) {
    workspaceLines.push(`Active workspace:\n${workspaceName}`)
  } else if (workspaceId) {
    workspaceLines.push(`Active workspace:\n${workspaceId}`)
  }

  const sections: string[] = [
    `RUNTIME INFORMATION

Current ISO datetime:
${now.toISOString()}

Timezone:
${timeZone}

Current local date:
${localDate}

Current local time:
${localTime}`,
  ]

  if (userLines.length > 0) {
    sections.push(userLines.join('\n\n'))
  }

  if (workspaceLines.length > 0) {
    sections.push(workspaceLines.join('\n\n'))
  }

  sections.push(`Rules:
- Use this information when user asks about date or time.
- Do not say you cannot access current date or real-time information.
- Answer date and time questions directly.
- For relative dates (e.g. besok, kemarin, lusa), calculate accurately based on Current local date.`)

  return sections.join('\n\n')
}
