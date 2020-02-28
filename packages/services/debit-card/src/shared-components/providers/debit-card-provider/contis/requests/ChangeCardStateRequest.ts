import { ContisRequestPayload } from './ContisRequestPayload'

export class ChangeCardStateRequest implements ContisRequestPayload {
  constructor(private CardID: number, private ConsumerID: number, private ClientRequestReference: string) {}

  encryptPayload(): ContisRequestPayload {
    return {
      CardID: this.CardID,
      ConsumerID: this.ConsumerID,
      ClientRequestReference: this.ClientRequestReference,
    } as any
  }
}
