import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { getEnvironment } from '@abx-types/reference-data'
import { triggerEthereumBlockFollower } from './core/ethereum_block_follower'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'

export async function bootstrapEthereumBlockFollowerProcessor() {
  killProcessOnSignal()
  const onChainCurrencyManager = new CurrencyManager(getEnvironment())

  triggerEthereumBlockFollower(onChainCurrencyManager)
}
