import http from 'http'
import { routesToPort } from './request_routes'

import { ORDER_DATA_API_PORT, ORDER_GATEWAY_API_PORT } from '@abx-service-clients/order'

export function pickRouteBasedForwarding(req: http.IncomingMessage, res, proxy): VoidFunction | null {
  const targetService = routesToPort.find(({ routes }) => isRequestTargetRouteWithinRoutes(req.url!, routes!))

  if (!!targetService) {
    return () => proxy.web(req, res, { target: `http://127.0.0.1:${targetService.port}` })
  } else if (req.url!.startsWith('/api/orders') || req.url!.startsWith('/api/admin/orders')) {
    if (
      (req.url === '/api/orders' && (req.method === 'POST' || req.method === 'DELETE')) ||
      (req.url!.startsWith('/api/admin/orders') && req.method === 'DELETE')
    ) {
      return () => proxy.web(req, res, { target: `http://127.0.0.1:${ORDER_GATEWAY_API_PORT}` })
    }

    return () => proxy.web(req, res, { target: `http://127.0.0.1:${ORDER_DATA_API_PORT}` })
  }

  return null
}

function isRequestTargetRouteWithinRoutes(url: string, routes: string[]) {
  return routes.some(depositRoute => url!.startsWith(depositRoute))
}
