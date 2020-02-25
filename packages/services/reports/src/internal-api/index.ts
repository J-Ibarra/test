import jsreport from 'jsreport'

import { Logger } from '@abx-utils/logging'
import { Express } from 'express'
import { createInternalApi } from './internal_api_endpoints_container'
import { setupInternalApi } from '@abx-utils/internal-api-tools'

const logger = Logger.getInstance('reports', 'bootstrap')

export async function bootstrapInternalApi(publicApiExpress: Express) {
  jsreport.renderDefaults = Object.assign(jsreport.renderDefaults, {
    dataDirectory: '',
    extensions: {
      'phantom-pdf': { enabled: true },
      html: { enabled: true },
      jsrender: { enabled: true },
      handlebars: { enabled: true },
    },
  })

  logger.info('Boostrapping reports server')
  await jsreport({
    httpPort: 7777,
    logger: {
      file: { transport: 'console', level: 'info' },
      error: { transport: 'console', level: 'error' },
    },
  }).init()

  const internalApiEndpoints = createInternalApi()
  setupInternalApi(publicApiExpress, internalApiEndpoints)
}
