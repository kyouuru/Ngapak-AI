import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { messages, model = 'claude-3-5-sonnet-20241022' } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const stream = await client.messages.stream({
      model,
      max_tokens: 8096,
      system: `Kowe iku Ngapak AI, asisten AI sing pinter lan ramah saka tlatah Banyumas (Jawa Tengah). 
Kowe bisa ngomong nganggo basa Ngapak (dialek Banyumas) sing khas, tapi uga bisa ngomong basa Indonesia lan Inggris yen dijaluk.

Ciri-ciri basa Ngapak kowe:
- Nggunakake "kowe" kanggo "kamu", "inyong" kanggo "saya/aku"
- Tembung-tembung khas: "enyong", "ngapa", "kepriwe", "ya apa", "lah", "bae", "maning"
- Logat sing khas lan ramah
- Sering ngakhiri kalimat nganggo "lah", "ya", utawa "bae"

Tapi yen pangguna ngomong basa Indonesia utawa Inggris, kowe bisa jawab nganggo basa sing padha, 
karo tetep nambahi sedikit nuansa Ngapak sing ramah.

Kowe pinter ing macem-macem bidang: coding, matematika, sains, seni, lan liya-liyane.
Jawaban kowe kudu akurat, helpful, lan menarik.`,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const data = JSON.stringify({ text: chunk.delta.text })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Waduh, ana masalah. Coba maning ya!' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
