import cors from 'cors'
import { Environment } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'

const ENVIRONMENTS_WITH_LOCALHOST_ORIGIN_ENABLED = [
  Environment[Environment.test],
  Environment[Environment.e2eAws],
  Environment[Environment.e2eLocal],
  Environment[Environment.development],
  Environment[Environment.integration],
  Environment[Environment.uat],
]

const logger = Logger.getInstance('api', 'cors_config')

/**
 * Configures CORS based on the current environment.
 * For integration and uat environments http://localhost:1234 is also an allowed origin.
 *
 * @param app the express app object
 */
export function configureCORS(app) {
  logger.debug(`Enabling CORS for ${process.env.KMS_DOMAIN}`)

  app.use(
    cors({
      origin: CORS_ENABLED_ORIGINS,
      credentials: true,
    }),
  )
}

export const CORS_ENABLED_ORIGINS = ENVIRONMENTS_WITH_LOCALHOST_ORIGIN_ENABLED.includes(process.env.NODE_ENV as any)
  ? [process.env.KMS_DOMAIN, process.env.MARKETING_DOMAIN, process.env.KINESIS_EXPLORER_DOMAIN, 'http://localhost:1234']
  : [process.env.KMS_DOMAIN, process.env.MARKETING_DOMAIN, process.env.KINESIS_EXPLORER_DOMAIN, 'http://localhost:1234']
