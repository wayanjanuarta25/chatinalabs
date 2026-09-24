export interface MessageAttachment {
  id: string
  message_id: string
  workspace_id: string
  file_name: string
  mime_type: string
  file_size: number
  storage_path: string
  attachment_type: 'image' | 'document'
  metadata?: Record<string, unknown>
  created_at: string
  signedUrl?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  model?: string
  feedback?: 'like' | 'dislike' | null
  metadata?: Record<string, unknown>
  sources?: Array<{
    id: string
    documentTitle: string
    snippet: string
    similarity: number
  }>
  hasKnowledge?: boolean
  attachments?: MessageAttachment[]
}

export interface Conversation {
  id: string
  title: string
  category: 'Today' | 'Yesterday' | 'Previous 7 Days'
  updatedAt: string
  messages: Message[]
  modelId?: string
  messageCount?: number
}

export interface ModelOption {
  id: string
  name: string
  description: string
  badge?: string
  provider?: 'openai'
  category?: 'all' | 'gpt'
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gpt-5.5',
    name: 'GPT-5.5',
    description: 'Powerful general knowledge and analytical reasoning model.',
    provider: 'openai',
    category: 'gpt',
  },
  {
    id: 'gpt-5.6-sol',
    name: 'GPT-5.6-sol',
    description: 'Fast, intelligent, balanced model with high reasoning capability.',
    provider: 'openai',
    category: 'gpt',
  },
  {
    id: 'gpt-5.6-terra',
    name: 'GPT-5.6-terra',
    description: 'Flagship multimodal & creative model with advanced prompt handling.',
    provider: 'openai',
    category: 'gpt',
  },
  {
    id: 'gpt-5.6-luna',
    name: 'GPT-5.6-luna',
    description: 'Lightweight, ultra-fast model for quick responses and conversational tasks.',
    provider: 'openai',
    category: 'gpt',
  },
  {
    id: 'gpt-5.4-mini',
    name: 'GPT-5.4-mini',
    description: 'Compact and efficient model for straightforward queries.',
    provider: 'openai',
    category: 'gpt',
  },
  {
    id: 'gpt-6-astra',
    name: 'GPT-6-astra',
    description: 'Next-generation frontier intelligence model with extreme depth.',
    provider: 'openai',
    category: 'gpt',
  },
]

export interface SuggestionCard {
  title: string
  prompt: string
  category: string
}

export const SUGGESTION_CARDS: SuggestionCard[] = [
  {
    title: 'Create a business strategy',
    prompt: 'Help me draft a go-to-market business strategy for an AI-powered productivity tool targeting modern remote teams.',
    category: 'Strategy'
  },
  {
    title: 'Analyze a document',
    prompt: 'Provide a structured summary and key actionable takeaways from a 20-page quarterly business review report.',
    category: 'Analysis'
  },
  {
    title: 'Generate ideas',
    prompt: 'Brainstorm 5 innovative viral marketing campaign concepts for launching a sustainable lifestyle brand in Southeast Asia.',
    category: 'Brainstorm'
  },
  {
    title: 'Write professional content',
    prompt: 'Draft an engaging executive announcement email introducing our new hybrid work and wellness policy to employees.',
    category: 'Writing'
  }
]

