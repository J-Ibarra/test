import { ContisRequestPayload } from './ContisRequestPayload'

export const INTERNAL_WITHDRAWAL_PREFIX = 'Card to Kinesis Exchange Withdrawal'

export class UnloadConsumerAccountRequest implements ContisRequestPayload {
  constructor(private Amount: number, private AccountIdentifier: number, private ClientRequestReference: string) {}

  encryptPayload(): ContisRequestPayload {
    return {
      Amount: this.Amount,
      AccountIdentifier: this.AccountIdentifier,
      Description: INTERNAL_WITHDRAWAL_PREFIX,
      ClientRequestReference: this.ClientRequestReference,
    } as any
  }
}
