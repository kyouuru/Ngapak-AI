export interface Language {
  id: string
  name: string
  flag: string
  greeting: string
  uiLabel: {
    you: string
    ai: string
    placeholder: string
    footer: string
  }
  systemAddendum: string
}

export const LANGUAGES: Language[] = [
  {
    id: 'id',
    name: 'Indonesia',
    flag: '🇮🇩',
    greeting: 'Halo!',
    uiLabel: { you: 'Kamu', ai: 'Ngapak AI', placeholder: 'Ketik pesan kamu...', footer: 'Ngapak AI bisa membuat kesalahan. Periksa informasi penting ya!' },
    systemAddendum: `
## BAHASA WAJIB: INDONESIA
Kamu HARUS menjawab dalam Bahasa Indonesia yang baik, benar, dan ramah.
JANGAN gunakan kata-kata Ngapak seperti "inyong", "kowe", "kepriwe" dalam jawaban.
Gunakan sapaan seperti "Halo!", "Hai!", "Tentu!", "Siap!".
Boleh sesekali tambahkan "ya", "nih", "dong" agar terasa hangat.`,
  },
  {
    id: 'ngapak',
    name: 'Ngapak',
    flag: '🗺️',
    greeting: 'Halo kowe!',
    uiLabel: { you: 'Kowe', ai: 'Ngapak AI', placeholder: 'Takon apa bae karo Ngapak AI...', footer: 'Ngapak AI bisa gawe kesalahan. Priksa informasi penting ya!' },
    systemAddendum: `
## BAHASA WAJIB: NGAPAK BANYUMAS
Kowe WAJIB menjawab nganggo Basa Ngapak Banyumas sing khas.
Gunakake tembung: inyong, kowe, kepriwe, ngapa, ya apa, bae, maning, lah, wis, durung, arep, ora.
Contoh sapaan: "Halo kowe! Inyong siap mbantu ya!"`,
  },
  {
    id: 'sunda',
    name: 'Sunda',
    flag: '🌺',
    greeting: 'Halo!',
    uiLabel: { you: 'Anjeun', ai: 'Ngapak AI', placeholder: 'Tulis pesen anjeun...', footer: 'Ngapak AI tiasa lepat. Pariksa inpormasi penting nya!' },
    systemAddendum: `
## BAHASA WAJIB: SUNDA
Anjeun KEDAH ngajawab nganggo Basa Sunda nu alus sareng ramah.
ULAH nganggo kecap Ngapak. Gunakake: abdi, anjeun, kumaha, naon, enya, henteu, mangga, nuhun, punten, atuh, mah, teh, nya.
Conto: "Halo! Abdi siap ngabantosan anjeun nya!"`,
  },
  {
    id: 'minang',
    name: 'Minang',
    flag: '🏔️',
    greeting: 'Halo!',
    uiLabel: { you: 'Waang', ai: 'Ngapak AI', placeholder: 'Tulih pesan waang...', footer: 'Ngapak AI bisa salah. Pareso informasi nan pantiang yo!' },
    systemAddendum: `
## BAHASA WAJIB: MINANG
Ambo HARUS manjawab jo Bahaso Minang nan elok.
JANGAN pakai kata Ngapak. Gunakake: ambo, waang/uda/uni, baa, apo, iyo, indak, tarimo kasih, lah, ko, tu, den.
Conto: "Halo! Ambo siap mambantu waang yo!"`,
  },
  {
    id: 'jawa',
    name: 'Jawa',
    flag: '🏛️',
    greeting: 'Sugeng rawuh!',
    uiLabel: { you: 'Sampeyan', ai: 'Ngapak AI', placeholder: 'Tulis pesen sampeyan...', footer: 'Ngapak AI saged lepat. Priksa informasi penting nggih!' },
    systemAddendum: `
## BAHASA WAJIB: JAWA
Kula KEDAH mangsuli nganggo Basa Jawa sing sopan (ngoko alus).
SAMPUN nganggo tembung Ngapak. Gunakake: kula, sampeyan, piye, opo, iya, ora, matur nuwun, mangga, lho, to, nggih.
Conto: "Sugeng rawuh! Kula siap mbantu sampeyan nggih!"`,
  },
  {
    id: 'betawi',
    name: 'Betawi',
    flag: '🦁',
    greeting: 'Halo nih!',
    uiLabel: { you: 'Ente', ai: 'Ngapak AI', placeholder: 'Tulis pesan ente...', footer: 'Ngapak AI bisa salah nih. Cek informasi penting deh!' },
    systemAddendum: `
## BAHASA WAJIB: BETAWI
Aye HARUS ngejawab pake Bahasa Betawi yang khas.
JANGAN pake kata Ngapak. Pake: aye/gue, ente/lu, gimane, apaan, iye, kagak, makasih, nih, deh, dong, sih, noh, tuh, emang.
Contoh: "Halo nih! Aye siap bantu ente deh!"`,
  },
  {
    id: 'madura',
    name: 'Madura',
    flag: '🐂',
    greeting: 'Halo!',
    uiLabel: { you: "Ba'na", ai: 'Ngapak AI', placeholder: "Tullis pesan ba'na...", footer: "Ngapak AI bisa salah. Pareksa informasi se penting ya!" },
    systemAddendum: `
## BAHASA WAJIB: MADURA
Kaula HARUS ngajheb nganguy Bahasa Madura se apik.
JANGAN pake kata Ngapak. Pake: kaula, ba'na/sampeyan, keya, aapa, iya, ta', tarema kasih, la', bik, se.
Conto: "Halo! Kaula siap abanto ba'na ya!"`,
  },
  {
    id: 'english',
    name: 'English',
    flag: '🇬🇧',
    greeting: 'Hello!',
    uiLabel: { you: 'You', ai: 'Ngapak AI', placeholder: 'Type your message...', footer: 'Ngapak AI can make mistakes. Check important info!' },
    systemAddendum: `
## REQUIRED LANGUAGE: ENGLISH
You MUST respond in clear, friendly English only.
DO NOT use Ngapak words. Use natural English with a warm, helpful tone.
You may occasionally add a fun touch like "Hope that helps!" or "Let me know if you need more!".`,
  },
]

export function getLanguageById(id: string): Language {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0]!
}
