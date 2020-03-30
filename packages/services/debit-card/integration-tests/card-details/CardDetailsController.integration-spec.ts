import request from 'supertest'
import { INestApplication } from '@nestjs/common'

import { setUp, tearDown } from '../utils/before-each.util'
import { CardRepository } from '../../src/shared-components/repositories'
import {
  DebitCardProvider,
  CurrencyCode,
  ContisAccountDetails,
  DebitCard,
  DebitCardStatus,
} from '../../src/shared-components/models'
import { EntityManager } from 'typeorm'
import { testCardDetails } from '../utils/test-data'

describe('CardDetailsController:integration', () => {
  let app: INestApplication
  let moduleFixture
  let cardRepository: CardRepository
  let entityManager: EntityManager
  let card: DebitCard

  beforeAll(async () => {
    const appAndFixture = await setUp()
    app = await appAndFixture.app
    moduleFixture = appAndFixture.moduleFixture

    cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)
    entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)

    card = await cardRepository.createNewCard({
      accountId: '12',
      provider: DebitCardProvider.contis,
      providerAccountDetails: {
        consumerId: 1,
        cardId: 123456,
      } as ContisAccountDetails,
      currency: CurrencyCode.GBP,
      balance: 0,
      entityManager,
    })
  })

  it('api/debit-cards (GET) should return card details', async () => {
    return request(app.getHttpServer())
      .get('/api/debit-cards')
      .expect(200)
      .expect({
        card: {
          currency: card.currency,
          status: DebitCardStatus.underReview,
          balance: 0,
        },
        cardOrdered: true,
      })
  })

  it('api/debit-cards/on-card (GET) should return card details', async () => {
    return request(app.getHttpServer())
      .get('/api/debit-cards/on-card-details')
      .expect(200)
      .expect({
        lastFourDigits: testCardDetails.ObscuredCardNumber.slice(-4),
        displayName: testCardDetails.CardDisplayName,
      })
  })

  it.only('api/debit-cards/pin (GET) return 200 with response body: { pin: \'1234\' }', async () => {
    return request(app.getHttpServer())
      .get('/api/debit-cards/pin?cvv=123&dob=dob')
      .expect(200)
      .expect({ pin: '1234' })
  })

  it('api/debit-cards/number (GET) return 200 with response body: { lastFourDigits: \'6789\' }', async () => {
    return request(app.getHttpServer())
      .get('/api/debit-cards/number')
      .expect(200)
      .expect({ lastFourDigits: '6789' })
  })

  afterAll(async () => await tearDown(app, moduleFixture))
})
