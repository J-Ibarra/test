import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { CREATE_CURRENCY_TRANSACTION_QUEUE, CurrencyTransactionCreationRequest } from '@abx-service-clients/order'
import { createCurrencyTransaction, findCurrencyTransactions } from '../../../core'
import { Logger } from '@abx-utils/logging'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'

const logger = Logger.getInstance('order-data', 'queue_driven_api_handler')

export function bootstrapQueueDrivenApi() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages<CurrencyTransactionCreationRequest[]>(
    CREATE_CURRENCY_TRANSACTION_QUEUE,
    createCurrencyTransactionIfNotCreatedAlready,
  )
}

async function createCurrencyTransactionIfNotCreatedAlready(createCurrencyTransactionRequests: CurrencyTransactionCreationRequest[]) {
  await wrapInTransaction(sequelize, null, async (transaction) => {
    for (let createCurrencyTransactionRequest of createCurrencyTransactionRequests) {
      const { count: alreadyExistingCurrencyTransactions } = await findCurrencyTransactions({
        where: {
          direction: createCurrencyTransactionRequest.direction,
          requestId: createCurrencyTransactionRequest.requestId,
          currencyId: createCurrencyTransactionRequest.currencyId,
          accountId: createCurrencyTransactionRequest.accountId,
        },
      })

      if (alreadyExistingCurrencyTransactions > 0) {
        logger.info(`Received currency transaction creation request ${createCurrencyTransactionRequest.requestId} which has already been created`)

        continue
      }

      logger.info(
        `Creating ${createCurrencyTransactionRequest.direction} currency transaction for request ${createCurrencyTransactionRequest.requestId}`,
      )

      await createCurrencyTransaction(createCurrencyTransactionRequest, transaction)
    }
  })
}
