import httpProxy from 'http-proxy'
import http from 'http'
import sourceMapSupport from 'source-map-support'
import { pickRouteBasedForwarding } from './request_handler'
import { setEnvironmentVariables } from './env_var_setter'
import { startAllServices } from './service_starter'

sourceMapSupport.install()

async function bootstrap() {
  await setEnvironmentVariables()

  await startAllServices()

  const proxy = httpProxy.createProxyServer()
  const proxyServer = http.createServer(function(req, res) {
    const handler = pickRouteBasedForwarding(req, res, proxy)

    if (!!handler) {
      return handler()
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  })

  console.log('Proxy listening on port 3000')
  proxyServer.listen(3000)
}

bootstrap()
