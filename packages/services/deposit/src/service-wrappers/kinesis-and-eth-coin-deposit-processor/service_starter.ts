import '../../core'
import { configureDepositHandler } from './service_configurator'
import { getExchangeDepositPollingFrequency } from '@abx-service-clients/reference-data'

export async function bootstrapKinesisAndEthCoinDepositProcessor() {
  const pollingFrequency = await getExchangeDepositPollingFrequency()
  await configureDepositHandler(pollingFrequency)
}
