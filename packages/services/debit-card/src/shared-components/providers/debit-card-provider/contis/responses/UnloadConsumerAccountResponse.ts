import { ContisResponsePayload } from './ContisResponsePayload'

export class UnloadConsumerAccountResponse implements ContisResponsePayload {
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

  decryptPayload(): UnloadConsumerAccountResponse {
    return {
      ...this,
    } as any
  }
}
