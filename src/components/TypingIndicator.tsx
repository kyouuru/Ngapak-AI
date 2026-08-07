export function TypingIndicator() {
  return (
    <div className="flex gap-4 px-6 py-5 animate-fade-in">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-[#625d4e] px-1">Ngapak AI</span>
        <div className="bg-[#181613] border border-[#2e2b24] rounded-2xl rounded-tl-sm px-4 py-3.5">
          <div className="flex gap-1.5 items-center">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#d97757] animate-pulse-dot"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
