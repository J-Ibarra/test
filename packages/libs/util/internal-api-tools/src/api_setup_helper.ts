import express from 'express'

export interface InternalRoute<T, K> {
  path: string
  handler: (requestParams: T) => Promise<K>
}

export function setupInternalApi(app: express.Express, routes: InternalRoute<any, any>[]) {
  routes.forEach(route => {
    app.post(`/internal-api/${route.path}`, async (req, res) => {
      try {
        const result = await route.handler(req.body)

        res.status(200)
        res.send(result)
      } catch (e) {
        res.status(500)
        res.send()
      }
    })
  })
}
