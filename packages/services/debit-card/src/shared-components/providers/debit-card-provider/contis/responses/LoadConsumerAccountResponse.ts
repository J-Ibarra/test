import { ContisResponsePayload } from './ContisResponsePayload'

export class LoadConsumerAccountResponse implements ContisResponsePayload {
  TransactionReferenceID: number
  Description: string
  ResponseCode: string
  ClientRequestReference: string

  constructor(contisResponse: any) {
    this.TransactionReferenceID = contisResponse.TransactionReferenceID
    this.Description = contisResponse.Description
    this.ResponseCode = contisResponse.ResponseCode
    this.ClientRequestReference = contisResponse.ResponseCode
  }

  decryptPayload(): LoadConsumerAccountResponse {
    return {
      ...this,
    } as any
  }
}
