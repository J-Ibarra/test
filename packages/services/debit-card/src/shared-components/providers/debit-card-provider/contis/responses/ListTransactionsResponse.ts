import moment from 'moment'

import { ContisResponsePayload } from './ContisResponsePayload'
import { CoreTransactionDetails, TransactionType } from '../../../../models'

export interface ContisTransaction {
  UTCTransactionDate: string
  Description: string
  TransactionAmount: number
  TransactionType: string
  TransactionID: number
}

export class ListTransactionResponse implements ContisResponsePayload {
  TransactionResList: ContisTransaction[]
  ResponseCode: string

  constructor(contisResponse: any) {
    this.TransactionResList = contisResponse.TransactionResList
    this.ResponseCode = contisResponse.ResponseCode
  }

  decryptPayload(): ListTransactionResponse {
    return this
  }

  formatRawTransactionsToCoreTransactionDetails(): CoreTransactionDetails[] {
    return this.TransactionResList.map(
      ({ UTCTransactionDate, Description, TransactionAmount, TransactionType: type, TransactionID }) => ({
        providerTransactionIdentifier: TransactionID,
        amount: TransactionAmount,
        type: formatContisTransactionType(type),
        description: Description,
        createdAt: moment(UTCTransactionDate).toDate(),
        metadata: null,
      }),
    )
  }
}

export const formatContisTransactionType = (type: string): TransactionType => {
  // The following transaction type codes are taken from Contis developer docs
  if (type === '006' || type === '021' || type === '029' || type === '044') {
    return TransactionType.incoming
  } else {
    return TransactionType.outgoing
  }
}
