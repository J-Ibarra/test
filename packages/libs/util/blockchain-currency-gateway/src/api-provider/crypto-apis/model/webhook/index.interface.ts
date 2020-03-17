import {
  IConfirmedTransactionWebhookResponse,
  IAddressTokenTransactionResponse,
  IAddressTransactionResponse,
  IAddressTransactionConfirmationsWebookResponse,
} from '../webhook'

export interface IGenericWebhookOperations {
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

export interface IEthWebhookOperations extends IGenericWebhookOperations {
  createTokenWebHook(callbackURL: string, address: string, confirmations: number): Promise<IAddressTokenTransactionResponse>
}
