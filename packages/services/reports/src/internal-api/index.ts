import jsreport from 'jsreport'

import { Environment, localAndTestEnvironments } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import { report } from './message_schema'
import { ReportEndpoints } from '@abx-service-clients/report'
import { createReportAndUploadToS3 } from '../core'

const logger = Logger.getInstance('reports', 'bootstrap')

let reportsServer

export async function bootstrapInternalApi() {
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

  const epicurus = getEpicurusInstance()
  return epicurus.server(ReportEndpoints.generateReport, (request, callback) => {
    logger.debug(`Report generation request received: ${JSON.stringify(request)}`)
    if (localAndTestEnvironments.includes(process.env.NODE_ENV as Environment)) {
      return callback(null, {})
    }

    logger.debug(`Generating report for: ${JSON.stringify(request)}`)
    return messageFactory(report, createReportAndUploadToS3)(request, callback)
  })
}
