import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { triggerEthereumBlockFollower } from './core/ethereum_block_follower'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'

export async function bootstrapEthereumBlockFollowerProcessor() {
  killProcessOnSignal()
  const onChainCurrencyManager = new CurrencyManager()

  triggerEthereumBlockFollower(onChainCurrencyManager)
}
