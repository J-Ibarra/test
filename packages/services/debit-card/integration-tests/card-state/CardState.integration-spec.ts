import request from 'supertest'
import { EntityManager } from 'typeorm'
import { setUp, tearDown, cleanDatabase } from '../utils/before-each.util'
import { DebitCard, DebitCardProvider } from '../../src/shared-components/models'
import { ContisEndpointPath } from '../../src/shared-components/providers'
import { defaultTestUser, cardCurrency, presentAddress } from '../utils/test-data'
import { DebitCardStatus } from '../../src/shared-components/models/card/DebitCardStatus.enum'
import { OrderCardRequest } from '../../src/app/card-order/models/order-card-request.model'
import { CardRepository } from '../../src/shared-components/repositories'

describe('CardStateController', () => {
  let app
  let moduleFixture
  let entityManager: EntityManager

  const orderCardRequest: OrderCardRequest = {
    cardCurrency,
    presentAddress,
  }

  describe('when all Contis requests pass', () => {
    beforeEach(async () => {
      const appAndFixture = await setUp()
      app = appAndFixture.app
      moduleFixture = appAndFixture.moduleFixture

      const cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)

      entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
      await cardRepository.createNewCard({
        accountId: '12',
        provider: DebitCardProvider.contis,
        currency: cardCurrency,
        balance: 10,
        providerAccountDetails: {} as any,
      })
    })

    it('should lock the debit card of the account', async () => {
      return request(app.getHttpServer())
        .post('/api/debit-cards/state/lock')
        .send()
        .expect(201)
        .then(async () => {
          const debitCard: DebitCard | undefined = await entityManager.findOne(DebitCard, {
            accountId: defaultTestUser.accountId,
          })

          expect((debitCard as any).status).toEqual(DebitCardStatus.lockedOut)
        })
    })

    it('should set debit card state back to normal', async () => {
      return request(app.getHttpServer())
        .post('/api/debit-cards/state/normal')
        .send()
        .expect(201)
        .then(async () => {
          const debitCard: DebitCard | undefined = await entityManager.findOne(DebitCard, {
            accountId: defaultTestUser.accountId,
          })

          expect((debitCard as any).status).toEqual(DebitCardStatus.active)
        })
    })

    afterEach(async () => await cleanDatabase())
  })

  describe('when contis \'setConsumerAsLockout\' request is required to fail', () => {
    beforeEach(async () => {
      const appAndFixture = await setUp({
        integrationTestsConfig: {
          rejectRequest: new Map([[ContisEndpointPath.setConsumerAsLockout, true]]),
        },
      })
      app = appAndFixture.app
      moduleFixture = appAndFixture.moduleFixture

      entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)

      await request(app.getHttpServer())
        .post('/api/debit-cards')
        .send(orderCardRequest)
    })

    it('should not load the amount passed into the available balance of the debit card', async () => {
      return request(app.getHttpServer())
        .post('/api/debit-cards/state/lock')
        .send()
        .then(async () => {
          const debitCard: DebitCard | undefined = await entityManager.findOne(DebitCard, {
            accountId: defaultTestUser.accountId,
          })

          expect((debitCard as any).status).toEqual(DebitCardStatus.lockedOut)
        })
    })

    afterEach(async () => await cleanDatabase())
  })

  afterEach(async () => await tearDown(app, moduleFixture))
})
