import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { DepositAsyncRequest, localDepositChangeTopic, DepositPubSubChannels } from '@abx-service-clients/deposit'
import { DepositAsyncEndpoints } from '@abx-service-clients/deposit/dist/async_endpoints'
import { createMissingDepositAddressesForAccount } from '../../../core'
import { Logger } from '@abx-utils/logging'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'

const logger = Logger.getInstance('queue_request_consumer', 'consumeQueueMessage')

export function bootstrapQueueDrivenApi() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages(process.env.BALANCE_CHANGE_QUEUE_URL || localDepositChangeTopic, consumeQueueMessage)
}

async function consumeQueueMessage({ type, payload }: DepositAsyncRequest): Promise<void> {
  if (type === DepositAsyncEndpoints.createWalletAddressesForNewAccount) {
    logger.info(`Processing ${DepositAsyncEndpoints.createWalletAddressesForNewAccount} request`)
    await createMissingDepositAddressesForAccount(payload.accountId, [])

    const epicurus = getEpicurusInstance()
    epicurus.publish(DepositPubSubChannels.walletAddressesForNewAccountCreated, { accountId: payload.accountId })
  }

  return Promise.resolve()
}
