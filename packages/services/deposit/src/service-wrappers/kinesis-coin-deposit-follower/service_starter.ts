import { getEnvironment, CurrencyCode } from '@abx-types/reference-data'
import { triggerKinesisCoinDepositFollower } from './core/kinesis_coin_deposit_follower'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'
import { CurrencyManager, Kinesis } from '@abx-utils/blockchain-currency-gateway'
import { Logger } from '@abx-utils/logging'
import util from 'util'

const logger = Logger.getInstance('kinesis_coin_deposit_follower', 'bootstrapKinesisCoinDepositCheckerProcessor')

export async function bootstrapKinesisCoinDepositCheckerProcessor() {
  killProcessOnSignal()

  const onChainCurrencyManager: CurrencyManager = new CurrencyManager(getEnvironment())

  const kauCurrencyGateway: Kinesis = (await onChainCurrencyManager.getCurrencyFromTicker(CurrencyCode.kau)) as Kinesis
  const kagCurrencyGateway: Kinesis = (await onChainCurrencyManager.getCurrencyFromTicker(CurrencyCode.kag)) as Kinesis

  triggerDepositFollower(kauCurrencyGateway, CurrencyCode.kau)
  triggerDepositFollower(kagCurrencyGateway, CurrencyCode.kag)
}

function triggerDepositFollower(onChainCurrencyGateway: Kinesis, currency: CurrencyCode) {
  try {
    triggerKinesisCoinDepositFollower(onChainCurrencyGateway, currency)
  } catch (e) {
    logger.error(`Error ocurred in ${currency} deposit follower`)
    logger.error(util.inspect(e))

    triggerDepositFollower(onChainCurrencyGateway, currency)
  }
}
