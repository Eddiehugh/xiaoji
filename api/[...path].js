import { ensureStorage, route } from '../server/index.js'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  await ensureStorage()
  return route(req, res)
}
