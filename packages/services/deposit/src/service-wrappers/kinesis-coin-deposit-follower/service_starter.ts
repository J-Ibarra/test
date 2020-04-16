import { getEnvironment, CurrencyCode } from '@abx-types/reference-data'
import { triggerKinesisCoinDepositFollower } from './core/kinesis_coin_deposit_follower'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'

export async function bootstrapKinesisCoinDepositCheckerProcessor() {
  killProcessOnSignal()

  const onChainCurrencyManager: CurrencyManager = new CurrencyManager(getEnvironment())

  triggerKinesisCoinDepositFollower(onChainCurrencyManager, CurrencyCode.kau)
  // triggerKinesisCoinDepositFollower(onChainCurrencyManager, CurrencyCode.kag)
}
