// 下载 ims-images 桶中的全部图片到指定目录（用于备份；需要 service role key）
// 用法：SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backup-images.mjs <outDir>
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const out = process.argv[2] ?? 'backup/images'
const bucket = 'ims-images'
if (!url || !key) throw new Error('需要 SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY')

const headers = { apikey: key, Authorization: `Bearer ${key}` }

async function list(prefix) {
  const items = []
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${url}/storage/v1/object/list/${bucket}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, limit: 1000, offset }),
    })
    if (!res.ok) throw new Error(`list ${prefix}: ${res.status} ${await res.text()}`)
    const page = await res.json()
    items.push(...page)
    if (page.length < 1000) return items
  }
}

async function walk(prefix) {
  const paths = []
  for (const item of await list(prefix)) {
    const path = prefix ? `${prefix}/${item.name}` : item.name
    // 没有 id 的条目是「文件夹」
    if (item.id === null) paths.push(...(await walk(path)))
    else paths.push(path)
  }
  return paths
}

const paths = await walk('')
for (const path of paths) {
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, { headers })
  if (!res.ok) throw new Error(`download ${path}: ${res.status}`)
  const file = join(out, path)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, Buffer.from(await res.arrayBuffer()))
}
console.log(`已下载 ${paths.length} 张图片到 ${out}`)
