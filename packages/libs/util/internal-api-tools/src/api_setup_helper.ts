import express from 'express'

/** A container for the logic executed to handle a request to a specific route. {@type T - the request body type} {@type K - the response type} */
export interface InternalRoute<T, K> {
  /** The route path. */
  path: string
  /** The handler function invoked on request. */
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
