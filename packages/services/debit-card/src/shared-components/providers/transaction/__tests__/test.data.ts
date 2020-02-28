import moment from 'moment'

import { Transaction, TransactionType, TopUpRequest, TopUpRequestStatus, KinesisCryptoCurrency } from '../../../models'
import { testDebitCard } from './test.utils'

const topUpRequestId = 3
export const transactions: Transaction[] = [
  {
    id: 2,
    debitCard: testDebitCard,
    amount: 10,
    type: TransactionType.incoming,
    description: 'Foo ABC',
    providerTransactionIdentifier: 10,
    createdAt: moment().toDate(),
    updatedAt: new Date(),
    metadata: {
      topUpRequestId,
    },
  },
  {
    id: 1,
    debitCard: testDebitCard,
    amount: 12,
    type: TransactionType.outgoing,
    description: 'Bar ABC',
    providerTransactionIdentifier: 12,
    createdAt: moment()
      .subtract(1, 'hours')
      .toDate(),
    updatedAt: new Date(),
    metadata: null,
  },
]

export const topUpRequests: TopUpRequest[] = [
  {
    id: 4,
    debitCard: testDebitCard,
    orderId: 3,
    soldCurrencyAmount: 10,
    soldCurrency: KinesisCryptoCurrency.kag,
    status: TopUpRequestStatus.orderPlaced,
    amountToTopUp: null,
    amountFilled: null,
    createdAt: moment()
      .add(1, 'hours')
      .toDate(),
    updatedAt: new Date(),
  },
  {
    id: topUpRequestId,
    debitCard: testDebitCard,
    orderId: 4,
    soldCurrencyAmount: 12,
    soldCurrency: KinesisCryptoCurrency.kag,
    status: TopUpRequestStatus.complete,
    amountToTopUp: 100,
    amountFilled: 12,
    createdAt: moment()
      .subtract(2, 'hours')
      .toDate(),
    updatedAt: new Date(),
  },
]

export const contisTransactions = [
  {
    id: 9,
    debitCard: testDebitCard,
    amount: 10,
    type: TransactionType.incoming,
    description: 'Foo ABC',
    createdAt: moment()
      .add(2, 'hours')
      .toDate(),
  },
  ...transactions.map(transaction => ({ ...transaction, id: transaction.providerTransactionIdentifier })),
]
