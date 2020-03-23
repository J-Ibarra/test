import { Logger } from '@abx-utils/logging'

const logger = Logger.getInstance('internal-api-tools', 'killProcessOnSignal')

export function killProcessOnSignal() {
  process.on('SIGINT', () => {
    logger.warn('Contract exchange received SIGINT')
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    logger.warn('Contract exchange received SIGTERM')
    process.exit(0)
  })
}
