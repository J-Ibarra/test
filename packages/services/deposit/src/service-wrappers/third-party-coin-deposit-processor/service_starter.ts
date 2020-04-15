import '../../core'
import {
  DepositAddressNewTransactionQueuePoller,
} from './core'

export async function bootstrapThirdPartyCoinDepositProcessor() {
  new DepositAddressNewTransactionQueuePoller().bootstrapPoller()
}
