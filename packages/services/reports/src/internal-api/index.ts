import jsreport from 'jsreport'

import { Environment, localAndTestEnvironments } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import { Express } from 'express'
import { createInternalApi } from './internal_api_endpoints_container'
import { setupInternalApi } from '@abx-utils/internal-api-tools'

const logger = Logger.getInstance('reports', 'bootstrap')

let reportsServer

export async function bootstrapInternalApi(publicApiExpress: Express) {
  jsreport.renderDefaults = Object.assign(jsreport.renderDefaults, {
    dataDirectory: '',
    extensions: ['phantom-pdf', 'html', 'jsrender', 'handlebars'],
  })

  if (!localAndTestEnvironments.includes(process.env.NODE_ENV as Environment) && !reportsServer) {
    logger.info('Boostrapping reports server')
    reportsServer = await jsreport({
      httpPort: 7777,
      logger: {
        file: { transport: 'console', level: 'info' },
        error: { transport: 'console', level: 'error' },
      },
    }).init()
  }

  const internalApiEndpoints = createInternalApi()
  setupInternalApi(publicApiExpress, internalApiEndpoints)
}
