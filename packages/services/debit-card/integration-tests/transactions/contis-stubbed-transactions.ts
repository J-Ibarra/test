import moment from 'moment'

export const contisStubbedTransactions = {
  TransactionResList: [
    {
      UTCTransactionDate: moment()
        .add(2, 'hours')
        .toDate(),
      Description: 'Bar ABC',
      TransactionAmount: 19,
      TransactionType: '008',
      TransactionID: 9,
    },
    {
      UTCTransactionDate: moment().format(),
      Description: 'Foo ABC',
      TransactionAmount: 10,
      TransactionType: '006',
      TransactionID: 10,
    },
    {
      UTCTransactionDate: moment()
        .subtract(1, 'hours')
        .toDate(),
      Description: 'Bar ABC',
      TransactionAmount: 12,
      TransactionType: '008',
      TransactionID: 12,
    },
  ],
  ResponseCode: 'foo',
}
