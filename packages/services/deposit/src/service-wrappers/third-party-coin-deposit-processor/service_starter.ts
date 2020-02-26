import '../../core'
import { DepositAddressNewTransactionQueuePoller, DepositTransactionConfirmationQueuePoller } from './core'

export async function bootstrapThirdPartyCoinDepositProcessor() {
  new DepositAddressNewTransactionQueuePoller().bootstrapPoller()
  new DepositTransactionConfirmationQueuePoller().bootstrapPoller()
}
