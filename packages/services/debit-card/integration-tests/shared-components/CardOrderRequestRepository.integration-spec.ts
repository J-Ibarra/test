import { EntityManager } from 'typeorm'
import { setUp, tearDown, cleanDatabase } from '../utils/before-each.util'

import { CurrencyCode, CardOrderRequest, CardOrderRequestStatus } from '../../src/shared-components/models'
import { presentAddress } from '../utils/test-data'
import { CardOrderRequestRepository } from '../../src/shared-components/repositories/CardOrderRequestRepository'

describe('integration:CardOrderRequestRepository', () => {
  let app
  let cardOrderRequestRepository: CardOrderRequestRepository
  let entityManager

  const accountId = '5'

  beforeAll(async () => {
    const appAndFixture = await setUp()
    app = appAndFixture

    cardOrderRequestRepository = appAndFixture.moduleFixture.get<CardOrderRequestRepository>(CardOrderRequestRepository)
    entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
  })

  afterEach(() => cleanDatabase())

  describe('saveCardOrderRequest', () => {
    it('should save a new card order request', async () => {
      const cardOrderRequest: CardOrderRequest = await cardOrderRequestRepository.saveCardOrderRequest(
        accountId,
        CurrencyCode.EUR,
        CardOrderRequestStatus.kycPending,
        presentAddress,
      )

      expect(cardOrderRequest.accountId).toEqual(accountId)
    })
  })

  describe('updateOrderRequestStatus', () => {
    const newStatus = CardOrderRequestStatus.completed

    it('should update the card order request status', async () => {
      await entityManager.transaction(async manager => {
        await cardOrderRequestRepository.saveCardOrderRequest(
          accountId,
          CurrencyCode.EUR,
          CardOrderRequestStatus.kycPending,
          presentAddress,
          manager,
        )

        await cardOrderRequestRepository.updateOrderRequestStatus(accountId, CurrencyCode.EUR, newStatus, manager)

        const cardOrderRequestUpdated = await cardOrderRequestRepository.getLatestOrderRequestForAccount(accountId, manager)

        expect(cardOrderRequestUpdated.status).toEqual(newStatus)
      })
    })
  })

  describe('getLatestOrderRequestForAccount', () => {
    it('should get card order request for an account', async () => {
      await cardOrderRequestRepository.saveCardOrderRequest(
        accountId,
        CurrencyCode.EUR,
        CardOrderRequestStatus.kycPending,
        presentAddress,
        entityManager,
      )

      const cardOrderRequest: CardOrderRequest = await cardOrderRequestRepository.getLatestOrderRequestForAccount(
        accountId,
        entityManager,
      )

      expect(cardOrderRequest.accountId).toEqual(accountId)
    })
  })

  describe('getOrderRequestsByStatus', () => {
    it('should get get all card order requests for with a certain status', async () => {
      await cardOrderRequestRepository.saveCardOrderRequest(
        accountId,
        CurrencyCode.EUR,
        CardOrderRequestStatus.kycPending,
        presentAddress,
        entityManager,
      )

      const cardOrderRequests: CardOrderRequest[] = await cardOrderRequestRepository.getOrderRequestsByStatus(
        CardOrderRequestStatus.kycPending,
        entityManager,
      )

      expect(cardOrderRequests.length).toBeGreaterThan(0)
    })
  })

  afterAll(async () => await tearDown(app.app, app.moduleFixture))
})
