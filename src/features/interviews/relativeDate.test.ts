import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { cnNumber, relativeHint } from './relativeDate'

// 2026-09-30 是周三
const now = dayjs('2026-09-30T10:00:00')
const label = (d: string) => relativeHint(d, now)?.label

describe('relativeHint', () => {
  it('今天 / 明天 / 后天 / 昨天 / 前天（按日历日，不看具体时间）', () => {
    expect(label('2026-09-30T23:59:00')).toBe('今天')
    expect(label('2026-09-30T01:00:00')).toBe('今天')
    expect(label('2026-10-01T00:10:00')).toBe('明天')
    expect(label('2026-10-02')).toBe('后天')
    expect(label('2026-09-29')).toBe('昨天')
    expect(label('2026-09-28')).toBe('前天')
  })

  it('本周 / 下周 / 上周 + 星期几（周一为一周开始）', () => {
    expect(label('2026-10-03')).toBe('本周六')
    expect(label('2026-10-04')).toBe('本周日')
    expect(label('2026-10-05')).toBe('下周一')
    expect(label('2026-10-11')).toBe('下周日')
    expect(label('2026-09-27')).toBe('上周日')
    expect(label('2026-09-21')).toBe('上周一')
  })

  it('两周以上按周计', () => {
    expect(label('2026-10-12')).toBe('两周后')
    expect(label('2026-10-21')).toBe('三周后')
    expect(label('2026-09-14')).toBe('两周前')
    expect(label('2026-09-07')).toBe('三周前')
    expect(label('2026-10-26')).toBe('四周后')
  })

  it('更远按月、按年计', () => {
    expect(label('2026-11-10')).toBe('一个月后')
    expect(label('2026-12-15')).toBe('两个月后')
    expect(label('2026-12-30')).toBe('三个月后')
    expect(label('2026-07-01')).toBe('三个月前')
    expect(label('2026-08-10')).toBe('两个月前')
    expect(label('2025-08-01')).toBe('一年前')
    expect(label('2028-10-01')).toBe('两年后')
  })

  it('语气：明天紧急，今天高亮，其余区分未来 / 过去', () => {
    expect(relativeHint('2026-10-01', now)?.tone).toBe('urgent')
    expect(relativeHint('2026-09-30', now)?.tone).toBe('today')
    expect(relativeHint('2026-10-05', now)?.tone).toBe('future')
    expect(relativeHint('2026-09-28', now)?.tone).toBe('past')
  })

  it('空值与非法日期返回 null', () => {
    expect(relativeHint(null, now)).toBeNull()
    expect(relativeHint('not a date', now)).toBeNull()
  })

  it('中文数字', () => {
    expect([1, 2, 3, 10, 11, 12, 19, 25].map(cnNumber)).toEqual(['一', '两', '三', '十', '十一', '十二', '十九', '25'])
  })
})

describe('relativeHint（English）', () => {
  const en = (d: string) => relativeHint(d, now, 'en')?.label
  it('days, weeks, months, years', () => {
    expect(en('2026-09-30')).toBe('Today')
    expect(en('2026-10-01')).toBe('Tomorrow')
    expect(en('2026-10-02')).toBe('In 2 days')
    expect(en('2026-09-29')).toBe('Yesterday')
    expect(en('2026-09-28')).toBe('2 days ago')
    expect(en('2026-10-03')).toBe('This Sat')
    expect(en('2026-10-05')).toBe('Next Mon')
    expect(en('2026-09-21')).toBe('Last Mon')
    expect(en('2026-10-12')).toBe('In 2 weeks')
    expect(en('2026-09-07')).toBe('3 weeks ago')
    expect(en('2026-11-10')).toBe('In 1 month')
    expect(en('2026-07-01')).toBe('3 months ago')
    expect(en('2025-08-01')).toBe('1 year ago')
    expect(en('2028-10-01')).toBe('In 2 years')
  })
  it('tone does not depend on language', () => {
    expect(relativeHint('2026-10-01', now, 'en')?.tone).toBe('urgent')
  })
})
