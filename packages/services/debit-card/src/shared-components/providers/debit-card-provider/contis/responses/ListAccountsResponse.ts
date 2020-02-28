import { ContisResponsePayload } from './ContisResponsePayload'

export interface AccountDetailsResult {
  AccountIdentifier: number
  AccountNumber: string
  SortCode: string
  ISOAccountCurrencyCode: string
  IBAN: string
  BIC: string
  AccountStatus: string
  AccountType: number
  IsMainAccount: boolean
  AccountBalance: number
  DebitHoldBalance: number
  CreditHoldBalance: number
  EnvelopeHoldBalance: number
  AvailableBalance: number
}

export class ListAccountsResponse implements ContisResponsePayload {
  AccountResList: AccountDetailsResult[]
  Description: string
  ResponseCode: string
  ResponseDateTime: string
  ClientRequestReference: string
  RequestID: number

  constructor(contisResponse: any) {
    this.AccountResList = contisResponse.AccountResList
    this.Description = contisResponse.Description
    this.ResponseCode = contisResponse.ResponseCode
    this.ResponseDateTime = contisResponse.ResponseDateTime
    this.ClientRequestReference = contisResponse.ResponseCode
    this.RequestID = this.RequestID
  }

  decryptPayload(): ListAccountsResponse {
    return {
      ...this,
    } as any
  }
}
