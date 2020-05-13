import { getQueuePoller, QueueConsumerOutput } from '@abx-utils/async-message-consumer'
import { DepositAsyncRequest, localDepositChangeTopic, DepositPubSubChannels } from '@abx-service-clients/deposit'
import { DepositAsyncEndpoints } from '@abx-service-clients/deposit/dist/async_endpoints'
import { createMissingDepositAddressesForAccount, findDepositAddressesForAccount } from '../../../core'
import { Logger } from '@abx-utils/logging'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import util from 'util'

const logger = Logger.getInstance('queue_request_consumer', 'consumeQueueMessage')

export function bootstrapQueueDrivenApi() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages(process.env.DEPOSIT_CHANGE_QUEUE_URL || localDepositChangeTopic, consumeQueueMessage)
}

async function consumeQueueMessage({ type, payload }: DepositAsyncRequest): Promise<void | QueueConsumerOutput> {
  if (type === DepositAsyncEndpoints.createWalletAddressesForNewAccount) {
    try {
      const depositAddresses = await findDepositAddressesForAccount(payload.accountId)
      logger.info(`Processing ${DepositAsyncEndpoints.createWalletAddressesForNewAccount} request`)
      const newDepositAddresses = await createMissingDepositAddressesForAccount(payload.accountId, depositAddresses)

      const epicurus = getEpicurusInstance()
      epicurus.publish(DepositPubSubChannels.walletAddressesForNewAccountCreated, { accountId: payload.accountId, newDepositAddresses })
    } catch (e) {
      logger.error(`An error has ocurred while processing withdrawal request, skipping deletion.`)
      logger.error(util.inspect(e))

      // Skipping deletion so message can be added to DLQ
      return { skipMessageDeletion: true }
    }
  }
}
