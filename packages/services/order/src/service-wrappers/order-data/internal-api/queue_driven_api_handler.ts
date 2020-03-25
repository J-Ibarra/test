import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { CREATE_CURRENCY_TRANSACTION_QUEUE, CurrencyTransactionCreationRequest } from '@abx-service-clients/order'
import { createCurrencyTransaction } from '../../../core'
import { Logger } from '@abx-utils/logging'

const logger = Logger.getInstance('order-data', 'queue_driven_api_handler')

export function bootstrapQueueDrivenApi() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages(
    CREATE_CURRENCY_TRANSACTION_QUEUE,
    async (createCurrencyTransactionRequest: CurrencyTransactionCreationRequest) => {
      logger.info(
        `Creating ${createCurrencyTransactionRequest.direction} currency transaction for request ${createCurrencyTransactionRequest.requestId}`,
      )

      await createCurrencyTransaction(createCurrencyTransactionRequest)
    },
  )
}
