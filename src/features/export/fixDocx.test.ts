import { describe, expect, it } from 'vitest'
import { moveSectPrToEnd } from './fixDocx'

const SECT = '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440"/></w:sectPr>'

describe('moveSectPrToEnd', () => {
  it('把正文开头的 sectPr 移到 body 末尾', () => {
    const xml = `<w:document><w:body>\n    ${SECT}\n    <w:p><w:r><w:t>一</w:t></w:r></w:p><w:p><w:r><w:t>二</w:t></w:r></w:p>\n  </w:body></w:document>`
    const out = moveSectPrToEnd(xml)
    const body = out.slice(out.indexOf('<w:body>') + '<w:body>'.length, out.indexOf('</w:body>'))
    expect(body.trim().startsWith('<w:p>')).toBe(true)
    expect(body.trim().endsWith(SECT)).toBe(true)
    expect(out.match(/<w:sectPr>/g)).toHaveLength(1)
    expect(out).toContain('<w:t>一</w:t>')
    expect(out).toContain('<w:t>二</w:t>')
  })

  it('sectPr 已在末尾时不变', () => {
    const xml = `<w:document><w:body><w:p/>${SECT}</w:body></w:document>`
    expect(moveSectPrToEnd(xml)).toBe(xml)
  })

  it('不动段落内部的分节符', () => {
    const inner = '<w:p><w:pPr><w:sectPr><w:type w:val="nextPage"/></w:sectPr></w:pPr></w:p>'
    const xml = `<w:document><w:body><w:p/>${inner}${SECT}</w:body></w:document>`
    expect(moveSectPrToEnd(xml)).toBe(xml)
  })
})
