import { IConfirmedTransactionWebhookResponse, IAddressTransactionResponse, IAddressTransactionConfirmationsWebookResponse,IAddressTransactionResponseEth,IConfirmedTransactionWebhookResponseEth } from '../webhook'

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

export interface IEthWebhooks {
  createConfirmedTransactionWebHook: (
    callbackURL: string,
    transaction: string,
    confirmations: number,
    optData?: any,
    queryParams?: any,
  ) => Promise<IConfirmedTransactionWebhookResponseEth>
  createAddressTransactionWebHook: (
    callbackURL: string,
    address: string,
    confirmations: number,
    optData?: any,
    queryParams?: any,
  ) => Promise<IAddressTransactionResponseEth>
  createTransactionConfirmationsWebHook: (
    callbackURL: string,
    address: string,
    confirmations: number,
    optData?: any,
    queryParams?: any,
  ) => Promise<IAddressTransactionConfirmationsWebookResponse>
}
