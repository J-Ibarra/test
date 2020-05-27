import { CurrencyCode } from '@abx-types/reference-data'
import { triggerKinesisCoinDepositFollower, lastExecutions } from './core/kinesis_coin_deposit_follower'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'
import { CurrencyManager, Kinesis } from '@abx-utils/blockchain-currency-gateway'
import { Logger } from '@abx-utils/logging'
import util from 'util'

const HEALTHCHECK_PERIOD = 15 * 1000
const MAX_TIME_SINCE_LAST_EXEC = 60 * 1000
const logger = Logger.getInstance('kinesis_coin_deposit_follower', 'bootstrapKinesisCoinDepositCheckerProcessor')

export async function bootstrapKinesisCoinDepositCheckerProcessor() {
  killProcessOnSignal()

  const onChainCurrencyManager: CurrencyManager = new CurrencyManager()

  const kauCurrencyGateway: Kinesis = (await onChainCurrencyManager.getCurrencyFromTicker(CurrencyCode.kau)) as Kinesis
  const kagCurrencyGateway: Kinesis = (await onChainCurrencyManager.getCurrencyFromTicker(CurrencyCode.kag)) as Kinesis

  triggerDepositFollower(kauCurrencyGateway, CurrencyCode.kau)
  triggerDepositFollower(kagCurrencyGateway, CurrencyCode.kag)
}

function triggerDepositFollower(onChainCurrencyGateway: Kinesis, currency: CurrencyCode) {
  try {
    triggerKinesisCoinDepositFollower(onChainCurrencyGateway, currency)
    triggerHealthCheck(onChainCurrencyGateway, currency)
  } catch (e) {
    logger.error(`Error ocurred in ${currency} deposit follower`)
    logger.error(util.inspect(e))

    triggerDepositFollower(onChainCurrencyGateway, currency)
  }
}

function triggerHealthCheck(onChainCurrencyGateway: Kinesis, currency: CurrencyCode): void {
  setInterval(() => {
    const currentDate = new Date()
    const lastRecorderExecutionDate = lastExecutions.get(currency)

    if (lastRecorderExecutionDate && currentDate.getTime() - lastRecorderExecutionDate.getTime() >= MAX_TIME_SINCE_LAST_EXEC) {
      logger.error(`${currency} deposit follower stopped working, reviving`)
      triggerDepositFollower(onChainCurrencyGateway, currency)
    }
  }, HEALTHCHECK_PERIOD)
}
