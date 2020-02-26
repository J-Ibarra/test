import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'
import { DepositAsyncEndpoints } from './async_endpoints'
import { DepositAsyncRequest } from './async_endpoint_request'

export const localDepositChangeTopic = 'local-deposit-change-topic'

export function createWalletAddressesForNewAccount(accountId: string) {
  return sendAsyncChangeMessage<DepositAsyncRequest>({
    id: `createWalletAddressesForNewAccount-${accountId}`
    type: DepositAsyncEndpoints.createWalletAddressesForNewAccount,
    target: {
      local: localDepositChangeTopic,
      deployedEnvironment: process.env.DEPOSIT_REQUEST_QUEUE_URL!,
    },
    payload: {
      type: DepositAsyncEndpoints.createWalletAddressesForNewAccount,
      payload: {
        accountId,
      },
    },
  })
}
