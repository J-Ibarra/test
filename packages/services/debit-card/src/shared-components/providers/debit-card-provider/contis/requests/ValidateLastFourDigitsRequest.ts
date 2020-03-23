import { ContisRequestPayload } from './ContisRequestPayload'

export class ValidateLastFourDigitsRequest implements ContisRequestPayload {
  constructor(private L4D: string, private AccountIdentifier: number, private ClientRequestReference: string) {}

  encryptPayload(): ContisRequestPayload {
    return {
      L4D: this.L4D,
      AccountIdentifier: this.AccountIdentifier,
      ClientRequestReference: this.ClientRequestReference,
    } as any
  }
}
