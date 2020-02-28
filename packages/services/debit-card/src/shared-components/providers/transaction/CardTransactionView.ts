import {
  TransactionType,
  KinesisCryptoCurrency,
  TopUpRequest,
  WithdrawalTransactionMetadata,
  CurrencyCode,
  TopUpRequestStatus,
  CoreTransactionDetails,
} from '../../models'

export interface TopUpRequestMetadata {
  currencySold: CurrencyCode
  amountSold: number | null
  amountFilled: number | null
  status: TopUpRequestStatus
  topUpRequestId: number
}

export class CardTransactionView {
  id?: number
  amount: number | null
  type: TransactionType
  description: string
  createdAt: string
  metadata?: WithdrawalTransactionMetadata | TopUpRequestMetadata | null

  public static ofTopUpRequest(transaction: CoreTransactionDetails, topUpRequest: TopUpRequest): CardTransactionView {
    return {
      id: transaction.id,
      amount: transaction.amount,
      type: TransactionType.incoming,
      description: `${topUpRequest.soldCurrency} Top Up`,
      createdAt: transaction.createdAt.toString(),
      metadata: {
        currencySold: KinesisCryptoCurrency[topUpRequest.soldCurrency.toLowerCase()],
        amountSold: topUpRequest.soldCurrencyAmount,
        amountFilled: topUpRequest.amountFilled,
        status: topUpRequest.status,
        topUpRequestId: topUpRequest.id,
      },
    }
  }

  public static ofTransaction(transaction: CoreTransactionDetails): CardTransactionView {
    return {
      id: transaction.id,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      createdAt: transaction.createdAt.toString(),
      metadata: !!transaction.metadata
        ? {
            fee: (transaction.metadata as WithdrawalTransactionMetadata).fee,
          }
        : null,
    }
  }
}