export const INITIAL_CONVERSATIONS: Conversation[] = [
  // --- TODAY ---
  {
    id: 'conv-ai-product-strategy',
    title: 'AI Product Strategy',
    category: 'Today',
    updatedAt: '10:45 AM',
    messages: [
      {
        id: 'm-1-1',
        role: 'user',
        content: 'How should we position our consumer AI assistant product to differentiate it from generic chatbots?',
        createdAt: '10:42 AM'
      },
      {
        id: 'm-1-2',
        role: 'assistant',
        content: `To build a defensible product in a crowded market, focus on **high-context utility** rather than raw model benchmark scores.

### Key Pillars for Differentiation:

1. **Context & Personal Knowledge Graph**
   * Keep lightweight semantic memory of user projects and tone preferences.
   * Avoid making the user re-explain background context in every prompt.

2. **Workflow-Embedded Actionables**
   * Don't stop at text generation; produce ready-to-use artifacts (tables, structured checklists, formatted code).
   * Integrate clean export shortcuts (Copy as Markdown, PDF summary).

3. **Speed & Perceived Responsiveness**
   * Instant first-token latency (< 300ms) creates an intuitive, human cadence.
   * Subtle micro-animations rather than blocking loading bars.

| Pillar | Generic Chatbot | chatINALabs AI |
| :--- | :--- | :--- |
| **Response Style** | Verbose & robotic | Crisp, structured, punchy |
| **Interaction** | Isolated messages | Continuous conversational flow |
| **Aesthetics** | Cluttered dev panel | Consumer-first minimalism |`,
        createdAt: '10:45 AM',
        feedback: 'like'
      }
    ]
  },
  {
    id: 'conv-marketing-campaign',
    title: 'Marketing Campaign Ideas',
    category: 'Today',
    updatedAt: '09:20 AM',
    messages: [
      {
        id: 'm-2-1',
        role: 'user',
        content: 'Give me 3 creative campaign angles for our upcoming Q4 brand awareness drive.',
        createdAt: '09:18 AM'
      },
      {
        id: 'm-2-2',
        role: 'assistant',
        content: `Here are 3 distinct campaign directions tailored for maximum social engagement:

* **Angle 1: "Reclaim 10 Hours a Week"**
  * *Theme:* Time savings and work-life balance.
  * *Hook:* Show split-screen video comparing manual administrative busywork vs. 30-second AI assistance.
  * *CTA:* "What will you do with your extra 10 hours?"

* **Angle 2: "The Thinker's Co-pilot"**
  * *Theme:* Intellectual augmentation, not replacement.
  * *Hook:* High-profile creators brainstorming complex plots or architectural layouts side-by-side with chatINALabs.

* **Angle 3: "Local Intelligence, Global Speed"**
  * *Theme:* Natural bilingual fluency and cultural nuance.
  * *Hook:* Flawless switching between Indonesian cultural context and international corporate communications.`,
        createdAt: '09:20 AM'
      }
    ]
  },
  {
    id: 'conv-research-assistant',
    title: 'Research Assistant',
    category: 'Today',
    updatedAt: '08:15 AM',
    messages: [
      {
        id: 'm-3-1',
        role: 'user',
        content: 'Summarize the core trade-offs between local on-device LLMs vs cloud API inference.',
        createdAt: '08:14 AM'
      },
      {
        id: 'm-3-2',
        role: 'assistant',
        content: `Here is a comparative breakdown of on-device vs cloud inference:

### 1. On-Device LLMs (Edge)
* **Pros:** Absolute data privacy, zero recurring API token costs, works offline.
* **Cons:** Constrained parameter sizes (typically 3B–8B), high battery and memory usage.

### 2. Cloud API Inference
* **Pros:** Access to state-of-the-art frontier models (70B–400B+), constant updates, minimal client hardware load.
* **Cons:** Ongoing per-token expense, network latency dependency, strict data transit compliance considerations.`,
        createdAt: '08:15 AM'
      }
    ]
  },

  // --- YESTERDAY ---
  {
    id: 'conv-business-plan',
    title: 'Business Plan Creation',
    category: 'Yesterday',
    updatedAt: 'Yesterday',
    messages: [
      {
        id: 'm-4-1',
        role: 'user',
        content: 'What are the essential sections needed in an early-stage executive summary for investors?',
        createdAt: 'Yesterday'
      },
      {
        id: 'm-4-2',
        role: 'assistant',
        content: `An effective early-stage executive summary should fit onto 1–2 pages and cover these 5 core components:

1. **The Problem & Market Pain:** Why does this problem cost money or time today?
2. **The Solution & Unfair Advantage:** What proprietary insight or moat do you possess?
3. **Market Size (TAM / SAM / SOM):** Realistic bottom-up addressable customer counts.
4. **Traction & Milestones:** Key metrics, active pilots, or month-over-month growth.
5. **The Ask & Use of Funds:** Target funding amount and the 18-month milestone runway it buys.`,
        createdAt: 'Yesterday'
      }
    ]
  },
  {
    id: 'conv-website-landing-page',
    title: 'Website Landing Page',
    category: 'Yesterday',
    updatedAt: 'Yesterday',
    messages: [
      {
        id: 'm-5-1',
        role: 'user',
        content: 'Review this hero section copy: "We provide modern cloud solutions for modern enterprise teams to optimize synergy."',
        createdAt: 'Yesterday'
      },
      {
        id: 'm-5-2',
        role: 'assistant',
        content: `### Critique
Your original copy is too vague and loaded with corporate jargon (*"modern cloud solutions"*, *"optimize synergy"*). Visitors won't understand what product they're looking at within the first 5 seconds.

### Recommended Alternatives

**Option A (Outcome-Focused):**
> **"Deploy secure enterprise cloud infrastructure in minutes, not months."**  
> *Subheadline:* Automated compliance, zero-downtime migrations, and 40% lower cloud bills guaranteed.

**Option B (Action-Oriented):**
> **"The developer platform built for high-growth tech companies."**  
> *Subheadline:* Ship software faster with self-healing containers and pre-built CI/CD pipelines.`,
        createdAt: 'Yesterday'
      }
    ]
  },

  // --- PREVIOUS 7 DAYS ---
  {
    id: 'conv-coding-assistant',
    title: 'Coding Assistant',
    category: 'Previous 7 Days',
    updatedAt: '4 days ago',
    messages: [
      {
        id: 'm-6-1',
        role: 'user',
        content: 'Write a clean TypeScript helper to safely parse JSON without throwing exceptions.',
        createdAt: '4 days ago'
      },
      {
        id: 'm-6-2',
        role: 'assistant',
        content: `Here is a lightweight, type-safe JSON parser with a fallback mechanism:

\`\`\`typescript
export function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  
  try {
    const parsed = JSON.parse(jsonString);
    return (parsed !== null && parsed !== undefined) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

// Example usage:
interface UserSettings {
  theme: 'dark' | 'light';
  notifications: boolean;
}

const settings = safeJsonParse<UserSettings>(
  localStorage.getItem('user_settings'), 
  { theme: 'dark', notifications: true }
);
\`\`\`

### Why this pattern works:
* Handles \`null\`, \`undefined\`, and malformed JSON strings gracefully.
* Strict generic typing ensures zero runtime crashes in production.`,
        createdAt: '4 days ago',
        feedback: 'like'
      }
    ]
  },
  {
    id: 'conv-document-analysis',
    title: 'Document Analysis',
    category: 'Previous 7 Days',
    updatedAt: '6 days ago',
    messages: [
      {
        id: 'm-7-1',
        role: 'user',
        content: 'How can we extract table structures from non-standardized PDF documents reliably?',
        createdAt: '6 days ago'
      },
      {
        id: 'm-7-2',
        role: 'assistant',
        content: `Reliable table extraction from arbitrary PDFs requires a hybrid approach:

1. **Vision-LLM Layout Parsing:** Use vision models (like GPT-4o or Claude 3.5 Sonnet) to detect grid bounding boxes and header-cell relationships.
2. **Deterministic Fallback:** For structured text-layer PDFs, use libraries like \`pdfplumber\` or \`camelot-py\` to extract raw line coordinates.
3. **Normalization Pipeline:** Convert extracted tables into clean Markdown or JSON schemas before passing to downstream RAG pipelines.`,
        createdAt: '6 days ago'
      }
    ]
  }
]

