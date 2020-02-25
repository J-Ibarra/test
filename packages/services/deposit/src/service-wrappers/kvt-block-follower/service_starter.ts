import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { getEnvironment } from '@abx-types/reference-data'
import { triggerKVTBlockFollower } from './core/kvt_block_follower'


export async function bootstrapKVTBlockFollowerProcessor() {
  const onChainCurrencyManager = new CurrencyManager(getEnvironment())

  triggerKVTBlockFollower(onChainCurrencyManager)
}
