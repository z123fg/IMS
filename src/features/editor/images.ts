import { t } from '@/i18n'
import { IMAGE_BUCKET, supabase } from '@/lib/supabase'

const MAX_EDGE = 1600
const SIGNED_URL_TTL = 60 * 60 * 24

export type UploadedImage = { src: string; storagePath: string; alt?: string }

export const isImageFile = (f: File) => f.type.startsWith('image/')

/** 缩放到最长边 ≤1600px 并转 WebP；浏览器不支持 WebP 编码时退回 JPEG。GIF 原样保留（保留动画） */
export async function compressImage(file: File): Promise<Blob> {
  if (file.type === 'image/gif') return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  const webp = await toBlob('image/webp', 0.85)
  if (webp?.type === 'image/webp') return webp

  // JPEG 不支持透明，先铺白底
  ctx.globalCompositeOperation = 'destination-over'
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const jpeg = await toBlob('image/jpeg', 0.88)
  if (!jpeg) throw new Error(t().notify.compressFailed)
  return jpeg
}

const EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
}

export async function uploadImages(interviewId: string, files: File[]): Promise<UploadedImage[]> {
  const bucket = supabase.storage.from(IMAGE_BUCKET)
  return Promise.all(
    files.filter(isImageFile).map(async (file) => {
      const blob = await compressImage(file)
      const path = `${interviewId}/${crypto.randomUUID()}.${EXT[blob.type] ?? 'bin'}`
      const { error } = await bucket.upload(path, blob, { contentType: blob.type })
      if (error) throw error
      const { data, error: signError } = await bucket.createSignedUrl(path, SIGNED_URL_TTL)
      if (signError) throw signError
      return { src: data.signedUrl, storagePath: path, alt: file.name }
    }),
  )
}

export async function signImagePaths(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const { data, error } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
  if (error) throw error
  const urls: Record<string, string> = {}
  for (const item of data) if (item.path && item.signedUrl) urls[item.path] = item.signedUrl
  return urls
}

export async function downloadImage(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(IMAGE_BUCKET).download(path)
  if (error) throw error
  return data
}
