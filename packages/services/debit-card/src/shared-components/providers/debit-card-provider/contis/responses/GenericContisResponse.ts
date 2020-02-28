import { ContisResponsePayload } from './ContisResponsePayload'

export class GenericContisResponse implements ContisResponsePayload {
  Description: string
  ResponseCode: string
  ResponseDateTime: string
  ClientRequestReference: string
  RequestID: number

  constructor(contisResponse: any) {
    this.Description = contisResponse.Description
    this.ResponseCode = contisResponse.ResponseCode
    this.ResponseDateTime = contisResponse.ResponseDateTime
    this.ClientRequestReference = contisResponse.ResponseCode
    this.RequestID = this.RequestID
  }

  decryptPayload(): GenericContisResponse {
    return {
      ...this,
    } as any
  }
}
