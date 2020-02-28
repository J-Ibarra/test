import request from 'supertest'
import { EntityManager } from 'typeorm'
import { setUp, tearDown, cleanDatabase } from '../utils/before-each.util'
import { CardOrderRequestRepository } from '../../src/shared-components/repositories/CardOrderRequestRepository'
import { CardOrderRequestStatus, CardOrderRequest, DebitCard, ContisAccountDetails } from '../../src/shared-components/models'
import {
  defaultTestUser,
  cardCurrency,
  testContisAccountIdentifier,
  presentAddress,
  testContisConsumerId,
} from '../utils/test-data'
import { ContisEndpointPath, ConfigSourceFactory } from '../../src/shared-components/providers'
import { OrderCardRequest } from '../../src/app/card-order/models/order-card-request.model'

describe('CardOrderController', () => {
  let app
  let moduleFixture
  let cardOrderRequestRepository: CardOrderRequestRepository
  let entityManager: EntityManager

  const orderCardRequest: OrderCardRequest = {
    cardCurrency,
    presentAddress,
  }

  describe('when \'kyc_verified\' user is required in the mocked data', () => {
    beforeAll(async () => {
      const appAndFixture = await setUp()
      app = appAndFixture.app
      moduleFixture = appAndFixture.moduleFixture

      cardOrderRequestRepository = appAndFixture.moduleFixture.get<CardOrderRequestRepository>(CardOrderRequestRepository)
      entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
    })

    it('should create a card if the user is \'kyc_verified\'', async () => {
      return request(app.getHttpServer())
        .post('/api/debit-cards')
        .send(orderCardRequest)
        .expect(201)
        .then(async () => {
          const cardOrderRequest: CardOrderRequest = await cardOrderRequestRepository.getLatestOrderRequestForAccount(
            defaultTestUser.accountId,
          )

          expect(cardOrderRequest.currency).toEqual(cardCurrency)
          expect(cardOrderRequest.status).toEqual(CardOrderRequestStatus.completed)
          expect(cardOrderRequest.presentAddress).toEqual(presentAddress)

          const debitCard: DebitCard | undefined = await entityManager.findOne(DebitCard, {
            accountId: defaultTestUser.accountId,
          })

          expect(debitCard).toBeDefined()
          expect(debitCard!.providerAccountDetails as ContisAccountDetails).toEqual({
            consumerId: testContisConsumerId,
            accountId: testContisAccountIdentifier,
          })

          expect(debitCard!.balance).toEqual(-ConfigSourceFactory.getConfigSourceForEnvironment().getContisConfig().cardOrderFee)
        })
    })

    afterEach(async () => await cleanDatabase())
  })

  describe('when not \'kyc_verified\' user is required in the mocked data', () => {
    beforeAll(async () => {
      const appAndFixture = await setUp({ integrationTestsConfig: { setNotVerifiedUser: true } })
      app = appAndFixture.app
      moduleFixture = appAndFixture.moduleFixture

      cardOrderRequestRepository = appAndFixture.moduleFixture.get<CardOrderRequestRepository>(CardOrderRequestRepository)
      entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
    })

    /* tslint:disable-next-line:max-line-length */
    it('should save user order request with \'kyc_pending\' status and not create card if the user is not kyc verified', async () => {
      return request(app.getHttpServer())
        .post('/api/debit-cards')
        .send(orderCardRequest)
        .expect(201)
        .then(async () => {
          const cardOrderRequest: CardOrderRequest = await cardOrderRequestRepository.getLatestOrderRequestForAccount(
            defaultTestUser.accountId,
          )

          expect(cardOrderRequest.currency).toEqual(cardCurrency)
          expect(cardOrderRequest.status).toEqual(CardOrderRequestStatus.kycPending)

          const debitCard: DebitCard | undefined = await entityManager.findOne(DebitCard, {
            accountId: defaultTestUser.accountId,
          })

          expect(debitCard).toBeUndefined()
        })
    })

    afterEach(async () => await cleanDatabase())
  })

  describe('when contis \'AddConsumer\' request is required to fail', () => {
    beforeAll(async () => {
      const appAndFixture = await setUp({
        integrationTestsConfig: {
          rejectRequest: new Map([[ContisEndpointPath.addConsumers, true]]),
        },
      })
      app = appAndFixture.app
      moduleFixture = appAndFixture.moduleFixture

      cardOrderRequestRepository = appAndFixture.moduleFixture.get<CardOrderRequestRepository>(CardOrderRequestRepository)
      entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
    })

    /* tslint:disable-next-line:max-line-length */
    it('should save user order request with \'kyc_pending\' status and not create card', async () => {
      return request(app.getHttpServer())
        .post('/api/debit-cards')
        .send(orderCardRequest)
        .expect(201)
        .then(async () => {
          const cardOrderRequest: CardOrderRequest = await cardOrderRequestRepository.getLatestOrderRequestForAccount(
            defaultTestUser.accountId,
          )

          expect(cardOrderRequest.currency).toEqual(cardCurrency)
          expect(cardOrderRequest.status).toEqual(CardOrderRequestStatus.orderFailed)

          const debitCard: DebitCard | undefined = await entityManager.findOne(DebitCard, {
            accountId: defaultTestUser.accountId,
          })

          expect(debitCard).toBeUndefined()
        })
    })

    afterEach(async () => await cleanDatabase())
  })

  describe('when address history is not valid', () => {
    beforeAll(async () => {
      const appAndFixture = await setUp()
      app = appAndFixture.app
      moduleFixture = appAndFixture.moduleFixture

      cardOrderRequestRepository = appAndFixture.moduleFixture.get<CardOrderRequestRepository>(CardOrderRequestRepository)
      entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
    })

    afterEach(async () => await cleanDatabase())
  })

  afterEach(async () => await tearDown(app, moduleFixture))
})
