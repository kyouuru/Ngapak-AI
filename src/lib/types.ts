export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: Date
  skillId?: string
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  userMessageCount: number // track jumlah pesan user untuk limit
}

export const MESSAGE_LIMIT = 5 // limit pesan per session
