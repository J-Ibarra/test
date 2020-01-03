import { BalanceChangeAsyncRequestContainer } from '@abx-types/balance'

/** A mechanism for subscribing to queue messages. */
export interface QueuePoller {
  subscribeToQueueMessages(queueUrl: string, handler: (message: BalanceChangeAsyncRequestContainer) => Promise<void>)
}
