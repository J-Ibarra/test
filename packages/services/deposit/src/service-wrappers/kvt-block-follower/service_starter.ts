import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { triggerKVTBlockFollower } from './core/kvt_block_follower'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'

export async function bootstrapKVTBlockFollowerProcessor() {
  killProcessOnSignal()
  const onChainCurrencyManager = new CurrencyManager()

  triggerKVTBlockFollower(onChainCurrencyManager)
}
