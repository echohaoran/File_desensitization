/**
 * 本地格式导出：在浏览器与 Tauri 内直接生成真实的 TXT / CSV / Markdown / DOCX / XLSX。
 * 不再调用未打包进桌面包的 FastAPI /api/text-to-*，避免 SPA 回退把 index.html 当作“文件”下载。
 * 每个输出必须通过文件签名、非空与内容抽样校验后才返回。
 */
import JSZip from 'jszip'

const XML_ILLEGAL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g

function escapeXml(value) {
  return String(value)
    .replace(XML_ILLEGAL, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function requireText(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('没有可导出的正文内容')
  return text
}

function columnLetter(index) {
  let n = index + 1
  let name = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    name = String.fromCharCode(65 + rem) + name
    n = Math.floor((n - 1) / 26)
  }
  return name
}

/** 简单 CSV 行解析：支持双引号包裹与 "" 转义；其余情况按逗号切分。 */
function parseCsvRow(line) {
  if (!/[",]/.test(line)) return [line]
  const cells = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i++ } else { inQuotes = false }
      } else current += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') { cells.push(current); current = '' }
    else current += ch
  }
  cells.push(current)
  return cells
}

export function toRows(text, { csv = false } = {}) {
  const lines = requireText(text).split(/\r?\n/)
  if (lines[lines.length - 1] === '') lines.pop()
  return csv ? lines.map(parseCsvRow) : lines.map(line => [line])
}

export function buildTextBlob(text, mime = 'text/plain') {
  const content = requireText(text)
  return Promise.resolve(new Blob([content], { type: `${mime};charset=utf-8` }))
}

export function buildCsvBlob(text, { csv = false } = {}) {
  const content = csv
    ? requireText(text)
    : toRows(text, { csv: false }).map(row => `"${row[0].replace(/"/g, '""')}"`).join('\r\n')
  // BOM 保证 Excel 直接双击打开时按 UTF-8 解析中文。
  return Promise.resolve(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }))
}

async function assertZipBlob(blob, entryName, sample) {
  if (!(blob instanceof Blob) || blob.size === 0) throw new Error('生成的文件为空')
  const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer())
  if (head[0] !== 0x50 || head[1] !== 0x4B) throw new Error('文件签名校验失败：不是有效的 ZIP 文档包')
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  const file = zip.file(entryName)
  if (!file) throw new Error(`文档包缺少 ${entryName}`)
  const xml = (await file.async('text')).replace(/<[^>]+>/g, '')
  if (sample && !xml.includes(sample)) throw new Error('内容抽样校验失败：正文未写入文档包')
  return blob
}

export async function buildDocxBlob(text) {
  const content = requireText(text)
  const paragraphs = content.split(/\r?\n/).map(line =>
    line ? `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>` : '<w:p/>'
  ).join('')
  const zip = new JSZip()
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '</Types>')
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    + '</Relationships>')
  zip.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    + `<w:body>${paragraphs}<w:sectPr/></w:body></w:document>`)
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  return assertZipBlob(blob, 'word/document.xml', content.split(/\r?\n/)[0].slice(0, 24))
}

export async function buildXlsxBlob(text, { csv = false, sheetName = '还原结果' } = {}) {
  const rows = toRows(text, { csv })
  const sheetRows = rows.map((cells, rowIndex) =>
    `<row r="${rowIndex + 1}">${cells.map((cell, colIndex) =>
      `<c r="${columnLetter(colIndex)}${rowIndex + 1}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell)}</t></is></c>`
    ).join('')}</row>`
  ).join('')
  const zip = new JSZip()
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
    + '</Types>')
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
    + '</Relationships>')
  zip.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    + `<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`)
  zip.file('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
    + '</Relationships>')
  zip.file('xl/worksheets/sheet1.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    + `<sheetData>${sheetRows}</sheetData></worksheet>`)
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const sample = (rows[0][0] || rows[1]?.[0] || '').slice(0, 24)
  return assertZipBlob(blob, 'xl/worksheets/sheet1.xml', sample)
}
