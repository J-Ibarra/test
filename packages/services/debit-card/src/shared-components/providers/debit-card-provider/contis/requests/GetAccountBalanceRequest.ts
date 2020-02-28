import { ContisRequestPayload } from './ContisRequestPayload'

export class GetAccountBalanceRequest implements ContisRequestPayload {
  constructor(private AccountIdentifier: number) {}

  encryptPayload(): ContisRequestPayload {
    return {
      AccountIdentifier: this.AccountIdentifier,
    } as any
  }
}
