import request from 'supertest'

import { setUp, tearDown } from '../../utils/before-each.util'
import { DebitCardProvider } from '../../../src/shared-components/models'
import { defaultTestUser, cardCurrency, cardDetails } from '../../utils/test-data'
import { CardRepository } from '../../../src/shared-components/repositories'
import { PlaceOrderFacadeStub } from '../../../src/shared-components/providers'

describe('TopUpController:order-creation-failure', () => {
  let app
  let moduleFixture
  let cardRepository: CardRepository
  const amount = 3000
  const topUpRequest = {
    amount,
    currency: cardCurrency,
  }

  beforeAll(async () => {
    const appAndFixture = await setUp({
      integrationTestsConfig: {
        placeOrderStub: new PlaceOrderFacadeStub(Promise.reject('Unable to place order')),
      },
    })
    app = appAndFixture.app
    moduleFixture = appAndFixture.moduleFixture
    cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)
  })

  beforeEach(async () => {
    await cardRepository.createNewCard({
      accountId: defaultTestUser.accountId,
      provider: DebitCardProvider.contis,
      providerAccountDetails: cardDetails.providerAccountDetails as any,
      currency: cardCurrency,
      balance: 0,
    })
  })

  it('should fail when Create sell market order fails', async () => {
    return request(app.getHttpServer())
      .post('/api/debit-cards/top-ups')
      .send(topUpRequest)
      .timeout(30_000)
      .expect(500)
  })

  afterAll(async () => await tearDown(app, moduleFixture))
})
