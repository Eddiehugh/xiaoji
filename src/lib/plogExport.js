function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

export async function downloadPlogImage({ events, assetsById }) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1440

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#f5f0e7'
  ctx.fillRect(0, 0, 1080, 1440)
  ctx.fillStyle = '#1f211f'
  ctx.font = '700 58px sans-serif'
  ctx.fillText('西安 · 三日小旅行', 70, 100)
  ctx.font = '24px sans-serif'
  ctx.fillStyle = '#6e706b'
  ctx.fillText('带着小橘，走过古城的三天', 70, 145)

  const chosen = [
    assetsById[events[0]?.images[0]],
    assetsById[events[1]?.images[0]],
    assetsById[events[2]?.images[0]],
  ].filter(Boolean)

  const loaded = await Promise.all(chosen.map((asset) => loadImage(asset.src)))

  if (loaded.length >= 3) {
    ctx.drawImage(loaded[0], 70, 190, 940, 600)
    ctx.drawImage(loaded[1], 70, 820, 455, 360)
    ctx.drawImage(loaded[2], 555, 820, 455, 360)
  }

  ctx.fillStyle = '#d84c20'
  ctx.font = '700 26px sans-serif'
  ctx.fillText('XI’AN · 2026.07', 70, 1260)
  ctx.fillStyle = '#343632'
  ctx.font = '28px sans-serif'
  ctx.fillText('钟楼、城墙、面食，还有两千年前的回响。', 70, 1320)

  const link = document.createElement('a')
  link.download = '小迹-西安三日Plog.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}
