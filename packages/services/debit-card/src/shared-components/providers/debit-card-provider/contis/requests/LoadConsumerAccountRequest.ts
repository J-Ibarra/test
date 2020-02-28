import { ContisRequestPayload } from './ContisRequestPayload'
import { TOP_UP_REQUEST_DESCRIPTION } from '../../../../models'

export class LoadConsumerAccountRequest implements ContisRequestPayload {
  constructor(private Amount: number, private AccountIdentifier: number, private ClientRequestReference: string) {}

  encryptPayload(): ContisRequestPayload {
    return {
      Amount: this.Amount,
      AccountIdentifier: this.AccountIdentifier,
      ClientRequestReference: this.ClientRequestReference,
      Description: TOP_UP_REQUEST_DESCRIPTION,
    } as any
  }
}
