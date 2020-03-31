import '../../core'
import { bootstrapRestApi } from './rest-api'
import { DEPOSIT_API_PORT } from '@abx-service-clients/deposit'
import { bootstrapInternalApi, bootstrapQueueDrivenApi } from './internal-api'
import { runDepositDataMigrations } from '../../migrations/migration-runner'
import { Environment } from '@abx-types/reference-data'

export async function bootstrapDepositApi() {
  if (process.env.NODE_ENV !== Environment.development && process.env.NODE_ENV !== Environment.e2eLocal) {
    await runDepositDataMigrations()
  }
  await bootstrapQueueDrivenApi()

  const publicApi = await bootstrapRestApi()
  bootstrapInternalApi(publicApi)

  const server = publicApi.listen(DEPOSIT_API_PORT)

  /** Due to intermittent 502 response on the Load balancer side, the following 2 server settings need to be made. */
  server.keepAliveTimeout = 65000 // Ensure all inactive connections are terminated by the ALB, by setting this a few seconds higher than the ALB idle timeout
  server.headersTimeout = 66000 // Ensure the headersTimeout is set higher than the keepAliveTimeout due to this nodejs regression bug: https://github.com/nodejs/node/issues/27363
}
