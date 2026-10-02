// html-to-docx 生成的 document.xml 把正文级 <w:sectPr>（页面尺寸、页边距）放在了 <w:body> 的最前面。
// 按 OOXML 规范它必须是 <w:body> 的最后一个子元素；放在最前面时 Word 会把它当作一个分节，导致第一页空白。

const LEADING_SECT_PR = /(<w:body>\s*)(<w:sectPr>[\s\S]*?<\/w:sectPr>)\s*/

/** 把位于正文开头的 <w:sectPr> 移到 </w:body> 之前；已在末尾时原样返回 */
export function moveSectPrToEnd(documentXml: string): string {
  const match = documentXml.match(LEADING_SECT_PR)
  if (!match) return documentXml
  const sectPr = match[2]
  const withoutLeading = documentXml.replace(LEADING_SECT_PR, '$1')
  return withoutLeading.replace(/\s*<\/w:body>/, `\n    ${sectPr}\n  </w:body>`)
}
