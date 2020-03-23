import { ContisRequestPayload } from './ContisRequestPayload'

export class ListCardsRequest implements ContisRequestPayload {
  constructor(private AccountIdentifier: number, private ClientRequestReference: string) {}

  encryptPayload(): ContisRequestPayload {
    return {
      AccountIdentifier: this.AccountIdentifier,
      ClientRequestReference: this.ClientRequestReference,
    } as any
  }
}
