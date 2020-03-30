import { ContisRequestPayload } from './ContisRequestPayload'

export class ChangeConsumerStateRequest implements ContisRequestPayload {
  constructor(
    private ConsumerID: number,
    private ClientRequestReference: string,
  ) {}

  encryptPayload(): ContisRequestPayload {
    return {
      PrimaryConsumerID: this.ConsumerID,
      ClientRequestReference: this.ClientRequestReference,
    } as any
  }
}
