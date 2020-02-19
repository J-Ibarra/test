import '../../core'
import { DepositAddressNewTransactionQueuePoller, DepositTransactionConfirmationQueuePoller } from './core'
import { bootstrapRestApi } from './rest-api'

export async function bootstrapPublicCoinDepositProcessor() {
  new DepositAddressNewTransactionQueuePoller().bootstrapPoller()
  new DepositTransactionConfirmationQueuePoller().bootstrapPoller()

  await bootstrapRestApi()
}
