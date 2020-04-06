import '../../core'
import {
  DepositAddressNewTransactionQueuePoller,
  DepositTransactionConfirmationQueuePoller,
  HoldingsTransactionConfirmationQueuePoller,
} from './core'

export async function bootstrapThirdPartyCoinDepositProcessor() {
  new DepositAddressNewTransactionQueuePoller().bootstrapPoller()
  new DepositTransactionConfirmationQueuePoller().bootstrapPoller()
  new HoldingsTransactionConfirmationQueuePoller().bootstrapPoller()
}
