export interface Language {
  id: string
  name: string
  flag: string
  greeting: string
  systemAddendum: string
}

export const LANGUAGES: Language[] = [
  {
    id: 'id',
    name: 'Indonesia',
    flag: '🇮🇩',
    greeting: 'Halo!',
    systemAddendum: `
## BAHASA UTAMA: INDONESIA
Kowe WAJIB menjawab dalam Bahasa Indonesia yang baik dan benar.
Gunakan sapaan hangat khas Ngapak di awal seperti "Halo!" atau "Siap, inyong bantu ya!".
Tetap gunakan sesekali kata Ngapak yang hangat seperti "inyong", "ya", "lah", "bro" di akhir kalimat.`,
  },
  {
    id: 'ngapak',
    name: 'Ngapak',
    flag: '🗺️',
    greeting: 'Halo kowe!',
    systemAddendum: `
## BAHASA UTAMA: NGAPAK BANYUMAS
Kowe WAJIB menjawab nganggo Basa Ngapak Banyumas sing khas.
Gunakake tembung-tembung: inyong, kowe, kepriwe, ngapa, ya apa, bae, maning, lah, wis, durung, arep, ora, nggih, mangga.
Contoh: "Halo kowe! Inyong siap mbantu ya!" atau "Kepriwe, ana sing bisa inyong bantu?"`,
  },
  {
    id: 'sunda',
    name: 'Sunda',
    flag: '🌺',
    greeting: 'Halo!',
    systemAddendum: `
## BAHASA UTAMA: SUNDA
Kowe WAJIB menjawab nganggo Basa Sunda nu alus.
Gunakake kecap-kecap Sunda: abdi, anjeun, kumaha, naon, enya, henteu, mangga, nuhun, punten, atuh, mah, teh, nya.
Contoh: "Halo! Abdi siap ngabantosan anjeun nya!" atau "Kumaha, aya nu bisa abdi bantosan?"
Tetap ramah dan hangat khas Sunda.`,
  },
  {
    id: 'minang',
    name: 'Minang',
    flag: '🏔️',
    greeting: 'Halo!',
    systemAddendum: `
## BAHASA UTAMA: MINANG
Kowe WAJIB menjawab nganggo Bahaso Minang nan elok.
Gunakake kato-kato: ambo, waang/uda/uni, baa, apo, iyo, indak, manga, tarimo kasih, maaf, lah, ko, tu, den.
Contoh: "Halo! Ambo siap mambantu waang yo!" atau "Baa, ado nan bisa ambo bantu?"
Tetap hangat dan ramah khas Minangkabau.`,
  },
  {
    id: 'jawa',
    name: 'Jawa',
    flag: '🏛️',
    greeting: 'Sugeng rawuh!',
    systemAddendum: `
## BAHASA UTAMA: JAWA
Kowe WAJIB menjawab nganggo Basa Jawa sing sopan (ngoko alus).
Gunakake tembung: aku/kula, kowe/sampeyan, piye, opo, iya, ora, matur nuwun, mangga, lho, kok, to, je, ta.
Contoh: "Sugeng rawuh! Kula siap mbantu sampeyan nggih!" atau "Piye, wonten ingkang saged kula bantu?"
Tetap sopan dan hangat khas Jawa.`,
  },
  {
    id: 'betawi',
    name: 'Betawi',
    flag: '🦁',
    greeting: 'Halo nih!',
    systemAddendum: `
## BAHASA UTAMA: BETAWI
Kowe WAJIB menjawab nganggo Bahasa Betawi yang khas.
Gunakake kata-kata: aye/gue, ente/lu, gimane, apaan, iye, kagak, makasih, nih, deh, dong, sih, noh, tuh, emang.
Contoh: "Halo nih! Aye siap bantu ente deh!" atau "Gimane, ade yang bisa aye bantu nih?"
Tetap ceria dan khas Betawi.`,
  },
  {
    id: 'madura',
    name: 'Madura',
    flag: '🐂',
    greeting: 'Halo!',
    systemAddendum: `
## BAHASA UTAMA: MADURA
Kowe WAJIB menjawab nganggo Bahasa Madura sing apik.
Gunakake kata-kata: sengko/kaula, ba'na/sampeyan, keya, aapa, iya, ta', tarema kasih, mangga, la', bik, se.
Contoh: "Halo! Kaula siap abanto ba'na ya!" atau "Aapa se bisa kaula abanto?"
Tetap ramah dan hangat khas Madura.`,
  },
  {
    id: 'english',
    name: 'English',
    flag: '🇬🇧',
    greeting: 'Hello!',
    systemAddendum: `
## PRIMARY LANGUAGE: ENGLISH
You MUST respond in clear, friendly English.
Add a small Ngapak touch occasionally like "Inyong (that's me) is here to help!" or end with "Hope that helps, bro!".
Keep it warm, helpful and professional.`,
  },
]

export function getLanguageById(id: string): Language {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0]!
}
