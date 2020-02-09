import { IConfirmationTransactionResponse, IAddressTransactionResponse, ITransactionConfirmationsResponse } from '.'

export interface IWebhooks {
  createConfirmedTransactionWebHook: (
    callbackURL: string,
    transaction: string,
    confirmations: number,
    optData?: any,
    queryParams?: any,
  ) => Promise<IConfirmationTransactionResponse>
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
  ) => Promise<ITransactionConfirmationsResponse>
}
