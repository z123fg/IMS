// 分词：英文 / 数字按单词，中文按单字 + 相邻双字（二元组），兼顾单字查询与词语精度

const TOKEN = /\p{Script=Han}+|[a-z0-9À-ɏ]+/gu
const HAN = /\p{Script=Han}/u

export const normalize = (text: string) => text.normalize('NFKC').toLowerCase()

export const isHan = (term: string) => HAN.test(term)

export function tokenize(text: string): string[] {
  const tokens: string[] = []
  for (const [run] of normalize(text).matchAll(TOKEN)) {
    if (!isHan(run)) {
      tokens.push(run)
      continue
    }
    const chars = [...run]
    tokens.push(...chars)
    for (let i = 0; i < chars.length - 1; i++) tokens.push(chars[i] + chars[i + 1])
  }
  return tokens
}

/** 查询中的中文连续片段（用于高亮原文，而不是高亮一个个二元组） */
export function hanRuns(query: string): string[] {
  return [...normalize(query).matchAll(/\p{Script=Han}+/gu)].map((m) => m[0])
}
