import { IConfirmedTransactionWebhookResponse, IAddressTransactionResponse, IAddressTransactionConfirmationsWebookResponse } from '../webhook'

export interface IWebhooks {
  createConfirmedTransactionWebHook: (
    callbackURL: string,
    transaction: string,
    confirmations: number,
    optData?: any,
    queryParams?: any,
  ) => Promise<IConfirmedTransactionWebhookResponse>
  createAddressTransactionWebHook: (
    callbackURL: string,
    address: string,
    confirmations: number,
    optData?: any,
    queryParams?: any,
  ) => Promise<IAddressTransactionResponse>
  createTransactionConfirmationsWebHook: (
    callbackURL: string,
    address: string,
    confirmations: number,
    optData?: any,
    queryParams?: any,
  ) => Promise<IAddressTransactionConfirmationsWebookResponse>
}
