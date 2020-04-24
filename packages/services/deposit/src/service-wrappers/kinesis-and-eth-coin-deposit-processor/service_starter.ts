import '../../core'
import { configureDepositHandler } from './service_configurator'
import { configureKinesisDepositHandler } from './kinesis_service_configurator'

export async function bootstrapKinesisAndEthCoinDepositProcessor() {
  await configureDepositHandler()
  await configureKinesisDepositHandler()
}
