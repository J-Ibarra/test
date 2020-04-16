import * as express from 'express'
import { getEpicurusInstance, MemoryCache } from '@abx-utils/db-connection-utils'
import { WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL } from '@abx-service-clients/withdrawal'
import { DEPOSIT_ADDRESS_TRANSACTION_QUEUE_URL } from '@abx/exchange-deposit-service/src/service-wrappers/third-party-coin-deposit-processor/core/constants'

export function RegisterRoutes(app: express.Express) {
  const epicurus = getEpicurusInstance()
  const ADDRESS_KEY = 'ADDRESS_KEY'
  const addressCache = MemoryCache.getInstance()

  app.post('/api/webhooks/crypto/deposits/address/transactions/unconfirmed', function (request: any, response: any) {
    console.log(`Received deposit address transaction unconfirmed webhook`)
    response.status(200).end()

    let existingAddresses = addressCache.get<string[]>(ADDRESS_KEY)
    if (existingAddresses && existingAddresses.includes(request.body.address)) {
      setTimeout(() => {
        epicurus.publish(DEPOSIT_ADDRESS_TRANSACTION_QUEUE_URL, { payload: request.body })
        // addressCache.set({key: ADDRESS_KEY, ttl: 10000, val: existingAddresses})
      }, 5000)
    } else {
      epicurus.publish(DEPOSIT_ADDRESS_TRANSACTION_QUEUE_URL, { payload: request.body })
      existingAddresses = existingAddresses || []
      addressCache.set({key: ADDRESS_KEY, ttl: 10000, val: [...existingAddresses, request.body.address]})
    }
  })

  app.post('/api/webhooks/crypto/withdrawals/confirmations', function (request: any, response: any) {
    console.log(`Received withdrawal transaction confirmed webhook`)
    epicurus.publish(WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL, { payload: request.body })
    response.status(200).end()
  })
}
