import request from 'supertest'

import { setUp, tearDown } from '../../utils/before-each.util'
import { DebitCard, DebitCardProvider, TopUpRequest, KinesisCryptoCurrency } from '../../../src/shared-components/models'
import { defaultTestUser, cardCurrency, cardDetails } from '../../utils/test-data'
import { CardRepository, TopUpRequestRepository } from '../../../src/shared-components/repositories'

describe('TopUpController:get-endpoints', () => {
  let app
  let moduleFixture
  let cardRepository: CardRepository
  let topUpRequestRepository: TopUpRequestRepository
  let debitCard: DebitCard

  beforeAll(async () => {
    const appAndFixture = await setUp()
    app = appAndFixture.app
    moduleFixture = appAndFixture.moduleFixture

    cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)
    topUpRequestRepository = appAndFixture.moduleFixture.get<TopUpRequestRepository>(TopUpRequestRepository)
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

  it('/top-ups/{topUpId} should retrieve top up request', async () => {
    const createdRequest: TopUpRequest = await topUpRequestRepository.createTopUpRequest(
      debitCard,
      1,
      10,
      KinesisCryptoCurrency.kag,
    )
    delete createdRequest.debitCard

    return request(app.getHttpServer())
      .get(`/api/debit-cards/top-ups/${createdRequest.id}`)
      .expect(200)
      .expect({
        ...createdRequest,
        createdAt: createdRequest.createdAt.toISOString(),
        amountToTopUp: 0,
        amountFilled: 0,
      })
  })

  afterEach(async () => await tearDown(app, moduleFixture))
})
