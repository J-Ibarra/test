import request from 'supertest'

import { setUp, cleanDatabase, tearDown } from '../utils/before-each.util'
import { TopUpRequestRepository, TransactionRepository, CardRepository } from '../../src/shared-components/repositories'
import { DebitCard, DebitCardProvider, CoreTransactionDetails } from '../../src/shared-components/models'
import { cardCurrency, cardDetails, createTopUpRequests, createTransactions } from '../utils/test-data'
import { defaultTestUser, ContisEndpointPath, CardTransactionView } from '../../src/shared-components/providers'
import { contisStubbedTransactions } from './contis-stubbed-transactions'
/* tslint:disable-next-line:max-line-length */
import { ListTransactionResponse } from '../../src/shared-components/providers/debit-card-provider/contis/responses/ListTransactionsResponse'

describe('AdminTransactionController:integration-spec', () => {
  let app
  let topUpRequestRepository: TopUpRequestRepository
  let cardRepository: CardRepository
  let debitCard: DebitCard
  let transactionRepository: TransactionRepository

  beforeAll(async () => {
    const appAndFixture = await setUp({
      contisStubbedEndpoints: new Map([
        [ContisEndpointPath.listTransactions, new ListTransactionResponse(contisStubbedTransactions)],
      ]),
    })
    app = appAndFixture.app

    topUpRequestRepository = appAndFixture.moduleFixture.get<TopUpRequestRepository>(TopUpRequestRepository)
    transactionRepository = appAndFixture.moduleFixture.get<TransactionRepository>(TransactionRepository)
    cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)
  })

  beforeEach(async () => {
    debitCard = await cardRepository.createNewCard({
      accountId: defaultTestUser.accountId,
      provider: DebitCardProvider.contis,
      providerAccountDetails: cardDetails.providerAccountDetails as any,
      currency: cardCurrency,
      balance: 0,
    })
  })

  it('/transactions should merge top up requests and transactions', async () => {
    const topUpRequests = createTopUpRequests(debitCard)
    const transactions = createTransactions(debitCard)

    const insertedTopUpRequests = await topUpRequestRepository.insert(topUpRequests)
    transactions[0] = {
      ...transactions[0],
      metadata: {
        topUpRequestId: insertedTopUpRequests.raw[1].id,
      },
    } as any

    await transactionRepository.insert(transactions)

    return request(app.getHttpServer())
      .get(`/api/debit-cards/admin/transactions/${defaultTestUser.accountId}`)
      .expect(200)
      .then(async ({ body }) => {
        expect(body).toEqual([
          CardTransactionView.ofTopUpRequest(CoreTransactionDetails.ofTopUpRequest(topUpRequests[0]), topUpRequests[0]),
          CardTransactionView.ofTopUpRequest(transactions[0], topUpRequests[1]),
          CardTransactionView.ofTransaction(transactions[1]),
          CardTransactionView.ofTransaction(transactions[2]),
        ])
      })
  })

  it('/transactions/refresh should fetch transactions from contis', async () => {
    const topUpRequests = createTopUpRequests(debitCard)
    const transactions = createTransactions(debitCard)

    const insertedTopUpRequests = await topUpRequestRepository.insert(topUpRequests)
    transactions[0] = {
      ...transactions[0],
      metadata: {
        topUpRequestId: insertedTopUpRequests.raw[1].id,
      },
    } as any

    await transactionRepository.insert(transactions)

    return request(app.getHttpServer())
      .post('/api/debit-cards/transactions/refresh')
      .expect(200)
      .then(async ({ body }) => {
        expect(body).toHaveLength(5)
        expect(body[0].amount).toEqual(contisStubbedTransactions.TransactionResList[0].TransactionAmount)
        expect(body).toEqual([
          body[0],
          CardTransactionView.ofTopUpRequest(CoreTransactionDetails.ofTopUpRequest(topUpRequests[0]), topUpRequests[0]),
          CardTransactionView.ofTopUpRequest(transactions[0], topUpRequests[1]),
          CardTransactionView.ofTransaction(transactions[1]),
          CardTransactionView.ofTransaction(transactions[2]),
        ])
      })
  })

  afterEach(async () => await cleanDatabase())

  afterAll(async () => await tearDown(app.app, app.moduleFixture))
})
