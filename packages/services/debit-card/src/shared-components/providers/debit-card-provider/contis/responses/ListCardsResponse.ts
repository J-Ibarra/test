import { ContisResponsePayload } from './ContisResponsePayload'

export const NORMAL_CARD_STATE = 1

export interface ContisCardResult {
  CardID: number
  ConsumerID: number
  ObscuredCardNumber: string
  CardDisplayName: string
  CardStatus: number
  CardIssueDate: string
}

export class ListCardsResponse implements ContisResponsePayload {
  CardResList: ContisCardResult[]
  Description: string
  ResponseCode: string
  ClientRequestReference: string

  constructor(contisResponse: any) {
    this.CardResList = contisResponse.CardResList
    this.Description = contisResponse.Description
    this.ResponseCode = contisResponse.ResponseCode
    this.ClientRequestReference = contisResponse.ResponseCode
  }

  decryptPayload(): ListCardsResponse {
    return {
      ...this,
    } as any
  }
}
