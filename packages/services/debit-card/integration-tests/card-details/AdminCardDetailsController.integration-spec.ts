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
import { defaultTestUser } from '../../src/shared-components/providers'

describe('AdminCardDetailsController:integration', () => {
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

  it('api/debit-cards/admin/:accountId (GET) should return card details for account', async () => {
    return request(app.getHttpServer())
      .get(`/api/debit-cards/admin/${defaultTestUser.accountId}`)
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

  afterAll(async () => await tearDown(app, moduleFixture))
})
