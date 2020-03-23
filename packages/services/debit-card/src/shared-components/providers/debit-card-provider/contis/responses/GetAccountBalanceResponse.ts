import { ContisResponsePayload } from './ContisResponsePayload'

export class GetAccountBalanceResponse implements ContisResponsePayload {
  Description: string
  ResponseCode: string
  ClientRequestReference: string
  AvailableBalance: number

  constructor(contisResponse: any) {
    this.AvailableBalance = contisResponse.AvailableBalance
    this.Description = contisResponse.Description
    this.ResponseCode = contisResponse.ResponseCode
    this.ClientRequestReference = contisResponse.ResponseCode
  }

  decryptPayload(): GetAccountBalanceResponse {
    return {
      ...this,
    } as any
  }
}
