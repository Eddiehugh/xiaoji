export function createUploadAssets(files) {
  const createdAt = Date.now()

  return files.map((file, index) => ({
    id: `upload-${createdAt}-${index}`,
    kind: 'upload',
    src: URL.createObjectURL(file),
    alt: file.name,
    name: file.name,
    blob: file,
    createdAt: createdAt + index,
    isNew: true,
  }))
}

export function revokeUploadUrls(items) {
  items.forEach((item) => {
    const src = typeof item === 'string' ? item : item?.src
    const kind = typeof item === 'string' ? 'upload' : item?.kind

    if (kind === 'upload' && src?.startsWith('blob:')) {
      URL.revokeObjectURL(src)
    }
  })
}
