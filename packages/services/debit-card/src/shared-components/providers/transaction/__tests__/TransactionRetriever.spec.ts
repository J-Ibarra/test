import { TransactionRetriever } from '../TransactionRetriever'
import {
  cardRepository,
  transactionRepository,
  topUpRequestRepository,
  cardProviderFacadeFactory,
  accountId,
  testDebitCard,
  cardProviderFacade,
} from './test.utils'
import { CardTransactionView } from '../CardTransactionView'
import { topUpRequests, transactions, contisTransactions } from './test.data'
import { CoreTransactionDetails } from '../../../models'

describe('TransactionRetriever', () => {
  let transactionRetriever: TransactionRetriever

  beforeEach(() => {
    transactionRetriever = new TransactionRetriever(
      cardRepository,
      transactionRepository,
      topUpRequestRepository,
      cardProviderFacadeFactory,
    )

    jest.spyOn(cardRepository, 'getDebitCardForAccount').mockResolvedValue(testDebitCard)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('refreshTransactions should get all top up requests details', async () => {
    jest.spyOn(transactionRepository, 'getAllForCard').mockResolvedValue(transactions)
    jest.spyOn(transactionRepository, 'insert').mockResolvedValue({ raw: [{ id: 2 }] })
    jest.spyOn(topUpRequestRepository, 'getAllTopUpRequestsForDebitCard').mockResolvedValue(topUpRequests)
    jest.spyOn(cardProviderFacade, 'getTransactions').mockResolvedValue(contisTransactions)

    const transactionViews = await transactionRetriever.refreshTransactions(accountId)

    expect(transactionViews).toEqual([
      CardTransactionView.ofTransaction({ ...(contisTransactions[0] as any), id: 2 }),
      CardTransactionView.ofTopUpRequest(CoreTransactionDetails.ofTopUpRequest(topUpRequests[0]), topUpRequests[0]),
      CardTransactionView.ofTopUpRequest(transactions[0], topUpRequests[1]),
      CardTransactionView.ofTransaction(transactions[1]),
    ])
  })
})
