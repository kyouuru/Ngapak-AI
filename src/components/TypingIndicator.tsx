import { Sparkles } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex gap-4 px-6 py-5 animate-fade-in">
      <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-[#5a5a72] px-1">Ngapak AI</span>
        <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl rounded-tl-sm px-4 py-3.5">
          <div className="flex gap-1.5 items-center">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#7c6af7] animate-pulse-dot"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
