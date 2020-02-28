import { ContisResponsePayload } from './ContisResponsePayload'

export interface ConsumerPersonalResult {
  ConsumerID: number
  FirstName: string
  LastName: string
}

export class AddConsumersResponse implements ContisResponsePayload {
  Status: number
  ConsumerPersonalResList: ConsumerPersonalResult[]
  AccountIdentifier: number
  AccountNumber: string
  SortCode: string
  IBAN: string
  BIC: string
  Description: string
  ResponseCode: string
  ClientRequestReference: string

  constructor(contisResponse: any) {
    this.Status = contisResponse.Status
    this.ConsumerPersonalResList = contisResponse.ConsumerPersonalResList
    this.AccountIdentifier = contisResponse.AccountIdentifier
    this.AccountNumber = contisResponse.AccountNumber
    this.SortCode = contisResponse.SortCode
    this.IBAN = contisResponse.IBAN
    this.BIC = contisResponse.BIC
    this.Description = contisResponse.Description
    this.ResponseCode = contisResponse.ResponseCode
    this.ClientRequestReference = contisResponse.ClientRequestReference
  }

  decryptPayload(): AddConsumersResponse {
    return {
      ...this,
    } as any
  }
}
