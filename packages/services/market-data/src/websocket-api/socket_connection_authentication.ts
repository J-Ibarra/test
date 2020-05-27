import { Logger } from '@abx-utils/logging'
import { overloadRequestWithSessionInfo } from '@abx-utils/express-middleware'

const logger = Logger.getInstance('market_data', 'socket_connection_authentication.ts')

export async function authenticateSocketConnection(request, callback) {
  logger.debug('Received socket connection request.')
  const cookies = request.headers.cookie ? request.headers.cookie.split('; ') : []
  request.header = (headerName: string) => request.headers[headerName.toLowerCase()]

  const appSessionCookie = cookies.find((cookiePair) => cookiePair.startsWith('appSession'))
  if (!!appSessionCookie) {
    request.cookies = {
      appSession: appSessionCookie.split('=')[1],
    }
  }

  await overloadRequestWithSessionInfo(request)

  if (!!request.account) {
    return callback(undefined, true)
  }

  return callback(undefined, false)
}
