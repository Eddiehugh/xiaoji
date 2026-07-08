export function isHeicFile(file) {
  const name = file.name.toLowerCase()
  return file.type === 'image/heic' || file.type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif')
}

function jpegName(name) {
  return name.replace(/\.(heic|heif)$/i, '.jpg')
}

export async function normalizeImagesForUpload(files) {
  const normalized = []

  for (const file of files) {
    if (!isHeicFile(file)) {
      normalized.push(file)
      continue
    }

    const { default: heic2any } = await import('heic2any')
    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    })
    const blob = Array.isArray(converted) ? converted[0] : converted
    normalized.push(
      new File([blob], jpegName(file.name), {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      }),
    )
  }

  return normalized
}
