import '../../core'
import { configureDepositHandler } from './service_configurator'

export async function bootstrapKinesisAndEthCoinDepositProcessor() {
  await configureDepositHandler()
}
