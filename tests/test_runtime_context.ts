import { buildRuntimeContext, BASE_SYSTEM_PROMPT } from '../lib/ai/runtime-context'
import { aiService } from '../lib/ai'

async function runRuntimeContextTests() {
  console.log('=== Starting Phase 5.5 Runtime Context Layer Tests ===\n')

  let passCount = 0
  let failCount = 0

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`)
      passCount++
    } else {
      console.error(`[FAIL] ${message}`)
      failCount++
    }
  }

  // ---------------------------------------------------------------------------
  // Test Suite 1: Runtime Context Formatting & Content
  // ---------------------------------------------------------------------------
  console.log('--- Test Suite 1: Runtime Context Builder Unit Tests ---')

  // Fixed test date: Sunday, 20 September 2026 14:30:00 UTC (21:30:00 WIB)
  const testDate = new Date('2026-09-20T14:30:00.000Z')

  const contextStr = buildRuntimeContext({
    now: testDate,
    user_id: 'user-12345',
    userName: 'alwan',
    workspace_id: 'ws-67890',
    workspace_name: 'chatINALabs',
  })

  assert(contextStr.includes('RUNTIME INFORMATION'), 'Contains "RUNTIME INFORMATION" header')
  assert(contextStr.includes('Timezone:\nAsia/Jakarta'), 'Contains Timezone Asia/Jakarta')
  assert(contextStr.includes('Current ISO datetime:\n2026-09-20T14:30:00.000Z'), 'Contains correct ISO datetime')
  assert(
    contextStr.includes('Minggu') && contextStr.includes('20 September 2026'),
    'Correctly formats Indonesian date: Minggu, 20 September 2026'
  )
  assert(contextStr.includes('21.30.00') || contextStr.includes('21:30:00'), 'Correctly formats local time in WIB (21:30:00)')
  assert(contextStr.includes('Current user:\nalwan'), 'Includes user context: alwan')
  assert(contextStr.includes('Active workspace:\nchatINALabs'), 'Includes workspace context: chatINALabs')
  assert(contextStr.includes('Do not say you cannot access current date'), 'Includes strict rule not to deny date access')
  assert(contextStr.includes('Answer date and time questions directly'), 'Includes rule to answer directly')

  // ---------------------------------------------------------------------------
  // Test Suite 2: Default Runtime Context (Real-time Execution)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 2: Default Runtime Context (Real-time) ---')
  const defaultContext = buildRuntimeContext()
  assert(defaultContext.includes('Asia/Jakarta'), 'Default timezone is Asia/Jakarta')
  assert(defaultContext.includes('Current local date:'), 'Includes Current local date label')
  assert(defaultContext.includes('Current local time:'), 'Includes Current local time label')

  const currentYear = new Date().getFullYear().toString()
  assert(defaultContext.includes(currentYear), `Current local date contains year ${currentYear}`)

  // ---------------------------------------------------------------------------
  // Test Suite 3: System Prompt Augmentation Simulation
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 3: System Prompt Augmentation ---')
  const fullSystemPrompt = `${BASE_SYSTEM_PROMPT}\n\n${contextStr}`
  assert(fullSystemPrompt.startsWith('You are chatINALabs AI'), 'Begins with base system prompt')
  assert(fullSystemPrompt.includes('RUNTIME INFORMATION'), 'Includes runtime information block')

  // ---------------------------------------------------------------------------
  // Test Suite 4: Live AI Streaming with Runtime Context Awareness
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 4: Live AI Stream Date/Time Awareness ---')
  try {
    const stream = aiService.stream({
      model: 'chatinalabs-ai',
      messages: [
        {
          role: 'system',
          content: `${BASE_SYSTEM_PROMPT}\n\n${buildRuntimeContext({
            now: testDate,
            userName: 'alwan',
            workspace_name: 'chatINALabs',
          })}`,
        },
        {
          role: 'user',
          content: 'sekarang hari apa ya?',
        },
      ],
    })

    let aiOutput = ''
    for await (const chunk of stream) {
      if (chunk.delta) {
        aiOutput += chunk.delta
      }
    }

    console.log(`[AI Response to "sekarang hari apa ya?"]:\n"${aiOutput.trim()}"\n`)

    assert(
      aiOutput.toLowerCase().includes('minggu'),
      'AI accurately identified day as "Minggu"'
    )
    assert(
      aiOutput.includes('20 September 2026') || aiOutput.includes('20 September'),
      'AI accurately identified date as "20 September 2026"'
    )
    assert(
      !aiOutput.toLowerCase().includes('tidak memiliki akses') &&
      !aiOutput.toLowerCase().includes('tidak tahu') &&
      !aiOutput.toLowerCase().includes('cannot access'),
      'AI did NOT claim lack of real-time date access'
    )
  } catch (err) {
    console.error('AI provider test failed:', err)
    assert(false, `AI provider test encountered error: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ---------------------------------------------------------------------------
  // Test Suite 5: Relative Date Awareness (Besok tanggal berapa?)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 5: Relative Date Calculation (Besok tanggal berapa?) ---')
  try {
    const stream = aiService.stream({
      model: 'chatinalabs-ai',
      messages: [
        {
          role: 'system',
          content: `${BASE_SYSTEM_PROMPT}\n\n${buildRuntimeContext({
            now: testDate,
            userName: 'alwan',
            workspace_name: 'chatINALabs',
          })}`,
        },
        {
          role: 'user',
          content: 'tanggal besok berapa?',
        },
      ],
    })

    let tomorrowOutput = ''
    for await (const chunk of stream) {
      if (chunk.delta) {
        tomorrowOutput += chunk.delta
      }
    }

    console.log(`[AI Response to "tanggal besok berapa?"]:\n"${tomorrowOutput.trim()}"\n`)

    assert(
      tomorrowOutput.includes('21 September') || tomorrowOutput.includes('21 September 2026') || tomorrowOutput.toLowerCase().includes('senin'),
      'AI accurately calculated tomorrow as "21 September 2026" / "Senin"'
    )
  } catch (err) {
    console.error('Tomorrow test failed:', err)
    assert(false, `Tomorrow test encountered error: ${err instanceof Error ? err.message : String(err)}`)
  }

  console.log(`\n=== Test Results: ${passCount} passed, ${failCount} failed ===`)
  if (failCount > 0) {
    process.exit(1)
  }
}

runRuntimeContextTests().catch(err => {
  console.error('Runtime Context test execution error:', err)
  process.exit(1)
})
