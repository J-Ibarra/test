import { ContisRequestPayload } from './ContisRequestPayload'

export class GetSpecificConsumerRequest implements ContisRequestPayload {
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
