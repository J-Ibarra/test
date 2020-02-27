import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { getEnvironment } from '@abx-types/reference-data'
import { triggerEthereumBlockFollower } from './core/ethereum_block_follower'


export async function bootstrapEthereumBlockFollowerProcessor() {
  const onChainCurrencyManager = new CurrencyManager(getEnvironment())

  triggerEthereumBlockFollower(onChainCurrencyManager)
}
