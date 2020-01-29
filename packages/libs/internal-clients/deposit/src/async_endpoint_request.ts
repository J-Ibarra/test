import { DepositAsyncEndpoints } from './async_endpoints'

export interface CreateWalletAddressesPayload {
  accountId: string
}

export type DepositAsyncRequestPayload = CreateWalletAddressesPayload

export interface DepositAsyncRequest {
  type: DepositAsyncEndpoints.createWalletAddressesForNewAccount
  payload: DepositAsyncRequestPayload
}