export function generateSimulatedReply(userPrompt: string): string {
  const lower = userPrompt.toLowerCase()

  if (lower.includes('strategy') || lower.includes('business') || lower.includes('plan') || lower.includes('market')) {
    return `Here is a structured strategic framework tailored to your request:

### 1. Target Audience & Core Value Proposition
* **Primary Persona:** Teams looking to eliminate repetitive operational bottlenecks.
* **Core Value:** Streamlining complex workflows into clear, actionable outcomes in real time.

### 2. Execution Steps
1. **Validation Sprint:** Launch a pilot with a core group of users to establish qualitative baseline metrics.
2. **Iterative Focus:** Prioritize daily retention and conversational satisfaction above feature volume.
3. **Organic Distribution:** Build momentum through practical workflow demonstrations and word of mouth.

### 3. Key Performance Indicators
* **Activation Rate:** 70%+ of new users completing multiple sessions within day one.
* **Sustained Engagement:** Strong repeat usage driven by immediate daily utility.

Would you like to explore the rollout timeline or pricing strategy in more detail?`
  }

  if (lower.includes('document') || lower.includes('summary') || lower.includes('analyze') || lower.includes('report')) {
    return `### Executive Summary

Here is the structured analysis based on the document:

* **Key Objective:** Transitioning toward focused, uncluttered digital experiences with human-in-the-loop oversight.
* **Primary Finding:** Complex user interfaces with redundant technical options create friction; clean, purposeful workflows yield significantly higher adoption.
* **Action Items:**
  1. Simplify the first-time user journey by setting sensible defaults.
  2. Maintain responsive feedback loops across all key touchpoints.
  3. Ensure seamless cross-device readability.

Speed and visual clarity drive user engagement far more than unnecessary feature layers.`
  }

  if (lower.includes('code') || lower.includes('typescript') || lower.includes('function') || lower.includes('component')) {
    return `Here is a clean, optimized implementation:

\`\`\`typescript
interface Config<T> {
  initialValue: T;
  validate?: (value: T) => boolean;
  onSuccess?: (value: T) => void;
}

export function createInteractiveHandler<T>(config: Config<T>) {
  let state = config.initialValue;

  return {
    get: () => state,
    set: (newValue: T) => {
      if (config.validate && !config.validate(newValue)) {
        console.warn('Validation check failed');
        return false;
      }
      state = newValue;
      config.onSuccess?.(state);
      return true;
    }
  };
}
\`\`\`

### Key Points:
* Completely type-safe with zero external runtime dependencies.
* Encapsulated state prevents side-effect leakage across parent scopes.`
  }

  if (lower.includes('idea') || lower.includes('campaign') || lower.includes('creative') || lower.includes('brainstorm')) {
    return `Here are 4 structured ideas to explore:

1. **The 60-Second Challenge:** Demonstrating rapid problem-solving for everyday work scenarios.
2. **Interactive Case Studies:** Walkthroughs showing before-and-after workflow transformations.
3. **Curated Productivity Guides:** Practical, actionable tips highlighting daily time-saving routines.
4. **Focused Workspace Series:** Content spotlighting minimal, distraction-free productivity environments.

Which of these directions aligns closest with your immediate objective?`
  }

  return `Here is a structured perspective on your prompt:

1. **Define Core Priorities:** Identify the critical path and address highest-impact objectives first.
2. **Simplify the Approach:** Remove redundant steps to ensure the end result remains focused and legible.
3. **Iterate with Purpose:** Review user feedback regularly to guide refinements.

Let me know which area you would like to elaborate on—I am here to assist.`
}
