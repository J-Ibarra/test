import { ConsumerPersonalResult } from './AddConsumersResponse'
import { ContisResponsePayload } from './ContisResponsePayload'

export interface ConsumerRes {
  ConsumerPersonalRes: ConsumerPersonalResult
  ContactRes: ContactRes
}

export interface ContactRes {
  EmailAddress: string
}

export class GetSpecificConsumerResponse implements ContisResponsePayload {
  ConsumerID: number
  Status: number
  ConsumerRes: ConsumerRes
  AccountIdentifier: number
  AccountNumber: string
  SortCode: string
  IBAN: string
  BIC: string
  Description: string
  ResponseCode: string
  ClientRequestReference: string

  constructor(contisResponse: any) {
    this.ConsumerID = contisResponse.ConsumerID
    this.Status = contisResponse.Status
    this.ConsumerRes = contisResponse.ConsumerRes
    this.AccountIdentifier = contisResponse.AccountIdentifier
    this.AccountNumber = contisResponse.AccountNumber
    this.SortCode = contisResponse.SortCode
    this.IBAN = contisResponse.IBAN
    this.BIC = contisResponse.BIC
    this.Description = contisResponse.Description
    this.ResponseCode = contisResponse.ResponseCode
    this.ClientRequestReference = contisResponse.ClientRequestReference
  }

  decryptPayload(): GetSpecificConsumerResponse {
    return {
      ...this,
    } as any
  }
}
