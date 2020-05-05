import '../../core'
import { configureKVTAndETHDepositHandler } from './kvt_eth_configurator'
import { configureKinesisDepositHandler } from './kinesis_service_configurator'

export async function bootstrapKinesisAndEthCoinDepositProcessor() {
  await configureKVTAndETHDepositHandler()
  await configureKinesisDepositHandler()
}
