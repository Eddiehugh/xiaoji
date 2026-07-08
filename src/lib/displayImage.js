const displaySrcCache = new Map()

export function isHeicAsset(asset) {
  const source = `${asset?.type || ''} ${asset?.name || ''} ${asset?.src || ''}`.toLowerCase()
  return source.includes('image/heic') || source.includes('image/heif') || source.includes('.heic') || source.includes('.heif')
}

export async function resolveDisplaySrc(asset) {
  if (!asset?.src) return ''
  if (!isHeicAsset(asset)) return asset.src
  if (displaySrcCache.has(asset.src)) return displaySrcCache.get(asset.src)

  const conversion = (async () => {
    const response = await fetch(asset.src)
    if (!response.ok) throw new Error(`图片读取失败：${response.status}`)
    const input = await response.blob()
    const { default: heic2any } = await import('heic2any')
    const converted = await heic2any({ blob: input, toType: 'image/jpeg', quality: 0.9 })
    const blob = Array.isArray(converted) ? converted[0] : converted
    return URL.createObjectURL(blob)
  })()

  displaySrcCache.set(asset.src, conversion)
  try {
    const objectUrl = await conversion
    displaySrcCache.set(asset.src, objectUrl)
    return objectUrl
  } catch (error) {
    displaySrcCache.delete(asset.src)
    throw error
  }
}
