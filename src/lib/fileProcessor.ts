// Diadaptasi dari utils/imageResizer.ts, utils/attachments.ts, utils/fileRead.ts
// di Claude Code source — pola multipart content blocks untuk vision API

export type MediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

export type ProcessedAttachment =
  | { kind: 'image'; mediaType: MediaType; base64: string; name: string; sizeKb: number }
  | { kind: 'text'; content: string; name: string; language: string }
  | { kind: 'error'; message: string; name: string }

// Deteksi format gambar dari magic bytes — diadaptasi dari detectImageFormatFromBuffer
function detectImageFormat(base64: string): MediaType {
  try {
    const binary = atob(base64.slice(0, 16))
    const bytes = Array.from(binary).map((c) => c.charCodeAt(0))
    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png'
    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg'
    // GIF: 47 49 46
    if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'image/gif'
    // WebP: RIFF....WEBP
    if (bytes[0] === 0x52 && bytes[1] === 0x49) return 'image/webp'
  } catch {}
  return 'image/jpeg'
}

// Map ekstensi file ke bahasa untuk code block
function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    js: 'javascript', ts: 'typescript', jsx: 'jsx', tsx: 'tsx',
    py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
    cpp: 'cpp', c: 'c', cs: 'csharp', php: 'php', swift: 'swift',
    kt: 'kotlin', html: 'html', css: 'css', scss: 'scss',
    json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml',
    xml: 'xml', sql: 'sql', sh: 'bash', bash: 'bash',
    md: 'markdown', txt: 'text', csv: 'csv', env: 'bash',
  }
  return map[ext] ?? 'text'
}

// Proses file dari FileReader result
export function processFileAttachment(
  name: string,
  type: string,
  dataUrl: string,
): ProcessedAttachment {
  const MAX_TEXT_CHARS = 8000 // ~2000 tokens
  const MAX_IMAGE_B64 = 5 * 1024 * 1024 // 5MB base64

  if (type.startsWith('image/')) {
    // Ambil base64 dari data URL
    const base64 = dataUrl.split(',')[1] ?? ''
    const sizeKb = Math.round((base64.length * 3) / 4 / 1024)

    if (base64.length > MAX_IMAGE_B64) {
      return { kind: 'error', name, message: `Gambar terlalu besar (${sizeKb}KB). Maksimal ~3.7MB.` }
    }

    const mediaType = detectImageFormat(base64)
    return { kind: 'image', mediaType, base64, name, sizeKb }
  }

  // File teks
  const content = dataUrl.startsWith('data:')
    ? decodeURIComponent(escape(atob(dataUrl.split(',')[1] ?? '')))
    : dataUrl

  const truncated = content.length > MAX_TEXT_CHARS
    ? content.slice(0, MAX_TEXT_CHARS) + `\n\n... [dipotong, ${content.length - MAX_TEXT_CHARS} karakter tersisa]`
    : content

  return { kind: 'text', content: truncated, name, language: getLanguage(name) }
}

// Build API message content dari attachment — mengikuti pola Claude Code multipart blocks
export function buildMessageContent(
  text: string,
  attachment: ProcessedAttachment | null,
): string | Array<{ type: string; [key: string]: unknown }> {
  if (!attachment || attachment.kind === 'error') {
    return text || ''
  }

  if (attachment.kind === 'image') {
    const blocks: Array<{ type: string; [key: string]: unknown }> = []

    // Image block dulu (seperti pola di Claude Code attachments.ts)
    blocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: attachment.mediaType,
        data: attachment.base64,
      },
    })

    // Text block setelah gambar
    const textContent = text
      ? `${text}\n\n[Gambar: ${attachment.name}, ${attachment.sizeKb}KB]`
      : `Tolong analisis gambar ini: ${attachment.name}`

    blocks.push({ type: 'text', text: textContent })
    return blocks
  }

  // File teks — embed sebagai code block dalam pesan
  const fileBlock = `\`\`\`${attachment.language}\n// File: ${attachment.name}\n${attachment.content}\n\`\`\``
  return text ? `${text}\n\n${fileBlock}` : `Tolong analisis file ini:\n\n${fileBlock}`
}
