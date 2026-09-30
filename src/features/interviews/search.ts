import { z } from 'zod'
import { DOC_FIELDS } from './types'

// 列表页的 URL 状态：筛选、排序、当前展开的行与文档
export const listSearchDefaults = {
  q: '',
  types: [] as string[],
  when: 'all' as const,
  sort: 'received_at' as const,
  dir: 'desc' as const,
}

export const listSearchSchema = z.object({
  q: z.string().default(listSearchDefaults.q).catch(listSearchDefaults.q),
  types: z.array(z.string()).default(listSearchDefaults.types).catch(listSearchDefaults.types),
  when: z.enum(['all', 'upcoming', 'past']).default(listSearchDefaults.when).catch(listSearchDefaults.when),
  sort: z
    .enum(['client', 'vendor', 'interviewee', 'interviewer', 'interview_type', 'received_at', 'interview_at', 'relevance'])
    .default(listSearchDefaults.sort)
    .catch(listSearchDefaults.sort),
  dir: z.enum(['asc', 'desc']).default(listSearchDefaults.dir).catch(listSearchDefaults.dir),
  open: z.string().optional().catch(undefined),
  doc: z.enum(DOC_FIELDS).optional().catch(undefined),
})

export type ListSearch = z.infer<typeof listSearchSchema>
