const ASSET_BASE_PATH = '/assets/'

export const seedAssets = [
  { id: 'bell', kind: 'seed', src: `${ASSET_BASE_PATH}xian-bell-tower.png`, alt: '手办与西安钟楼' },
  { id: 'wall', kind: 'seed', src: `${ASSET_BASE_PATH}xian-city-wall.png`, alt: '手办与西安城墙' },
  { id: 'food', kind: 'seed', src: `${ASSET_BASE_PATH}xian-noodles.png`, alt: '西安面食与手办' },
  { id: 'army', kind: 'seed', src: `${ASSET_BASE_PATH}xian-terracotta.png`, alt: '手办与兵马俑' },
]

export const seedEvents = [
  {
    id: 'arrival',
    date: '07.03',
    title: '抵达西安',
    time: '10:20 — 21:30',
    place: '西安咸阳国际机场、钟楼',
    story: '落地西安，先去钟楼打卡，晚风里第一次看见古城亮灯。',
    images: ['bell', 'food'],
    figurine: true,
  },
  {
    id: 'wall',
    date: '07.04',
    title: '城墙与回民街',
    time: '09:00 — 21:00',
    place: '西安城墙、回民街',
    story: '沿着城墙慢慢走，傍晚把一碗热腾腾的面留给今天收尾。',
    images: ['wall', 'food', 'bell'],
    figurine: true,
  },
  {
    id: 'army',
    date: '07.05',
    title: '兵马俑',
    time: '09:30 — 16:30',
    place: '秦始皇帝陵博物院',
    story: '站在兵马俑前，才真正感受到两千年前留下的尺度。',
    images: ['army', 'wall'],
    figurine: true,
  },
]

export function cloneEvents(events) {
  return events.map((event) => ({
    ...event,
    images: [...event.images],
  }))
}
