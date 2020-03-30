import { ContisRequestPayload } from './ContisRequestPayload'

export class ListAccountsRequest implements ContisRequestPayload {
  constructor(
    private ConsumerID: number,
    private ClientRequestReference: string,
  ) {}

  encryptPayload(): ContisRequestPayload {
    return {
      ConsumerID: this.ConsumerID,
      ClientRequestReference: this.ClientRequestReference,
    } as any
  }
}
