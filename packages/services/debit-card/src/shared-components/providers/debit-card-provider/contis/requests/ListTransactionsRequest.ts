import moment from 'moment'

import { ContisRequestPayload } from './ContisRequestPayload'

export class ListTransactionsRequest implements ContisRequestPayload {
  constructor(
    private From: Date,
    private To: Date,
    private ClientRequestReference: string,
    private AccountIdentifier: number,
  ) {}

  encryptPayload(): ContisRequestPayload {
    return {
      AccountIdentifier: this.AccountIdentifier,
      Pagesize: 200,
      FromDate: moment(this.From).format(),
      ToDate: moment(this.To).format(),
      ClientRequestReference: this.ClientRequestReference,
    } as any
  }
}
